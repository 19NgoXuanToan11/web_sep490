import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { RefreshCw, Settings, MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/shared/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import CalendarShell from '@/components/Calendar'
import ThresholdPanel from '@/features/thresholds/ThresholdPanel'
import { formatDate, formatDateRange } from '@/shared/lib/date-utils'
import { farmActivityService } from '@/shared/api/farmActivityService'
import { showSuccessToast, showErrorToast } from '@/shared/lib/toast-manager'
import type { BackendScheduleListProps, ScheduleListItem, ScheduleStatusString, CreateScheduleRequest } from './types'
import { isActiveStatus, getStatusLabel, translatePlantStage, getDiseaseLabel, getFarmActivityStatusInfo, translateActivityType, activityTypeLabels, farmActivityStatusOptions } from './utils/labels'
import ScheduleLogPanel from './components/ScheduleLogPanel'
import ManagerOverview from './components/ManagerOverview'
import ManagerTable from './components/ManagerTable'
import { useScheduleData } from './hooks/useScheduleData'
import { useScheduleActions } from './hooks/useScheduleActions'
import { useScheduleDialogs } from './hooks/useScheduleDialogs'
import {
    CreateScheduleDialog,
    EditScheduleDialog,
    AssignStaffDialog,
    CreateActivityDialog,
    LogModalDialog,
    UpdateStageModalDialog,
} from './dialogs'
import { accountProfileApi } from '@/shared/api/auth'

export function BackendScheduleList({
    showCreate: externalShowCreate,
    onShowCreateChange,
    filteredItems: externalFilteredItems,
}: BackendScheduleListProps) {
    const scheduleData = useScheduleData()
    const scheduleDialogs = useScheduleDialogs()
    const scheduleActions = useScheduleActions(
        scheduleData.allSchedules,
        scheduleData.load,
        scheduleData.loadAllSchedules
    )
    const navigate = useNavigate()
    const openDetailPage = useCallback((schedule: ScheduleListItem | null, tab?: 'info' | 'calendar' | 'logs') => {
        if (!schedule || !schedule.scheduleId) return
        const base = `/manager/season/${schedule.scheduleId}`
        if (tab) navigate(`${base}?tab=${tab}`)
        else navigate(base)
    }, [navigate])
    const [selectedFarmActivity, setSelectedFarmActivity] = useState<any>(null)
    const [showFarmActivityDetail, setShowFarmActivityDetail] = useState(false)
    const [editingFarmActivity, setEditingFarmActivity] = useState<any>(null)
    const [showEditFarmActivity, setShowEditFarmActivity] = useState(false)
    const [statusEditorOpen, setStatusEditorOpen] = useState(false)
    const [statusEditorValue, setStatusEditorValue] = useState<string | null>(null)
    const [statusEditorLoading, setStatusEditorLoading] = useState(false)
    const [showDayEventsDialog, setShowDayEventsDialog] = useState(false)
    const [dayEventsDate, setDayEventsDate] = useState<Date | null>(null)
    const [dayEventsList, setDayEventsList] = useState<any[]>([])
    const [editFarmActivityForm, setEditFarmActivityForm] = useState<{
        activityType: string
        startDate: string
        endDate: string
        staffId?: number
        scheduleId?: number
        status?: string
    }>({
        activityType: '',
        startDate: '',
        endDate: '',
        staffId: undefined,
        scheduleId: undefined,
        status: 'ACTIVE',
    })
    const [, setEditFarmActivityLoading] = useState(false)
    const [editFarmActivitySubmitting, setEditFarmActivitySubmitting] = useState(false)
    const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false)
    const [confirmTargetRaw, setConfirmTargetRaw] = useState<any>(null)

    const showCreate = externalShowCreate ?? scheduleDialogs.showCreate
    const filteredItems = externalFilteredItems !== undefined ? externalFilteredItems : null
    const [quickFilter, setQuickFilter] = useState<null | 'due7' | 'overdue' | 'missingLogs'>(null)

    const todayString = useMemo(() => new Date().toISOString().split('T')[0], [])

    const setShowCreate = onShowCreateChange ?? scheduleDialogs.setShowCreate

    const baseDisplayItems = filteredItems ?? scheduleData.paginatedSchedules

    const displayItems = useMemo(() => {
        if (!quickFilter) return baseDisplayItems
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return baseDisplayItems.filter((s: any) => {
            try {
                const parseDate = (d?: string | null) => {
                    if (!d) return null
                    const dt = new Date(d)
                    if (Number.isNaN(dt.getTime())) return null
                    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
                }
                const end = parseDate(s.endDate ?? s.EndDate ?? s.endDateString)
                const lastLog = s.lastLogDate ?? s.lastLogAt ?? s.last_crop_log_date ?? s.lastLogCreatedAt
                if (quickFilter === 'due7') {
                    if (!end) return false
                    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return diff >= 0 && diff <= 7
                }
                if (quickFilter === 'overdue') {
                    if (!end) return false
                    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    return diff < 0
                }
                if (quickFilter === 'missingLogs') {
                    if (!lastLog) return true
                    try {
                        const last = new Date(lastLog)
                        if (Number.isNaN(last.getTime())) return true
                        const diffDays = Math.floor((today.getTime() - new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()) / (1000 * 60 * 60 * 24))
                        return diffDays >= 3
                    } catch {
                        return true
                    }
                }
            } catch {
                return false
            }
            return false
        })
    }, [baseDisplayItems, quickFilter])

    const cropGroups = useMemo(() => {
        const groups = new Map<string, ScheduleListItem[]>()
        for (const s of displayItems) {
            const key = s?.cropView?.cropName ?? 'Khác'
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(s)
        }
        const entries = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length)
        return entries.slice(0, 3)
    }, [displayItems])
    const lastAutoUpdatedScheduleId = useRef<number | null>(null)
    const externalLogUpdaterRef = useRef<((item: any, mode: 'create' | 'update' | 'delete') => void) | null>(null)

    const scheduleCalendarEvents = useMemo(() => {
        if (!scheduleDialogs.scheduleDetail) return []

        const parseDDMMYYYY = (s?: string | null) => {
            if (!s) return null
            const parts = String(s).split('/')
            if (parts.length !== 3) return null
            const d = Number(parts[0])
            const m = Number(parts[1])
            const y = Number(parts[2])
            if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return null
            return new Date(y, m - 1, d)
        }

        const detail = scheduleDialogs.scheduleDetail

        const activities = Array.isArray(detail.farmActivityView) ? detail.farmActivityView : []

        const mapped = activities
            .map((fa: any) => {
                const start = parseDDMMYYYY(fa.startDate) ?? parseDDMMYYYY(detail.startDate) ?? null
                const end = parseDDMMYYYY(fa.endDate) ?? parseDDMMYYYY(detail.endDate) ?? null
                if (!start || !end) return null
                const rawStatus = fa.status ?? fa.Status ?? fa.Status
                const normalizedStatus = String(rawStatus ?? '').toUpperCase()
                const isActive = (rawStatus === 1 || normalizedStatus === 'ACTIVE')
                const isCompleted = normalizedStatus === 'COMPLETED'
                const isDeactivated = normalizedStatus === 'DEACTIVATED'
                return {
                    id: String(fa.farmActivitiesId ?? `${detail.scheduleId}-${Math.random()}`),
                    title: translateActivityType(fa.activityType ?? fa.ActivityType ?? '') || `Hoạt động #${fa.farmActivitiesId ?? ''}`,
                    start,
                    end,
                    allDay: true,
                    isActive,
                    color: isDeactivated ? '#8B0000' : (isCompleted ? '#34D399' : (isActive ? '#F59E0B' : '#9CA3AF')),
                    raw: { ...fa, _parentSchedule: detail },
                }
            })
            .filter((x: any) => x !== null)
            .sort((a: any, b: any) => {
                if ((a.isActive === b.isActive)) return 0
                return a.isActive ? -1 : 1
            })

        if (mapped.length === 0) {
            return []
        }

        return mapped
    }, [scheduleDialogs.scheduleDetail])

    useEffect(() => {
        const shouldLoadMetadata = showCreate || scheduleDialogs.showCreate || scheduleDialogs.showEdit || scheduleDialogs.showAssignStaff || scheduleDialogs.showCreateActivity
        if (!shouldLoadMetadata) return
        let cancelled = false
            ; (async () => {
                try {
                    scheduleData.setMetaLoading(true)
                    const result = await scheduleData.loadReferenceData()
                    if (cancelled) return
                    scheduleData.setFarms(result.farmOptions)
                    scheduleData.setCrops(result.cropOptions)
                    scheduleData.setStaffs(result.staffOptions)
                    scheduleData.setActivities(result.activityOptions)
                } catch (e) {
                    if (!cancelled) {
                    }
                } finally {
                    if (!cancelled) scheduleData.setMetaLoading(false)
                }
            })()
        return () => {
            cancelled = true
        }
    }, [showCreate, scheduleDialogs.showCreate, scheduleDialogs.showEdit, scheduleDialogs.showAssignStaff, scheduleDialogs.showCreateActivity, scheduleData.loadReferenceData, scheduleData.setFarms, scheduleData.setCrops, scheduleData.setStaffs, scheduleData.setActivities, scheduleData.setMetaLoading])

    const handleCreateDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleCreateDialogChange(open)
        setShowCreate(open)
    }, [scheduleDialogs, setShowCreate])

    const handleEditDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleEditDialogChange(open)
    }, [scheduleDialogs])

    const handleAssignStaffDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleAssignStaffDialogChange(open)
    }, [scheduleDialogs])

    const handleCreateActivityDialogChange = useCallback((open: boolean) => {
        scheduleDialogs.handleCreateActivityDialogChange(open)
    }, [scheduleDialogs])

    const openCreateActivityForSchedule = useCallback((schedule: ScheduleListItem | null) => {
        scheduleDialogs.openCreateActivityForSchedule(schedule)
    }, [scheduleDialogs])

    const submitCreateActivity = useCallback(async (form: {
        activityType: string
        startDate: string
        endDate: string
        staffId?: number
    }) => {
        const scheduleId = scheduleDialogs.selectedSchedule?.scheduleId ?? scheduleDialogs.scheduleDetail?.scheduleId
        if (!scheduleId) {
            return
        }

        await scheduleActions.handleCreateActivity({
            ...form,
            scheduleId,
        }, () => {
            scheduleDialogs.setShowCreateActivity(false)
            if (scheduleDialogs.scheduleDetail?.scheduleId) {
                scheduleActions.handleViewDetail(scheduleDialogs.selectedSchedule!, (detail) => {
                    scheduleDialogs.setScheduleDetail(detail)
                })
            }
        })
    }, [scheduleDialogs, scheduleActions])

    const submitCreateSchedule = useCallback(async (form: CreateScheduleRequest) => {
        const payload: Partial<CreateScheduleRequest> = {
            farmId: form.farmId,
            cropId: form.cropId,
            startDate: form.startDate,
            plantingDate: form.plantingDate || form.startDate,
            ...(form.harvestDate ? { harvestDate: form.harvestDate } : {}),
            quantity: form.quantity,
            pesticideUsed: form.pesticideUsed,
            diseaseStatus: 'None' as any,
            status: 'ACTIVE' as any,
        }

        await scheduleActions.handleCreateSchedule(payload as CreateScheduleRequest, () => {
            handleCreateDialogChange(false)
        })
    }, [scheduleActions, handleCreateDialogChange])



    const openCreateLogForSchedule = useCallback((schedule: ScheduleListItem) => {
        scheduleDialogs.openCreateLogForSchedule(schedule)
    }, [scheduleDialogs])

    useEffect(() => {
        if (scheduleDialogs.showDetail && scheduleDialogs.scheduleDetail?.scheduleId) {
            const scheduleId = scheduleDialogs.scheduleDetail.scheduleId
            lastAutoUpdatedScheduleId.current = scheduleId
            console.debug('[ScheduleDetail] opened modal for scheduleId:', scheduleId, '- auto-update disabled.')
        } else if (!scheduleDialogs.showDetail) {
            lastAutoUpdatedScheduleId.current = null
            scheduleDialogs.setShowThresholdInline(false)
            console.debug('[ScheduleDetail] closed modal; cleared lastAutoUpdatedScheduleId.')
        }
    }, [scheduleDialogs.showDetail, scheduleDialogs.scheduleDetail?.scheduleId, scheduleDialogs])

    const handleUpdateToday = useCallback(async (customDate?: string) => {
        if (!scheduleDialogs.scheduleDetail?.scheduleId) return
        console.debug('[ScheduleDetail] user-triggered updateToday for scheduleId:', scheduleDialogs.scheduleDetail.scheduleId, 'customDate:', customDate)
        await scheduleActions.handleUpdateToday(scheduleDialogs.scheduleDetail.scheduleId, customDate, () => {
            scheduleActions.handleViewDetail(scheduleDialogs.selectedSchedule!, (detail) => {
                scheduleDialogs.setScheduleDetail(detail)
            })
            if (customDate) {
                scheduleDialogs.setShowUpdateStageModal(false)
                scheduleDialogs.setCustomToday('')
            }
        })
    }, [scheduleDialogs, scheduleActions])

    const handleUpdateStageByDate = useCallback(() => {
        if (!scheduleDialogs.customToday) {
            return
        }
        handleUpdateToday(scheduleDialogs.customToday)
    }, [handleUpdateToday, scheduleDialogs.customToday])

    const formatMoisture = useCallback((value: any) => {
        if (value === null || value === undefined || value === '') return '-'
        if (typeof value === 'number') {
            if (value <= 1) return `${(value * 100).toFixed(0)}%`
            return String(value)
        }
        return String(value)
    }, [])

    const formatWateringFrequency = useCallback((value: any) => {
        if (value === null || value === undefined || value === '') return '-'
        if (!isNaN(Number(value))) {
            return `${Number(value)} lần/ngày`
        }
        return String(value)
    }, [])

    const handleEdit = useCallback((schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return

        const toIsoDate = (s?: string | null) => {
            if (!s) return ''
            if (s.includes('-')) return s.split('T')[0]
            if (s.includes('/')) {
                const parts = String(s).split('/')
                if (parts.length === 3) {
                    const [d, m, y] = parts
                    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
                }
            }
            return s
        }

        scheduleActions.handleViewDetail(schedule, (detail: any) => {
            const normalizeStatus = (s: any) => {
                if (s === null || s === undefined) return 'DEACTIVATED'
                if (typeof s === 'number') return s === 1 ? 'ACTIVE' : 'DEACTIVATED'
                return String(s)
            }

            scheduleDialogs.setEditForm({
                farmId: detail.farmId ?? detail.farmView?.farmId ?? 0,
                cropId: detail.cropId ?? detail.cropView?.cropId ?? 0,
                staffId:
                    detail.staffId ??
                    (detail.staff && (detail.staff.accountId || (detail.staff as any).accountId)) ??
                    0,
                startDate: toIsoDate(detail.startDate),
                endDate: toIsoDate(detail.endDate),
                plantingDate: detail.plantingDate ?? undefined,
                harvestDate: detail.harvestDate ?? undefined,
                quantity: detail.quantity ?? 0,
                status: normalizeStatus(detail.status),
                pesticideUsed: !!detail.pesticideUsed,
                diseaseStatus: (detail.diseaseStatus ?? null),
                farmActivitiesId: detail.farmActivitiesId ?? undefined,
            } as CreateScheduleRequest)

            scheduleDialogs.setSelectedSchedule(schedule)
            scheduleDialogs.setEditingScheduleId(schedule.scheduleId ?? null)
            scheduleDialogs.handleEditDialogChange(true)
        })
    }, [scheduleDialogs, scheduleActions])

    useEffect(() => {
        if (!scheduleDialogs.editingScheduleId) return
        let cancelled = false
            ; (async () => {
                try {
                    scheduleData.setMetaLoading(true)
                    let metaResult = null
                    try {
                        metaResult = await scheduleData.loadReferenceData()
                        if (cancelled) return
                        scheduleData.setFarms(metaResult.farmOptions)
                        scheduleData.setCrops(metaResult.cropOptions)
                        scheduleData.setStaffs(metaResult.staffOptions)
                        scheduleData.setActivities(metaResult.activityOptions)
                    } catch (metaErr) {
                        console.error('Failed to load metadata for edit dialog:', metaErr)
                    } finally {
                        if (!cancelled) scheduleData.setMetaLoading(false)
                    }
                } catch (e) {
                    if (!cancelled) {
                        scheduleDialogs.handleEditDialogChange(false)
                    }
                }
            })()
        return () => {
            cancelled = true
        }
    }, [scheduleDialogs.editingScheduleId, scheduleData.loadReferenceData])

    const handleUpdateSchedule = useCallback(async (form: CreateScheduleRequest) => {
        if (!scheduleDialogs.selectedSchedule?.scheduleId) return
        await scheduleActions.handleUpdateSchedule(scheduleDialogs.selectedSchedule.scheduleId, form, () => {
            scheduleDialogs.handleEditDialogChange(false)
        })
    }, [scheduleDialogs, scheduleActions])

    const handleAssignStaff = useCallback(async () => {
        if (!scheduleDialogs.selectedSchedule?.scheduleId || !scheduleDialogs.assignStaffId) return
        await scheduleActions.handleAssignStaff(scheduleDialogs.selectedSchedule.scheduleId, scheduleDialogs.assignStaffId, () => {
            scheduleDialogs.handleAssignStaffDialogChange(false)
        })
    }, [scheduleDialogs, scheduleActions])

    const handleUpdateStatus = useCallback(async (schedule: ScheduleListItem, nextStatus: ScheduleStatusString) => {
        await scheduleActions.handleUpdateStatus(schedule, nextStatus, () => {
            if (scheduleDialogs.showDetail && scheduleDialogs.scheduleDetail?.scheduleId === schedule.scheduleId) {
                scheduleActions.handleViewDetail(schedule, (detail) => {
                    scheduleDialogs.setScheduleDetail(detail)
                })
            }
        })
    }, [scheduleActions, scheduleDialogs])

    const handleEventMenuAction = useCallback(async (action: string, raw?: any) => {
        if (!raw) return
        if (action === 'confirm-deactivate-activity') {
            setConfirmTargetRaw(raw)
            setConfirmDeactivateOpen(true)
            return
        }
        const parentSchedule = raw?._parentSchedule ?? raw?._parentSchedule ?? raw?.raw ?? null
        if (action === 'create') {
            if (parentSchedule) {
                scheduleDialogs.setSelectedSchedule(parentSchedule)
            }
            scheduleDialogs.setLogModalMode('create')
            scheduleDialogs.setEditingLog(null)
            scheduleDialogs.setShowLogModal(true)
            setSelectedFarmActivity(raw)
        } else if (action === 'logs') {
            if (parentSchedule) {
                navigate(`/manager/season/${parentSchedule.scheduleId}?tab=logs`)
            }
        } else if (action === 'deactivate') {
            if (!parentSchedule) return
            void handleUpdateStatus(parentSchedule, 'DEACTIVATED')
        } else if (action === 'deactivate-activity') {
            try {
                const id = Number(raw?.farmActivitiesId ?? raw?.farmActivityId ?? raw?.id ?? raw?.activity?.farmActivitiesId)
                if (!id) return
                const res: any = await farmActivityService.changeStatus(id)
                showSuccessToast(res)
                await scheduleData.load()
                try {
                    const parent = parentSchedule
                    if (parent && scheduleDialogs.scheduleDetail?.scheduleId === parent.scheduleId) {
                        await scheduleActions.handleViewDetail(parent, (detail) => {
                            scheduleDialogs.setScheduleDetail(detail)
                        })
                    }
                } catch (e) {
                    console.error('Failed to refresh schedule detail after activity status change', e)
                }
            } catch (err) {
                showErrorToast(err)
            }
        } else if (action === 'confirm-deactivate-activity') {
            return
        } else if (action === 'editActivity') {
            if (!raw) return
            void (async () => {
                try {
                    const id = Number(raw.farmActivitiesId ?? raw.farmActivityId ?? raw.id)
                    if (!id) return
                    setEditFarmActivityLoading(true)
                    await scheduleData.loadReferenceData()
                    const fullActivity = await farmActivityService.getFarmActivityById(id)
                    setEditingFarmActivity(fullActivity)
                    const formatDateForInputLocal = (s?: string | null) => {
                        if (!s) return ''
                        try {
                            if (s.includes('/')) {
                                const parts = String(s).split('/')
                                if (parts.length === 3) {
                                    const day = parts[0].padStart(2, '0')
                                    const month = parts[1].padStart(2, '0')
                                    const year = parts[2]
                                    return `${year}-${month}-${day}`
                                }
                            }
                            if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s
                            if (s.includes('T')) return s.split('T')[0]
                        } catch {
                        }
                        return ''
                    }
                    const startDate = formatDateForInputLocal(fullActivity.startDate ?? raw.startDate)
                    const endDate = formatDateForInputLocal(fullActivity.endDate ?? raw.endDate)
                    setEditFarmActivityForm({
                        activityType: String(fullActivity.activityType ?? raw.activityType ?? ''),
                        startDate,
                        endDate,
                        staffId: (fullActivity as any).staffId ?? (raw as any).staffId ?? undefined,
                        scheduleId: (fullActivity as any).scheduleId ?? (raw as any).scheduleId ?? undefined,
                        status: (fullActivity as any).status ?? (raw as any).status ?? 'ACTIVE',
                    })
                    setShowEditFarmActivity(true)
                } catch (err) {
                    console.error('Failed to open edit farm activity', err)
                } finally {
                    setEditFarmActivityLoading(false)
                }
            })()
        }
    }, [scheduleDialogs, handleUpdateStatus, scheduleData])

    const handleDayClick = useCallback((date: Date, events: any[]) => {
        try {
            setDayEventsDate(date ?? null)
            const list = Array.isArray(events) ? [...events] : []
            const isEventActive = (ev: any) => {
                const raw = ev?.raw ?? ev
                const st = raw?.status ?? raw?.Status ?? raw?.raw?.status ?? raw?.raw?.Status
                if (typeof st === 'number') return st === 1
                return String(st ?? '').toUpperCase() === 'ACTIVE'
            }
            list.sort((a: any, b: any) => {
                const aa = isEventActive(a)
                const bb = isEventActive(b)
                if (aa === bb) return 0
                return aa ? -1 : 1
            })
            setDayEventsList(list)
            setShowDayEventsDialog(true)
        } catch (err) {
            console.error('Failed to open day events dialog', err)
        }
    }, [])

    const handleToggleActivity = useCallback(async (rawItem: any) => {
        if (!rawItem) return
        try {
            const id = Number(rawItem?.farmActivitiesId ?? rawItem?.farmActivityId ?? rawItem?.id ?? rawItem?.activity?.farmActivitiesId)
            if (!id) return
            const res: any = await farmActivityService.changeStatus(id)
            showSuccessToast(res)

            setDayEventsList(prev =>
                prev.map((ev: any) => {
                    const evId = Number(ev?.farmActivitiesId ?? ev?.farmActivityId ?? ev?.id ?? ev?.activity?.farmActivitiesId)
                    if (!evId || evId !== id) return ev
                    const oldStatus = ev?.status ?? ev?.Status
                    let newStatus: any = oldStatus
                    if (typeof oldStatus === 'number') {
                        newStatus = oldStatus === 1 ? 0 : 1
                    } else if (typeof oldStatus === 'string') {
                        newStatus = String(oldStatus).toUpperCase() === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE'
                    } else {
                        newStatus = oldStatus
                    }
                    return { ...ev, status: newStatus }
                })
            )

            await scheduleData.load()
            try {
                const parent = rawItem?._parentSchedule ?? rawItem?.raw ?? rawItem?.activity?._parentSchedule ?? null
                if (parent && scheduleDialogs.scheduleDetail?.scheduleId === parent.scheduleId) {
                    await scheduleActions.handleViewDetail(parent, (detail) => {
                        scheduleDialogs.setScheduleDetail(detail)
                    })
                }
            } catch (e) {
                console.error('Failed to refresh schedule detail after activity status change', e)
            }
        } catch (err) {
            showErrorToast(err)
        }
    }, [scheduleData, scheduleDialogs, scheduleActions])

    useEffect(() => {
        if (scheduleData.newlyCreatedIds.size > 0) {
            const timer = setTimeout(() => {
                scheduleData.setNewlyCreatedIds(new Set())
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [scheduleData.newlyCreatedIds, scheduleData])

    return (
        <>
            <ManagerOverview
                onFilterActive={() => {
                    setQuickFilter(null)
                    scheduleData.setSearchTerm('')
                    scheduleData.setStatusFilter('active')
                    scheduleData.setPageIndex(1)
                }}
                onFilterDeactivated={() => {
                    setQuickFilter(null)
                    scheduleData.setSearchTerm('')
                    scheduleData.setStatusFilter('inactive')
                    scheduleData.setPageIndex(1)
                }}
                onFilterOverdue={() => {
                    setQuickFilter('overdue')
                    scheduleData.setSearchTerm('')
                    scheduleData.setStatusFilter('all')
                    scheduleData.setPageIndex(1)
                }}
                onFilterMissingLogs={() => {
                    setQuickFilter('missingLogs')
                    scheduleData.setSearchTerm('')
                    scheduleData.setStatusFilter('all')
                    scheduleData.setPageIndex(1)
                }}
                onFilterTotal={() => {
                    setQuickFilter(null)
                    scheduleData.setSearchTerm('')
                    scheduleData.setStatusFilter('all')
                    scheduleData.setPageIndex(1)
                }}
            />

            {scheduleData.loading ? (
                <Card>
                    <CardContent className="p-12">
                        <div className="flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    </CardContent>
                </Card>
            ) : displayItems.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <p className="text-lg font-semibold text-gray-900">
                            {(() => {
                                if (scheduleData.searchTerm) return 'Không tìm thấy thời vụ nào'
                                if (scheduleData.statusFilter === 'active') return 'Chưa có thời vụ đang hoạt động'
                                if (scheduleData.statusFilter === 'inactive') return 'Chưa có thời vụ đã tạm dừng'
                                return 'Chưa có thời vụ'
                            })()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            {(() => {
                                if (scheduleData.searchTerm) return 'Không có thời vụ nào phù hợp với điều kiện lọc hiện tại.'
                                if (scheduleData.statusFilter === 'active') return 'Hãy tạo thời vụ mới hoặc kích hoạt các thời vụ đã tạm dừng.'
                                if (scheduleData.statusFilter === 'inactive') return 'Hãy tạo thời vụ mới hoặc kích hoạt các thời vụ đã tạm dừng.'
                                return 'Hãy tạo thời vụ đầu tiên.'
                            })()}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="space-y-6">
                        {cropGroups.map(([cropName, items]) => {
                            return (
                                <Card key={cropName} className="w-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">{cropName}</h3>
                                        </div>

                                        <div className="max-h-[420px] overflow-y-auto">
                                            <ManagerTable
                                                items={items}
                                                onOpenDetail={(s) => openDetailPage(s)}
                                                onAddLog={(s) => openCreateLogForSchedule(s)}
                                                onEdit={handleEdit}
                                                onUpdateStatus={handleUpdateStatus}
                                                onOpenLogEditor={(log) => {
                                                    try {
                                                        scheduleDialogs.openEditLog(log)
                                                    } catch {
                                                    }
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>


                </>
            )}

            <CreateScheduleDialog
                open={showCreate}
                onOpenChange={handleCreateDialogChange}
                form={scheduleDialogs.form}
                onFormChange={scheduleDialogs.setForm}
                farms={scheduleData.farms}
                crops={scheduleData.crops}
                metaLoading={scheduleData.metaLoading}
                actionLoading={scheduleActions.actionLoading}
                todayString={todayString}
                onSubmit={submitCreateSchedule}
            />

            <Dialog open={scheduleDialogs.showDetail} onOpenChange={scheduleDialogs.setShowDetail}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
                        <DialogTitle>Chi tiết thời vụ</DialogTitle>
                        {scheduleDialogs.scheduleDetail?.scheduleId && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        scheduleDialogs.setShowThresholdInline(!scheduleDialogs.showThresholdInline)
                                    }}
                                    className="p-2"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => scheduleDialogs.setShowUpdateStageModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    Demo cập nhật giai đoạn theo ngày
                                </Button>
                            </div>
                        )}
                    </DialogHeader>
                    {scheduleDialogs.scheduleDetail && (
                        <div>
                            <Tabs value={scheduleDialogs.detailActiveTab} onValueChange={(v) => scheduleDialogs.setDetailActiveTab(v as any)}>
                                <div className="flex items-center justify-between">
                                    <TabsList className="flex space-x-2">
                                        <TabsTrigger value="info">Thông tin</TabsTrigger>
                                        <TabsTrigger value="calendar">Lịch</TabsTrigger>
                                        <TabsTrigger value="logs">Nhật ký</TabsTrigger>
                                    </TabsList>
                                    <div className="flex items-center gap-2">
                                        {scheduleDialogs.detailActiveTab === 'calendar' && (
                                            <Button size="sm" onClick={() => { if (scheduleDialogs.selectedSchedule) openCreateActivityForSchedule(scheduleDialogs.selectedSchedule) }}>
                                                Tạo
                                            </Button>
                                        )}
                                        {scheduleDialogs.detailActiveTab === 'logs' && (
                                            <Button size="sm" onClick={() => { if (scheduleDialogs.selectedSchedule) openCreateLogForSchedule(scheduleDialogs.selectedSchedule) }}>
                                                Ghi nhận mới
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <TabsContent value="info">
                                    <div className={`grid grid-cols-1 ${scheduleDialogs.showThresholdInline ? 'lg:grid-cols-[1fr_360px]' : 'lg:grid-cols-1'} gap-6`}>
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><strong>Ngày bắt đầu:</strong> {formatDate(scheduleDialogs.scheduleDetail.startDate)}</div>
                                                    <div><strong>Ngày kết thúc dự kiến:</strong> {formatDate(scheduleDialogs.scheduleDetail.endDate)}</div>
                                                    <div>
                                                        <strong>Trạng thái:</strong>{' '}
                                                        <Badge variant={isActiveStatus(scheduleDialogs.scheduleDetail.status) ? 'golden' : 'destructive'}>
                                                            {getStatusLabel(scheduleDialogs.scheduleDetail.status)}
                                                        </Badge>
                                                    </div>
                                                    <div><strong>Thuốc BVTV:</strong> {scheduleDialogs.scheduleDetail.pesticideUsed ? 'Có' : 'Không'}</div>
                                                    <div><strong>Tình trạng bệnh:</strong> {getDiseaseLabel(scheduleDialogs.scheduleDetail.diseaseStatus)}</div>
                                                    <div>
                                                        <strong>Giai đoạn hiện tại:</strong>{' '}
                                                        {scheduleDialogs.scheduleDetail.currentPlantStage
                                                            ? translatePlantStage(scheduleDialogs.scheduleDetail.currentPlantStage)
                                                            : scheduleDialogs.scheduleDetail.cropView?.plantStage
                                                                ? translatePlantStage(scheduleDialogs.scheduleDetail.cropView.plantStage)
                                                                : '-'}
                                                    </div>
                                                    <div>
                                                        <strong>Tạo lúc:</strong>{' '}
                                                        {scheduleDialogs.scheduleDetail.createdAt ? formatDate(scheduleDialogs.scheduleDetail.createdAt) : '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {scheduleDialogs.scheduleDetail.staff && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Thông tin nhân viên</h3>
                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                        <div><strong>Họ tên:</strong> {scheduleDialogs.scheduleDetail.staff.fullname ?? scheduleDialogs.scheduleDetail.staffName ?? '-'}</div>
                                                        <div><strong>Số điện thoại:</strong> {scheduleDialogs.scheduleDetail.staff.phone ?? '-'}</div>
                                                        {scheduleDialogs.scheduleDetail.staff.email && (
                                                            <div><strong>Email:</strong> {scheduleDialogs.scheduleDetail.staff.email}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {scheduleDialogs.scheduleDetail.farmView && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Thông tin nông trại</h3>
                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                        <div><strong>Tên nông trại:</strong> {scheduleDialogs.scheduleDetail.farmView.farmName ?? `#${scheduleDialogs.scheduleDetail.farmView.farmId}`}</div>
                                                        <div><strong>Địa điểm:</strong> {scheduleDialogs.scheduleDetail.farmView.location ?? '-'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {scheduleDialogs.scheduleDetail.cropView && (
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">Thông tin cây trồng</h3>
                                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                        <div><strong>Tên cây trồng:</strong> {scheduleDialogs.scheduleDetail.cropView.cropName ?? `#${scheduleDialogs.scheduleDetail.cropView.cropId}`}</div>
                                                        <div><strong>Số lượng:</strong> {scheduleDialogs.scheduleDetail.quantity}</div>
                                                        {scheduleDialogs.scheduleDetail.cropView.origin && (
                                                            <div><strong>Nguồn gốc:</strong> {scheduleDialogs.scheduleDetail.cropView.origin}</div>
                                                        )}
                                                        {scheduleDialogs.scheduleDetail.cropView.description && (
                                                            <div className="col-span-2">
                                                                <strong>Mô tả:</strong>
                                                                <p className="mt-1 text-sm text-muted-foreground">{scheduleDialogs.scheduleDetail.cropView.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Yêu cầu cây trồng</h3>
                                                {scheduleDialogs.scheduleDetail.cropView && Array.isArray(scheduleDialogs.scheduleDetail.cropView.cropRequirement) && scheduleDialogs.scheduleDetail.cropView.cropRequirement.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {scheduleDialogs.scheduleDetail.cropView.cropRequirement
                                                            .slice()
                                                            .sort((a: any, b: any) => {
                                                                if (a.plantStage && b.plantStage) return String(a.plantStage).localeCompare(String(b.plantStage))
                                                                return (a.cropRequirementId ?? 0) - (b.cropRequirementId ?? 0)
                                                            })
                                                            .map((req: any) => (
                                                                <div key={req.cropRequirementId ?? `${req.plantStage}-${req.cropId}`} className="p-4 bg-muted/50 rounded-lg border">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        <div><strong>Giai đoạn:</strong> {req.plantStage ? translatePlantStage(req.plantStage) ?? req.plantStage : '-'}</div>
                                                                        <div><strong>Thời gian dự kiến:</strong> {req.estimatedDate !== null && req.estimatedDate !== undefined ? `${req.estimatedDate} ngày` : '-'}</div>
                                                                        <div><strong>Độ ẩm đất:</strong> {formatMoisture(req.soilMoisture)}</div>
                                                                        <div><strong>Nhiệt độ:</strong> {req.temperature !== null && req.temperature !== undefined ? `${req.temperature} °C` : '-'}</div>
                                                                        <div><strong>Phân bón:</strong> {req.fertilizer ?? '-'}</div>
                                                                        <div><strong>Ánh sáng:</strong> {req.lightRequirement !== null && req.lightRequirement !== undefined ? `${req.lightRequirement} lux` : '-'}</div>
                                                                        <div className="col-span-2"><strong>Tần suất tưới:</strong> {formatWateringFrequency(req.wateringFrequency)}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-muted/50 rounded-lg">Chưa có yêu cầu</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="hidden lg:block">
                                            {scheduleDialogs.showThresholdInline && (
                                                <div className="sticky top-6 self-start p-4 bg-white rounded-lg border">
                                                    <h3 className="text-lg font-semibold mb-3">Cấu hình ngưỡng</h3>
                                                    <ThresholdPanel />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="calendar">
                                    <div className="space-y-4">
                                        <Card>
                                            <CardContent className="px-6 pt-3 pb-6">
                                                {scheduleDialogs.scheduleDetail && (!Array.isArray(scheduleDialogs.scheduleDetail.farmActivityView) || scheduleDialogs.scheduleDetail.farmActivityView.length === 0) ? (
                                                    <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <p className="text-sm text-gray-700">
                                                            Chưa có hoạt động nông trại cho thời vụ này. Hãy tạo hoạt động để theo dõi trên lịch.
                                                        </p>
                                                    </div>
                                                ) : null}

                                                <CalendarShell
                                                    events={scheduleCalendarEvents.map((ev: any) => ({
                                                        id: String(ev.id),
                                                        title: ev.title,
                                                        start: ev.start ?? null,
                                                        end: ev.end ?? null,
                                                        color: ev.color ?? undefined,
                                                        isActive: ev.isActive ?? false,
                                                        participants: [],
                                                        raw: ev.raw ?? null,
                                                    }))}
                                                    onEventClick={(raw) => {
                                                        if (!raw) return
                                                        setSelectedFarmActivity(raw)
                                                        setShowFarmActivityDetail(true)
                                                    }}
                                                    onEventMenuAction={handleEventMenuAction}
                                                    onDayClick={handleDayClick}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="logs">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div />
                                        </div>
                                        <ScheduleLogPanel scheduleId={scheduleDialogs.scheduleDetail.scheduleId} onEdit={(log) => {
                                            scheduleDialogs.openEditLog(log)
                                        }} registerUpdater={(fn) => { externalLogUpdaterRef.current = fn }} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={showDayEventsDialog} onOpenChange={setShowDayEventsDialog}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="flex items-center justify-between">
                        <DialogTitle>{dayEventsDate ? `Sự kiện ngày ${formatDate(dayEventsDate)}` : 'Sự kiện'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        {Array.isArray(dayEventsList) && dayEventsList.length > 0 ? (
                            dayEventsList.map((ev: any) => {
                                const raw = ev ?? {}
                                const candidateType =
                                    raw.activityType ??
                                    raw.ActivityType ??
                                    raw.activity?.activityType ??
                                    raw.title ??
                                    raw.name ??
                                    `Hoạt động #${raw.farmActivitiesId ?? raw.id ?? ''}`
                                const title = translateActivityType(String(candidateType))
                                const statusInfo = getFarmActivityStatusInfo(raw.status ?? raw.Status)
                                const isActive = (raw.status === 1 || String(raw.status ?? raw.Status).toUpperCase() === 'ACTIVE' || ev?.isActive === true)
                                return (
                                    <div
                                        key={String(raw.farmActivitiesId ?? raw.id ?? Math.random())}
                                        className={cn(
                                            "p-4 md:p-5 rounded-lg flex items-start justify-between gap-4 cursor-pointer transition-shadow",
                                            isActive ? "bg-white border shadow-sm" : "bg-gray-50 border-gray-100"
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="mb-1">
                                                <div className="text-base md:text-lg font-semibold text-gray-900 leading-6 truncate">{title}</div>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div className="truncate">Nhân sự: {raw.staffFullName ?? raw.staffName ?? '-'}</div>
                                                <div className="truncate">Thời gian: {formatDateRange(raw.startDate ?? raw.StartDate ?? raw.start, raw.endDate ?? raw.EndDate ?? raw.end)}</div>

                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-3">
                                            <Badge variant={statusInfo.variant as any} className="text-sm py-1 px-3 rounded-full shadow-sm">{statusInfo.label}</Badge>
                                            <DropdownMenu modal={false}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent disablePortal align="end" className="w-44" sideOffset={5} onCloseAutoFocus={(e) => e.preventDefault()}>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            setSelectedFarmActivity(raw)
                                                            setShowFarmActivityDetail(true)
                                                            setShowDayEventsDialog(false)
                                                        }}
                                                        className="cursor-pointer focus:bg-gray-100"
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        Xem
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            void handleToggleActivity(raw)
                                                        }}
                                                        className="cursor-pointer focus:bg-gray-100"
                                                        onSelect={(e) => e.preventDefault()}
                                                    >
                                                        {((raw.status ?? raw.Status) === 1 || String(raw.status ?? raw.Status) === 'ACTIVE') ? 'Tạm dừng hoạt động' : 'Kích hoạt hoạt động'}
                                                    </DropdownMenuItem>

                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-4 text-sm text-gray-600">Không có sự kiện cho ngày này.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <LogModalDialog
                open={scheduleDialogs.showLogModal}
                onOpenChange={scheduleDialogs.setShowLogModal}
                mode={scheduleDialogs.logModalMode}
                editingLog={scheduleDialogs.editingLog}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSuccess={async (payload) => {
                    try {
                        const createdObj = payload ?? {}
                        if (scheduleDialogs.logModalMode === 'edit' && scheduleDialogs.editingLog) {
                            const id = scheduleDialogs.editingLog.id
                            const notes = (createdObj?.notes ?? createdObj?.Notes ?? createdObj?.notes ?? '') as string
                            const updatedAt = createdObj?.updatedAt ?? createdObj?.updated_at ?? new Date().toISOString()
                            const updatedBy = createdObj?.updatedBy ?? createdObj?.updated_by ?? null
                            const updatedItem = {
                                id,
                                notes,
                                updatedAt,
                                updatedBy,
                                staffNameUpdate: createdObj?.staffNameUpdate ?? null,
                            }
                            externalLogUpdaterRef.current?.(updatedItem, 'update')

                            try {
                                await scheduleData.loadAllSchedules()
                            } catch (e) {
                            }
                        } else {
                            const createdObj2 = createdObj ?? {}
                            const id = createdObj2?.cropLogId ?? createdObj2?.id ?? -Date.now()
                            const createdAt = (createdObj2?.createdAt ?? createdObj2?.created_at) || new Date().toISOString()
                            const createdBy = createdObj2?.createdBy ?? createdObj2?.created_by ?? null
                            const updatedAt = createdAt
                            const updatedBy = createdBy
                            const notes = createdObj2?.notes ?? ''
                            let profileName = null
                            try {
                                const profile = await accountProfileApi.getProfile()
                                profileName = profile?.fullname ?? null
                            } catch {
                                profileName = null
                            }
                            const creatorFromResponse = createdObj2?.staffNameCreate ?? createdObj2?.staffName ?? null
                            const rawCreatedByField = createdObj2?.createdBy ?? createdObj2?.created_by ?? createdObj2?.createBy ?? createdObj2?.create_by ?? null
                            const creatorFromCreatedBy = typeof rawCreatedByField === 'string' && String(rawCreatedByField).trim() ? String(rawCreatedByField).trim() : null
                            const newItem = {
                                id,
                                notes,
                                createdAt,
                                createdBy,
                                updatedAt,
                                updatedBy,
                                staffNameCreate: creatorFromResponse ?? creatorFromCreatedBy ?? profileName,
                            }
                            externalLogUpdaterRef.current?.(newItem, 'create')
                        }
                    } catch (e) {
                    }
                }}
            />

            <EditScheduleDialog
                open={scheduleDialogs.showEdit}
                onOpenChange={handleEditDialogChange}
                form={scheduleDialogs.editForm}
                onFormChange={scheduleDialogs.setEditForm}
                farms={scheduleData.farms}
                crops={scheduleData.crops}
                staffs={scheduleData.staffs}
                activities={scheduleData.activities}
                metaLoading={scheduleData.metaLoading}
                editLoading={false}
                actionLoading={scheduleActions.actionLoading}
                todayString={todayString}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSubmit={handleUpdateSchedule}
            />

            <AssignStaffDialog
                open={scheduleDialogs.showAssignStaff}
                onOpenChange={handleAssignStaffDialogChange}
                assignStaffId={scheduleDialogs.assignStaffId}
                onAssignStaffIdChange={scheduleDialogs.setAssignStaffId}
                staffs={scheduleData.staffs}
                actionLoading={scheduleActions.actionLoading}
                selectedScheduleId={scheduleDialogs.selectedSchedule?.scheduleId}
                onSubmit={handleAssignStaff}
            />

            <UpdateStageModalDialog
                open={scheduleDialogs.showUpdateStageModal}
                onOpenChange={scheduleDialogs.setShowUpdateStageModal}
                customToday={scheduleDialogs.customToday}
                onCustomTodayChange={scheduleDialogs.setCustomToday}
                scheduleStartDate={scheduleDialogs.scheduleDetail?.startDate}
                actionLoading={scheduleActions.actionLoading}
                selectedScheduleId={scheduleDialogs.scheduleDetail?.scheduleId}
                onSubmit={handleUpdateStageByDate}
            />

            <CreateActivityDialog
                open={scheduleDialogs.showCreateActivity}
                onOpenChange={handleCreateActivityDialogChange}
                form={scheduleDialogs.createActivityForm}
                onFormChange={scheduleDialogs.setCreateActivityForm}
                staffs={scheduleData.staffs}
                metaLoading={scheduleData.metaLoading}
                onRetryLoadStaffs={scheduleData.loadReferenceData}
                todayString={todayString}
                onSubmit={submitCreateActivity}
            />
            <Dialog open={confirmDeactivateOpen} onOpenChange={setConfirmDeactivateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận vô hiệu hóa</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p>Bạn có chắc chắn muốn vô hiệu hóa hoạt động này? Hành động có thể đảo ngược trong trang quản lý.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setConfirmDeactivateOpen(false); setConfirmTargetRaw(null) }}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={async () => {
                            try {
                                if (!confirmTargetRaw) return
                                const id = Number(confirmTargetRaw?.farmActivitiesId ?? confirmTargetRaw?.farmActivityId ?? confirmTargetRaw?.id ?? confirmTargetRaw?.activity?.farmActivitiesId)
                                if (!id) return
                                const res: any = await farmActivityService.changeStatus(id)
                                showSuccessToast(res)
                                await scheduleData.load()
                                try {
                                    const parent = confirmTargetRaw?._parentSchedule ?? confirmTargetRaw?.raw ?? confirmTargetRaw?.activity?._parentSchedule ?? null
                                    if (parent && scheduleDialogs.scheduleDetail?.scheduleId === parent.scheduleId) {
                                        await scheduleActions.handleViewDetail(parent, (detail) => {
                                            scheduleDialogs.setScheduleDetail(detail)
                                        })
                                    }
                                } catch (e) {
                                    console.error('Failed to refresh schedule detail after confirm deactivate', e)
                                }
                            } catch (err) {
                                showErrorToast(err)
                            } finally {
                                setConfirmDeactivateOpen(false)
                                setConfirmTargetRaw(null)
                            }
                        }}>
                            Xác nhận
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showEditFarmActivity} onOpenChange={setShowEditFarmActivity}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chỉnh Sửa Hoạt Động Nông Trại</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="editActivityType">Loại hoạt động *</Label>
                            <Select value={editFarmActivityForm.activityType} onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, activityType: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại hoạt động" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(activityTypeLabels).map(k => (
                                        <SelectItem key={k} value={k}>
                                            {activityTypeLabels[k]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="editStartDate">Ngày bắt đầu *</Label>
                            <Input
                                id="editStartDate"
                                type="date"
                                min={todayString}
                                value={editFarmActivityForm.startDate}
                                onChange={e => setEditFarmActivityForm({ ...editFarmActivityForm, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="editEndDate">Ngày kết thúc *</Label>
                            <Input
                                id="editEndDate"
                                type="date"
                                min={editFarmActivityForm.startDate || todayString}
                                value={editFarmActivityForm.endDate}
                                onChange={e => setEditFarmActivityForm({ ...editFarmActivityForm, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="editStaff">Nhân sự</Label>
                            <Select
                                value={editFarmActivityForm.staffId ? String(editFarmActivityForm.staffId) : ''}
                                onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, staffId: v ? Number(v) : undefined })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhân sự" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(scheduleData.staffs) && scheduleData.staffs.length > 0 ? (
                                        scheduleData.staffs.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none">Không có nhân sự</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="editSchedule">Kế hoạch / Thời vụ</Label>
                            <Select
                                value={editFarmActivityForm.scheduleId ? String(editFarmActivityForm.scheduleId) : ''}
                                onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, scheduleId: v ? Number(v) : undefined })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn kế hoạch / thời vụ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(scheduleData.allSchedules) && scheduleData.allSchedules.length > 0 ? (
                                        scheduleData.allSchedules
                                            .filter(s => s.scheduleId !== undefined && s.scheduleId !== null)
                                            .map(s => {
                                                const label =
                                                    (s.cropView?.cropName ?? s.farmView?.farmName ?? `Kế hoạch #${s.scheduleId}`) +
                                                    (s.startDate || s.endDate ? ` (${formatDateRange(s.startDate, s.endDate)})` : '')
                                                return (
                                                    <SelectItem key={String(s.scheduleId)} value={String(s.scheduleId)}>
                                                        {label}
                                                    </SelectItem>
                                                )
                                            })
                                    ) : (
                                        <SelectItem value="none">Không có kế hoạch</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="editStatus">Trạng thái</Label>
                            <Select value={editFarmActivityForm.status || 'ACTIVE'} onValueChange={(v) => setEditFarmActivityForm({ ...editFarmActivityForm, status: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {farmActivityStatusOptions.map(status => (
                                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setShowEditFarmActivity(false); setEditingFarmActivity(null) }}>Hủy</Button>
                        <Button onClick={async () => {
                            if (!editingFarmActivity) return
                            setEditFarmActivitySubmitting(true)
                            try {
                                const id = editingFarmActivity.farmActivitiesId
                                const payload = {
                                    startDate: editFarmActivityForm.startDate,
                                    endDate: editFarmActivityForm.endDate,
                                    staffId: editFarmActivityForm.staffId,
                                    scheduleId: editFarmActivityForm.scheduleId,
                                }
                                const res = await farmActivityService.updateFarmActivity(id, payload, editFarmActivityForm.activityType, editFarmActivityForm.status || 'ACTIVE')
                                showSuccessToast(res)
                                setShowEditFarmActivity(false)
                                setEditingFarmActivity(null)
                                await scheduleData.loadAllSchedules()
                                if (scheduleDialogs.scheduleDetail?.scheduleId) {
                                    scheduleActions.handleViewDetail(scheduleDialogs.selectedSchedule!, (detail) => {
                                        scheduleDialogs.setScheduleDetail(detail)
                                    })
                                }
                            } catch (err) {
                                showErrorToast(err)
                            } finally {
                                setEditFarmActivitySubmitting(false)
                            }
                        }}>{editFarmActivitySubmitting ? 'Đang cập nhật...' : 'Cập nhật'}</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showFarmActivityDetail} onOpenChange={setShowFarmActivityDetail}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="flex items-center justify-between">
                        <DialogTitle>Chi tiết hoạt động</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400"
                                onClick={() => {
                                    if (!selectedFarmActivity) return
                                    void handleEventMenuAction('editActivity', selectedFarmActivity)
                                    setShowFarmActivityDetail(false)
                                }}>
                                <span className="font-medium">Chỉnh sửa</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                                onClick={() => {
                                    if (!selectedFarmActivity) return
                                    const currentStatus = String(selectedFarmActivity.status ?? selectedFarmActivity.Status ?? '').toUpperCase() || 'DEACTIVATED'
                                    setStatusEditorValue(currentStatus)
                                    setStatusEditorOpen(true)
                                }}>
                                <span className="font-medium">Chỉnh sửa trạng thái</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                                onClick={async () => {
                                    if (!selectedFarmActivity) return
                                    await handleToggleActivity(selectedFarmActivity)
                                    try {
                                        const oldStatus = selectedFarmActivity.status ?? selectedFarmActivity.Status
                                        let newStatus: any = oldStatus
                                        if (typeof oldStatus === 'number') newStatus = oldStatus === 1 ? 0 : 1
                                        else if (typeof oldStatus === 'string') newStatus = String(oldStatus).toUpperCase() === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE'
                                        setSelectedFarmActivity({ ...selectedFarmActivity, status: newStatus, Status: newStatus })
                                    } catch (e) {
                                    }
                                }}>
                                <span className="font-medium">
                                    {((selectedFarmActivity?.status ?? selectedFarmActivity?.Status) === 1 || String(selectedFarmActivity?.status ?? selectedFarmActivity?.Status).toUpperCase() === 'ACTIVE') ? 'Tạm dừng' : 'Kích hoạt'}
                                </span>
                            </Button>
                        </div>
                    </DialogHeader>
                    {selectedFarmActivity ? (
                        <div className="space-y-4 p-2">
                            <div><strong>Hoạt động:</strong> {translateActivityType(selectedFarmActivity.activityType ?? selectedFarmActivity.ActivityType ?? '')}</div>
                            <div><strong>Ngày bắt đầu:</strong> {formatDate(selectedFarmActivity.startDate ?? selectedFarmActivity.StartDate ?? selectedFarmActivity.start)}</div>
                            <div><strong>Ngày kết thúc:</strong> {formatDate(selectedFarmActivity.endDate ?? selectedFarmActivity.EndDate ?? selectedFarmActivity.end)}</div>
                            <div>
                                <strong>Trạng thái:</strong>{' '}
                                {(() => {
                                    const info = getFarmActivityStatusInfo(selectedFarmActivity.status ?? selectedFarmActivity.Status)
                                    return <Badge variant={info.variant as any} className="text-sm">{info.label}</Badge>
                                })()}
                            </div>
                            <div className="p-2 bg-muted/50 rounded">
                                <div><strong>Họ tên:</strong> {selectedFarmActivity.staffFullName ?? selectedFarmActivity.staffName ?? 'Chưa có'}</div>
                                <div><strong>Email:</strong> {selectedFarmActivity.staffEmail ?? 'Chưa có'}</div>
                                <div><strong>Số điện thoại:</strong> {selectedFarmActivity.staffPhone ?? 'Chưa có'}</div>
                            </div>

                            {statusEditorOpen && (
                                <div className="p-3 bg-white border rounded mt-2">
                                    <div className="mb-2"><strong>Chọn trạng thái mới</strong></div>
                                    <div className="mb-3">
                                        <Select value={statusEditorValue ?? ''} onValueChange={(v) => setStatusEditorValue(v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {farmActivityStatusOptions.map(s => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="outline" onClick={() => { setStatusEditorOpen(false); setStatusEditorValue(null) }}>Hủy</Button>
                                        <Button
                                            disabled={
                                                statusEditorLoading ||
                                                !statusEditorValue ||
                                                String(statusEditorValue).toUpperCase() === String(selectedFarmActivity.status ?? selectedFarmActivity.Status ?? '').toUpperCase()
                                            }
                                            onClick={async () => {
                                                if (!selectedFarmActivity || !statusEditorValue) return
                                                const id = Number(selectedFarmActivity.farmActivitiesId ?? selectedFarmActivity.farmActivityId ?? selectedFarmActivity.id)
                                                if (!id) return
                                                try {
                                                    setStatusEditorLoading(true)
                                                    const activityType = selectedFarmActivity.activityType ?? selectedFarmActivity.ActivityType ?? ''
                                                    await farmActivityService.setStatus(id, String(statusEditorValue).toUpperCase(), activityType, {
                                                        startDate: selectedFarmActivity.startDate ?? selectedFarmActivity.StartDate ?? selectedFarmActivity.start ?? '',
                                                        endDate: selectedFarmActivity.endDate ?? selectedFarmActivity.EndDate ?? selectedFarmActivity.end ?? '',
                                                        staffId: selectedFarmActivity.staffId ?? undefined,
                                                        scheduleId: selectedFarmActivity.scheduleId ?? undefined,
                                                    })
                                                    showSuccessToast({ message: 'Cập nhật trạng thái thành công' })
                                                    setSelectedFarmActivity((prev: any) => prev ? { ...prev, status: String(statusEditorValue).toUpperCase(), Status: String(statusEditorValue).toUpperCase() } : prev)
                                                    try {
                                                        await scheduleData.load()
                                                        const parent = selectedFarmActivity?._parentSchedule ?? selectedFarmActivity?.raw ?? null
                                                        if (parent && scheduleDialogs.scheduleDetail?.scheduleId === parent.scheduleId) {
                                                            await scheduleActions.handleViewDetail(parent, (detail) => {
                                                                scheduleDialogs.setScheduleDetail(detail)
                                                            })
                                                        }
                                                    } catch (e) {
                                                        console.error('Failed to refresh after status update', e)
                                                    }
                                                    setStatusEditorOpen(false)
                                                    setStatusEditorValue(null)
                                                } catch (err) {
                                                    showErrorToast(err)
                                                } finally {
                                                    setStatusEditorLoading(false)
                                                }
                                            }}
                                        >
                                            {statusEditorLoading ? 'Đang lưu...' : 'Lưu'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4">Không có dữ liệu hoạt động.</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}






