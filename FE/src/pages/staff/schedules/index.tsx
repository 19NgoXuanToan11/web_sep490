import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { formatDate } from '@/shared/lib/date-utils'
import CalendarShell from '@/components/Calendar'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { Label } from '@/shared/ui/label'
import { ScheduleLogPanelStaff } from '@/features/season'
import { scheduleLogService, type ScheduleLogItem } from '@/shared/api/scheduleLogService'
import { useRef } from 'react'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { ManagementPageHeader } from '@/shared/ui'
import { showSuccessToast, showErrorToast } from '@/shared/lib/toast-manager'
import { scheduleService, type ScheduleListItem } from '@/shared/api/scheduleService'
import { farmActivityService } from '@/shared/api/farmActivityService'
import { toast } from 'sonner'

interface DisplaySchedule extends Omit<ScheduleListItem, 'diseaseStatus'> {
    id: string
    currentPlantStage?: string
    diseaseStatus?: string | number
    cropRequirement?: any[]
    farmActivities?: Array<{
        farmActivitiesId: number
        activityType?: string
        startDate?: string
        endDate?: string
        status?: string
    }>
}

const getFarmActivityStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'golden' => {
    if (!status) return 'secondary'
    if (status === 'COMPLETED') return 'default'
    if (status === 'ACTIVE') return 'golden'
    if (status === 'IN_PROGRESS') return 'secondary'
    return 'destructive'
}

const getFarmActivityStatusLabel = (status?: string) => {
    if (!status) return ''
    const map: Record<string, string> = {
        COMPLETED: 'Hoàn thành',
        ACTIVE: 'Hoạt động',
        IN_PROGRESS: 'Đang thực hiện',
        CANCELLED: 'Đã hủy',
    }
    return map[status] ?? status
}

const getDiseaseStatusLabel = (diseaseStatus?: string | number) => {
    if (!diseaseStatus) return 'Không có'
    if (typeof diseaseStatus === 'string') {
        const labels: Record<string, string> = {
            DownyMildew: 'Sương mai',
            PowderyMildew: 'Phấn trắng',
            Blight: 'Bệnh cháy lá',
        }
        return labels[diseaseStatus] || diseaseStatus
    }
    return String(diseaseStatus)
}

const activityTypeLabels: Record<string, string> = {
    SoilPreparation: 'Chuẩn bị đất',
    Sowing: 'Gieo hạt',
    Thinning: 'Tỉa cây con',
    FertilizingDiluted: 'Bón phân (pha loãng)',
    Weeding: 'Nhổ cỏ',
    PestControl: 'Phòng trừ sâu bệnh',
    FertilizingLeaf: 'Bón phân cho lá',
    Harvesting: 'Thu hoạch',
    CleaningFarmArea: 'Dọn dẹp nông trại',
}

const translateActivityType = (type?: string | null) => {
    if (!type) return ''
    return activityTypeLabels[type] ?? type
}

const StaffSchedulesPage: React.FC = () => {
    const [schedules, setSchedules] = useState<DisplaySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)

    const [isScheduleDetailOpen, setIsScheduleDetailOpen] = useState(false)
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<DisplaySchedule | null>(null)

    const transformApiSchedule = (apiSchedule: any): DisplaySchedule => {
        const farmActivitiesArray = Array.isArray(apiSchedule.farmActivityView)
            ? apiSchedule.farmActivityView
            : apiSchedule.farmActivityView
                ? [apiSchedule.farmActivityView]
                : []

        const firstFarmActivity = farmActivitiesArray.length > 0 ? farmActivitiesArray[0] : (apiSchedule.farmActivityView ?? undefined)

        return {
            ...apiSchedule,
            id: String(apiSchedule.scheduleId || ''),
            currentPlantStage: apiSchedule.currentPlantStage,
            diseaseStatus: apiSchedule.diseaseStatus,
            cropRequirement: apiSchedule.cropRequirement || apiSchedule.cropView?.cropRequirement || [],
            farmActivities: farmActivitiesArray,
            farmActivityView: firstFarmActivity,
        }
    }

    const fetchSchedules = useCallback(
        async () => {
            try {
                setLoading(true)
                const response = await scheduleService.getSchedulesByStaff()

                const transformedSchedules = (response.data || [])
                    .map((apiSchedule: any) => {
                        try {
                            return transformApiSchedule(apiSchedule)
                        } catch (error) {
                            console.error('Error transforming schedule:', error)
                            return null
                        }
                    })
                    .filter((schedule): schedule is DisplaySchedule => schedule !== null)

                setSchedules(transformedSchedules)
            } catch (error) {
                showErrorToast(error)
            } finally {
                setLoading(false)
            }
        },
        []
    )

    useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    useEffect(() => {
        setPageIndex(1)
    }, [schedules])

    const [isCompleting, setIsCompleting] = useState(false)
    const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false)

    const handleCompleteFarmActivity = useCallback(async () => {
        if (!selectedScheduleDetail) return
        const sd = selectedScheduleDetail as any
        const activityId =
            (sd?.farmActivityView as any)?.farmActivitiesId ??
            (Array.isArray(sd?.farmActivities) ? sd.farmActivities[0]?.farmActivitiesId : undefined)
        if (!activityId) return
        setIsCompleting(true)
        try {
            await farmActivityService.completeFarmActivity(activityId, selectedScheduleDetail.farmView?.location)

            await fetchSchedules()

            if (selectedScheduleDetail?.scheduleId) {
                try {
                    const listRes = await scheduleService.getSchedulesByStaff()
                    const found = (listRes?.data || []).find((s: any) => s.scheduleId === selectedScheduleDetail.scheduleId)
                    if (found) {
                        setSelectedScheduleDetail(transformApiSchedule(found))
                    } else {
                        setSelectedScheduleDetail(null)
                        setIsScheduleDetailOpen(false)
                    }
                } catch (err) {
                    setSelectedScheduleDetail(null)
                    setIsScheduleDetailOpen(false)
                }
            } else {
                setSelectedScheduleDetail(null)
                setIsScheduleDetailOpen(false)
            }
        } catch (error: any) {
            showErrorToast(error)
        } finally {
            setIsCompleting(false)
        }
    }, [selectedScheduleDetail, fetchSchedules, toast])

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            if (typeof s.status === 'string') return s.status === 'ACTIVE'
            return s.status === 1
        })
    }, [schedules])

    const sortedSchedules = useMemo(() => {
        return [...filteredSchedules]
    }, [filteredSchedules])

    const paginatedSchedules = useMemo(() => {
        const start = (pageIndex - 1) * pageSize
        return sortedSchedules.slice(start, start + pageSize)
    }, [sortedSchedules, pageIndex, pageSize])

    const handleViewDetail = useCallback((raw: any) => {
        let scheduleObj: any = raw
        let activityObj: any = undefined
        if (raw && raw.schedule && raw.activity) {
            scheduleObj = raw.schedule
            activityObj = raw.activity
        }

        const scheduleCopy: DisplaySchedule = {
            ...scheduleObj,
            farmView: scheduleObj.farmView ? { ...scheduleObj.farmView } : undefined,
            cropView: scheduleObj.cropView ? { ...scheduleObj.cropView } : undefined,
            cropRequirement: scheduleObj.cropRequirement
                ? [...(scheduleObj.cropRequirement || [])]
                : undefined,
            farmActivities: scheduleObj.farmActivities ?? (scheduleObj.farmActivityView ? [scheduleObj.farmActivityView] : []),
            farmActivityView: activityObj ?? scheduleObj.farmActivityView ?? (Array.isArray(scheduleObj.farmActivities) ? scheduleObj.farmActivities[0] : undefined),
        }

        setSelectedScheduleDetail(scheduleCopy)
        setIsScheduleDetailOpen(true)
    }, [])

    const formatDateOnly = useCallback((dateString: string) => {
        return formatDate(dateString)
    }, [])

    const handleModalOpenChange = useCallback((open: boolean) => {
        setIsScheduleDetailOpen(open)
        if (!open) {
            setSelectedScheduleDetail(null)
        }
    }, [])


    const parseDateString = useCallback((dateStr?: string | null) => {
        if (!dateStr) return null

        const iso = new Date(dateStr)
        if (!Number.isNaN(iso.getTime())) return iso

        const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (m) {
            const p1 = Number(m[1])
            const p2 = Number(m[2])
            const y = Number(m[3])
            if (p1 > 12) {
                return new Date(y, p2 - 1, p1)
            }
            if (p2 > 12) {
                return new Date(y, p1 - 1, p2)
            }
            return new Date(y, p1 - 1, p2)
        }

        return null
    }, [])

    const statusToColor = useCallback((status?: string) => {
        if (!status) return '#f59e0b'
        if (status === 'ACTIVE') return '#f59e0b'
        if (status === 'COMPLETED') return '#10B981'
        if (status === 'DEACTIVATED') return '#9CA3AF'
        return '#f59e0b'
    }, [])

    const calendarActivityEntries = useMemo(() => {
        const entries: Array<{ schedule: DisplaySchedule; activity: any }> = []
        for (const s of filteredSchedules) {
            const activities = Array.isArray((s as any).farmActivities)
                ? (s as any).farmActivities
                : s.farmActivityView
                    ? [s.farmActivityView]
                    : []

            for (const fa of activities) {
                const start = parseDateString(fa?.startDate)
                const end = parseDateString(fa?.endDate)
                if (start && end) {
                    entries.push({ schedule: s, activity: fa })
                }
            }
        }
        return entries
    }, [filteredSchedules, parseDateString])

    const calendarEvents = useMemo(() => {
        return calendarActivityEntries.map(({ schedule: s, activity: fa }) => {
            const activityTitle = fa.activityType ? translateActivityType(fa.activityType) : ''
            const title = activityTitle || (s.cropView?.cropName ?? `Cây #${s.cropId ?? ''}`)

            const start = parseDateString(fa.startDate) ?? undefined
            const end = parseDateString(fa.endDate) ?? undefined

            const color = statusToColor(fa.status)

            return {
                id: `${String(s.id)}-${String(fa.farmActivitiesId ?? Math.random().toString(36).slice(2, 8))}`,
                title,
                start,
                end,
                allDay: true,
                backgroundColor: color,
                borderColor: color,
                extendedProps: { original: { schedule: s, activity: fa } },
            }
        })
    }, [calendarActivityEntries, parseDateString, statusToColor])

    const [activeTab, setActiveTab] = useState<'details' | 'logs'>('details')
    const [showLogModal, setShowLogModal] = useState(false)
    const [logModalMode, setLogModalMode] = useState<'create' | 'edit'>('create')
    const [editingLog, setEditingLog] = useState<ScheduleLogItem | null>(null)
    const externalLogUpdaterRef = useRef<((item: ScheduleLogItem | { id: number }, mode: 'create' | 'update' | 'delete') => void) | null>(null)

    const openCreateLogForSchedule = (schedule: DisplaySchedule | null) => {
        if (!schedule) return
        setIsScheduleDetailOpen(false)
        setSelectedScheduleDetail(schedule)
        setLogModalMode('create')
        setShowLogModal(true)
    }

    const openLogsForSchedule = (schedule: DisplaySchedule | null) => {
        if (!schedule) return
        setSelectedScheduleDetail(schedule)
        setActiveTab('logs')
        setIsScheduleDetailOpen(true)
    }

    const handleEventMenuAction = (action: string, raw?: any) => {
        if (!raw) return
        let scheduleRaw = raw
        if (raw && raw.schedule) scheduleRaw = raw.schedule
        const schedule = transformApiSchedule(scheduleRaw)
        if (action === 'logs') {
            openLogsForSchedule(schedule)
        } else if (action === 'create') {
            openCreateLogForSchedule(schedule)
        }
    }

    return (
        <StaffLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ManagementPageHeader
                    className="mb-8"
                    title="Quản lý lịch làm việc"
                    description="Xem và quản lý lịch làm việc được giao cho bạn"
                />

                <div className="mb-6">
                    <Card>
                        <CardContent>
                            <CalendarShell
                                events={calendarEvents.map(ev => ({
                                    id: String(ev.id),
                                    title: ev.title,
                                    start: ev.start ?? null,
                                    end: ev.end ?? null,
                                    color: ev.backgroundColor ?? undefined,
                                    participants: ev.extendedProps?.original ? (() => {
                                        const o: any = ev.extendedProps?.original
                                        const mgr = o?.managerName ?? o?.schedule?.managerName ?? 'm1'
                                        return [{
                                            id: String(mgr),
                                            name: o?.managerName ?? o?.schedule?.managerName ?? undefined,
                                        }]
                                    })() : [],
                                    raw: ev.extendedProps?.original ?? null,
                                }))}
                                onEventClick={(raw) => {
                                    if (!raw) return;
                                    handleViewDetail(raw)
                                }}
                                onEventMenuAction={handleEventMenuAction}
                            />
                        </CardContent>
                    </Card>
                </div>

                {loading ? (
                    <Card>
                        <CardContent className="p-12">
                            <div className="flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : paginatedSchedules.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-lg font-semibold text-gray-900">
                                {'Chưa có lịch làm việc'}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                {'Bạn chưa có lịch làm việc nào được giao.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                <Dialog open={isScheduleDetailOpen} onOpenChange={handleModalOpenChange}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Chi tiết lịch làm việc
                            </DialogTitle>
                        </DialogHeader>

                        {selectedScheduleDetail ? (
                            <div className="space-y-6">
                                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                                    <TabsList>
                                        <TabsTrigger value="details">Chi tiết</TabsTrigger>
                                        <TabsTrigger value="logs">Nhật ký</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details">
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1">
                                                        <dl className="grid grid-cols-1 gap-4">
                                                            <div>
                                                                <dt className="text-sm text-gray-500">Số lượng</dt>
                                                                <dd className="text-lg font-semibold text-gray-900 mt-1">
                                                                    {selectedScheduleDetail.quantity ?? 0}
                                                                </dd>
                                                            </div>

                                                            <div>
                                                                <dt className="text-sm text-gray-500">Thuốc BVTV</dt>
                                                                <dd className="text-lg font-medium text-gray-900 mt-1">
                                                                    {selectedScheduleDetail.pesticideUsed ? (
                                                                        <Badge variant="default" className="inline-block">Có</Badge>
                                                                    ) : (
                                                                        <span>Không</span>
                                                                    )}
                                                                </dd>
                                                            </div>

                                                            <div>
                                                                <dt className="text-sm text-gray-500">Tình trạng bệnh</dt>
                                                                <dd className="text-base text-gray-800 mt-1">{getDiseaseStatusLabel(selectedScheduleDetail.diseaseStatus)}</dd>
                                                            </div>
                                                        </dl>
                                                    </div>

                                                    <div className="w-full md:w-80">
                                                        <div className="border rounded-md p-4 bg-white shadow-sm">
                                                            <p className="text-base font-semibold text-gray-900 mt-2">
                                                                {translateActivityType(selectedScheduleDetail.farmActivityView?.activityType) || 'N/A'}
                                                            </p>
                                                            {selectedScheduleDetail.farmActivities && selectedScheduleDetail.farmActivities.length > 0 ? (
                                                                <div className="space-y-3 mt-2">
                                                                    {selectedScheduleDetail.farmActivities?.map((fa) => {
                                                                        const isSelected = selectedScheduleDetail.farmActivityView?.farmActivitiesId === fa.farmActivitiesId
                                                                        return (
                                                                            <div
                                                                                key={fa.farmActivitiesId}
                                                                                onClick={() => {
                                                                                    setSelectedScheduleDetail(prev => prev ? { ...prev, farmActivityView: fa } : prev)
                                                                                }}
                                                                                className={`flex items-center justify-between cursor-pointer p-2 rounded ${isSelected ? 'bg-gray-50 border-l-4 border-emerald-400' : ''}`}
                                                                            >
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-gray-900">
                                                                                        {translateActivityType(fa.activityType) || 'N/A'}
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-600">
                                                                                        {fa.startDate ? formatDateOnly(fa.startDate) : 'N/A'} - {fa.endDate ? formatDateOnly(fa.endDate) : 'N/A'}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="ml-4">
                                                                                    <Badge variant={getFarmActivityStatusVariant(fa.status)}>
                                                                                        {getFarmActivityStatusLabel(fa.status)}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            ) : selectedScheduleDetail.farmActivityView ? (
                                                                <div>
                                                                    <p className="text-sm text-gray-600 mt-2">
                                                                        {selectedScheduleDetail.farmActivityView.startDate
                                                                            ? formatDateOnly(selectedScheduleDetail.farmActivityView.startDate)
                                                                            : 'N/A'}{' '}
                                                                        -{' '}
                                                                        {selectedScheduleDetail.farmActivityView.endDate
                                                                            ? formatDateOnly(selectedScheduleDetail.farmActivityView.endDate)
                                                                            : 'N/A'}
                                                                    </p>
                                                                    <div className="mt-3">
                                                                        <Badge variant={getFarmActivityStatusVariant(selectedScheduleDetail.farmActivityView?.status)}>
                                                                            {getFarmActivityStatusLabel(selectedScheduleDetail.farmActivityView?.status)}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-600 mt-2">Thời gian: N/A</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Dialog open={isConfirmCompleteOpen} onOpenChange={setIsConfirmCompleteOpen}>
                                            <DialogContent className="max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle>Xác nhận hoàn thành</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <p>Bạn có chắc muốn đánh dấu hoạt động này là <strong>Hoàn thành</strong> không?</p>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsConfirmCompleteOpen(false)}
                                                        disabled={isCompleting}
                                                    >
                                                        Hủy
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setIsConfirmCompleteOpen(false)
                                                            void handleCompleteFarmActivity()
                                                        }}
                                                        disabled={isCompleting}
                                                    >
                                                        {isCompleting ? 'Đang xử lý...' : 'Xác nhận'}
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {(selectedScheduleDetail.farmView || selectedScheduleDetail.cropView) && (
                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {selectedScheduleDetail.farmView && (
                                                            <div className="space-y-3">
                                                                <h3 className="text-base font-semibold text-gray-700 border-b pb-2">
                                                                    Thông tin nông trại
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <span className="text-sm text-gray-600">Tên nông trại:</span>
                                                                        <p className="font-medium mt-0.5">
                                                                            {selectedScheduleDetail.farmView.farmName || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    {selectedScheduleDetail.farmView.location && (
                                                                        <div>
                                                                            <span className="text-sm text-gray-600">Địa điểm:</span>
                                                                            <p className="font-medium mt-0.5">
                                                                                {selectedScheduleDetail.farmView.location}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {selectedScheduleDetail.farmView.createdAt && (
                                                                        <div>
                                                                            <span className="text-sm text-gray-600">Ngày tạo:</span>
                                                                            <p className="font-medium mt-0.5">
                                                                                {formatDateOnly(selectedScheduleDetail.farmView.createdAt)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedScheduleDetail.cropView && (
                                                            <div className="space-y-3">
                                                                <h3 className="text-base font-semibold text-gray-700 border-b pb-2">
                                                                    Thông tin cây trồng
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <span className="text-sm text-gray-600">Tên cây trồng:</span>
                                                                        <p className="font-medium mt-0.5">
                                                                            {selectedScheduleDetail.cropView.cropName || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    {selectedScheduleDetail.cropView.description && (
                                                                        <div>
                                                                            <span className="text-sm text-gray-600">Mô tả:</span>
                                                                            <p className="text-sm text-gray-700 mt-0.5">
                                                                                {selectedScheduleDetail.cropView.description}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {selectedScheduleDetail.cropView.status && (
                                                                        <div>
                                                                            <span className="text-sm text-gray-600">Trạng thái:</span>
                                                                            <div className="mt-0.5">
                                                                                <Badge variant={selectedScheduleDetail.cropView.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                                                    {selectedScheduleDetail.cropView.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {selectedScheduleDetail.cropView.origin && (
                                                                        <div>
                                                                            <span className="text-sm text-gray-600">Nguồn gốc:</span>
                                                                            <p className="font-medium mt-0.5">{selectedScheduleDetail.cropView.origin}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <div className="flex justify-end px-4">
                                            {selectedScheduleDetail?.farmActivityView &&
                                                selectedScheduleDetail.farmActivityView.status !== 'COMPLETED' && (
                                                    <div className="mt-4">
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setIsConfirmCompleteOpen(true)
                                                            }}
                                                            disabled={isCompleting}
                                                            className="rounded-md"
                                                        >
                                                            {isCompleting ? 'Đang xử lý...' : 'Hoàn thành'}
                                                        </Button>
                                                    </div>
                                                )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="logs">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">Nhật ký</h3>
                                                <div>
                                                    <Button size="sm" onClick={() => {
                                                        if (selectedScheduleDetail) openCreateLogForSchedule(selectedScheduleDetail)
                                                    }}>Ghi nhận mới
                                                    </Button>
                                                </div>
                                            </div>
                                            <ScheduleLogPanelStaff scheduleId={selectedScheduleDetail.scheduleId!} onEdit={(log) => {
                                                setEditingLog(log)
                                                setLogModalMode('edit')
                                                setShowLogModal(true)
                                            }} registerUpdater={(fn) => { externalLogUpdaterRef.current = fn }} />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
                <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{logModalMode === 'create' ? 'Tạo ghi nhận' : 'Chỉnh sửa ghi nhận'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value.trim()
                            if (!notes) {
                                return
                            }
                            try {
                                if (logModalMode === 'create' && selectedScheduleDetail?.scheduleId) {
                                    const res: any = await scheduleLogService.createLog({
                                        scheduleId: selectedScheduleDetail.scheduleId,
                                        notes,
                                    })
                                    if (res?.status === 1) {
                                        showSuccessToast(res)
                                    } else {
                                        const msg = res?.message
                                        if (msg) throw new Error(msg)
                                    }
                                    try {
                                        const created = res?.data ?? res
                                        const id = created?.cropLogId ?? created?.id ?? -Date.now()
                                        const createdAt = ((created?.createdAt ?? created?.created_at) || new Date().toISOString())
                                        const createdBy = created?.createdBy ?? created?.created_by ?? null
                                        const updatedAt = created?.updatedAt ?? created?.updated_at ?? createdAt
                                        const updatedBy = created?.updatedBy ?? created?.updated_by ?? createdBy
                                        const newItem: ScheduleLogItem = {
                                            id,
                                            notes,
                                            createdAt,
                                            createdBy,
                                            updatedAt,
                                            updatedBy,
                                        }
                                        externalLogUpdaterRef.current?.(newItem, 'create')
                                    } catch (e) {
                                    }
                                } else if (logModalMode === 'edit' && editingLog) {
                                    const res: any = await scheduleLogService.updateLog({
                                        id: editingLog.id,
                                        notes,
                                    })
                                    if (res?.status === 1) {
                                        showSuccessToast(res)
                                    } else {
                                        const msg = res?.message
                                        if (msg) throw new Error(msg)
                                    }
                                    try {
                                        const updated = res?.data ?? res
                                        const id = editingLog.id
                                        const updatedAt = updated?.updatedAt ?? updated?.updated_at ?? new Date().toISOString()
                                        const updatedBy = updated?.updatedBy ?? updated?.updated_by ?? null
                                        const newItem: ScheduleLogItem = {
                                            id,
                                            notes,
                                            createdAt: editingLog.createdAt,
                                            createdBy: editingLog.createdBy,
                                            updatedAt,
                                            updatedBy,
                                        }
                                        externalLogUpdaterRef.current?.(newItem, 'update')
                                    } catch (e) {
                                    }
                                }
                                setShowLogModal(false)
                            } catch (err) {
                                showErrorToast(err)
                            }
                        }}>
                            <div className="grid gap-3">
                                <div>
                                    <Label>Nội dung</Label>
                                    <textarea name="notes" defaultValue={editingLog?.notes ?? ''} className="w-full p-2 border rounded" rows={4} />
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setShowLogModal(false)}>Hủy</Button>
                                <Button type="submit">{logModalMode === 'create' ? 'Lưu' : 'Lưu'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </StaffLayout>
    )
}

export default StaffSchedulesPage
