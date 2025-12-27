import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { scheduleService, type PaginatedSchedules, type CreateScheduleRequest, type ScheduleDetail, type ScheduleListItem, type ScheduleStatusString } from '@/shared/api/scheduleService'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Pagination } from '@/shared/ui/pagination'
import { cn } from '@/shared/lib/utils'
import { Loader2, MoreHorizontal, RefreshCw, Search, Settings } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import ThresholdPanel from '@/features/thresholds/ThresholdPanel'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'
import { farmActivityService, type FarmActivity } from '@/shared/api/farmActivityService'
import { handleFetchError, handleCreateError, handleApiSuccess } from '@/shared/lib/error-handler'
import { formatDate } from '@/shared/lib/date-utils'

interface BackendScheduleListProps {
    showCreate?: boolean
    onShowCreateChange?: (v: boolean) => void
    filteredItems?: ScheduleListItem[] | null
    onFilteredItemsChange?: (items: ScheduleListItem[] | null) => void
}

const BULK_PAGE_SIZE = 50

interface ActivityOption {
    id: number
    name: string
}

const toDateOnly = (value?: string) => {
    if (!value) return null
    const dt = new Date(`${value}T00:00:00`)
    return Number.isNaN(dt.getTime()) ? null : dt
}

const rangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) => startA <= endB && startB <= endA

const activityTypeLabels: Record<string, string> = {
    SoilPreparation: 'Chuẩn bị đất trước gieo',
    Sowing: 'Gieo hạt',
    Thinning: 'Tỉa cây con cho đều',
    FertilizingDiluted: 'Bón phân pha loãng (NPK 20–30%)',
    Weeding: 'Nhổ cỏ nhỏ',
    PestControl: 'Phòng trừ sâu bằng thuốc sinh học',
    FertilizingLeaf: 'Bón phân cho lá (N, hữu cơ)',
    Harvesting: 'Thu hoạch',
    CleaningFarmArea: 'Dọn dẹp đồng ruộng',
}

const plantStageLabels: Record<string, string> = {
    Germination: 'Gieo hạt',
    Seedling: 'Nảy mầm',
    Vegetative: 'Tăng trưởng lá',
    Harvest: 'Thu hoạch',
}

const statusOptions = [
    { value: 0, label: 'Vô hiệu hóa' },
    { value: 1, label: 'Hoạt động' },
]

const diseaseOptions = [
    { value: -1, label: 'Không có bệnh' },
]

const translateActivityType = (type: string) => activityTypeLabels[type] ?? type
const translatePlantStage = (stage?: string | null) => {
    if (!stage) return '-'
    return plantStageLabels[stage] ?? stage
}

const getFarmActivityStatusInfo = (status: string | null | undefined): { label: string; variant: 'success' | 'processing' | 'completed' | 'destructive' | 'outline' } => {
    if (!status) {
        return { label: 'Không xác định', variant: 'outline' }
    }

    const normalizedStatus = status.toUpperCase()

    switch (normalizedStatus) {
        case 'ACTIVE':
            return { label: 'Hoạt động', variant: 'success' }
        case 'IN_PROGRESS':
            return { label: 'Đang thực hiện', variant: 'processing' }
        case 'COMPLETED':
            return { label: 'Hoàn thành', variant: 'completed' }
        case 'DEACTIVATED':
            return { label: 'Tạm dừng', variant: 'destructive' }
        default:
            return { label: status, variant: 'outline' }
    }
}

const getStatusLabel = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'string') {
        if (value === 'ACTIVE') return 'Hoạt động'
        if (value === 'DEACTIVATED') return 'Vô hiệu hóa'
        return value
    }
    return statusOptions.find(option => option.value === value)?.label ?? String(value)
}

const isActiveStatus = (status: number | string | null | undefined) => {
    if (status === null || status === undefined) return false
    if (typeof status === 'string') {
        return status === 'ACTIVE'
    }
    return status === 1
}

const getDiseaseLabel = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === -1) return 'Không có bệnh'
    return diseaseOptions.find(option => option.value === value)?.label ?? String(value)
}

const getDiseaseSelectValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-1'
    return String(value)
}

const diseaseEnumMap: Record<string, number> = {
    DownyMildew: 0,
    PowderyMildew: 1,
    LeafSpot: 2,
    BacterialSoftRot: 3,
    FusariumWilt: 4,
    Anthracnose: 5,
    DampingOff: 6,
    BlackRot: 7,
    MosaicVirus: 8,
    AphidInfestation: 9,
    ThripsDamage: 10,
    WhiteflyInfestation: 11,
}

const parseDiseaseStatus = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const maybeNum = Number(value)
        if (!Number.isNaN(maybeNum)) return maybeNum
        const mapped = (diseaseEnumMap as any)[value]
        return mapped !== undefined ? mapped : undefined
    }
    return undefined
}

const buildEmptyScheduleForm = (): CreateScheduleRequest => ({
    farmId: 0,
    cropId: 0,
    staffId: 0,
    startDate: '',
    endDate: '',
    plantingDate: '',
    harvestDate: '',
    quantity: 0,
    status: 0,
    pesticideUsed: false,
    diseaseStatus: null,
    farmActivitiesId: 0,
})

interface ScheduleActionMenuProps {
    schedule: ScheduleListItem
    onView: (schedule: ScheduleListItem) => void
    onEdit: (schedule: ScheduleListItem) => void
    onAssignStaff: (schedule: ScheduleListItem) => void
    onUpdateStatus: (schedule: ScheduleListItem, nextStatus: ScheduleStatusString) => void
    actionLoading: { [key: string]: boolean }
}

const ScheduleActionMenu: React.FC<ScheduleActionMenuProps> = React.memo(({
    schedule,
    onView,
    onEdit,
    onAssignStaff,
    onUpdateStatus,
    actionLoading,
}) => {
    const [open, setOpen] = useState(false)
    const isLoading = actionLoading[`detail-${schedule.scheduleId}`] ||
        actionLoading[`edit-${schedule.scheduleId}`] ||
        actionLoading[`status-${schedule.scheduleId}`]

    const handleView = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
            setTimeout(() => {
                onView(schedule)
            }, 0)
        },
        [schedule, onView]
    )

    const handleEdit = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
            setTimeout(() => {
                onEdit(schedule)
            }, 0)
        },
        [schedule, onEdit]
    )

    const handleAssignStaff = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
            setTimeout(() => {
                onAssignStaff(schedule)
            }, 0)
        },
        [schedule, onAssignStaff]
    )

    const handleUpdateStatus = useCallback(
        (nextStatus: ScheduleStatusString) => (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
            setTimeout(() => {
                onUpdateStatus(schedule, nextStatus)
            }, 0)
        },
        [schedule, onUpdateStatus]
    )

    const nextStatus: ScheduleStatusString = isActiveStatus(schedule.status) ? 'DEACTIVATED' : 'ACTIVE'


    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-48"
                sideOffset={5}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <DropdownMenuItem
                    onClick={handleView}
                    className="cursor-pointer focus:bg-gray-100"
                    onSelect={(e) => e.preventDefault()}
                    disabled={actionLoading[`detail-${schedule.scheduleId}`]}
                >
                    Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleEdit}
                    className="cursor-pointer focus:bg-gray-100"
                    onSelect={(e) => e.preventDefault()}
                    disabled={actionLoading[`edit-${schedule.scheduleId}`]}
                >
                    Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleAssignStaff}
                    className="cursor-pointer focus:bg-gray-100"
                    onSelect={(e) => e.preventDefault()}
                >
                    Phân công nhân viên
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleUpdateStatus(nextStatus)}
                    className="cursor-pointer focus:bg-gray-100"
                    onSelect={(e) => e.preventDefault()}
                    disabled={actionLoading[`status-${schedule.scheduleId}`]}
                >
                    {isActiveStatus(schedule.status) ? 'Vô hiệu hóa lịch' : 'Kích hoạt lịch'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
})

ScheduleActionMenu.displayName = 'ScheduleActionMenu'

type SortOption = 'newest' | 'startDate' | 'cropName' | 'farmName'

export function BackendScheduleList({
    showCreate: externalShowCreate,
    onShowCreateChange,
    filteredItems: externalFilteredItems,
    onFilteredItemsChange,
}: BackendScheduleListProps) {
    const { toast } = useToast()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)
    const [data, setData] = useState<PaginatedSchedules | null>(null)
    const [loading, setLoading] = useState(false)
    const [internalShowCreate, setInternalShowCreate] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<number>>(new Set())
    const previousMaxIdRef = useRef<number>(0)

    const showCreate = externalShowCreate ?? internalShowCreate
    const setShowCreate = onShowCreateChange ?? setInternalShowCreate
    const [form, setForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)

    const [farms, setFarms] = useState<{ id: number; name: string }[]>([])
    const [crops, setCrops] = useState<{ id: number; name: string; status?: string }[]>([])
    const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
    const [activities, setActivities] = useState<ActivityOption[]>([])
    const [metaLoading, setMetaLoading] = useState(false)
    const [allSchedules, setAllSchedules] = useState<ScheduleListItem[]>([])

    const [internalFilteredItems, setInternalFilteredItems] = useState<ScheduleListItem[] | null>(null)
    const filteredItems = externalFilteredItems !== undefined ? externalFilteredItems : internalFilteredItems
    const setFilteredItems = onFilteredItemsChange ?? setInternalFilteredItems

    const [showDetail, setShowDetail] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [showAssignStaff, setShowAssignStaff] = useState(false)
    const [showUpdateStageModal, setShowUpdateStageModal] = useState(false)
    const [showThresholdInline, setShowThresholdInline] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
    const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetail | null>(null)
    const [editForm, setEditForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)
    const [editDetailActivityType, setEditDetailActivityType] = useState<string | null>(null)
    const [assignStaffId, setAssignStaffId] = useState<number>(0)
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
    const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [customToday, setCustomToday] = useState<string>('')
    const todayString = useMemo(() => new Date().toISOString().split('T')[0], [])
    const displayItems = filteredItems ?? data?.data.items ?? []
    const lastAutoUpdatedScheduleId = useRef<number | null>(null)

    const filteredSchedules = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase()

        return displayItems.filter(schedule => {
            if (statusFilter !== 'all') {
                const isActive = typeof schedule.status === 'number'
                    ? schedule.status === 1
                    : schedule.status === 'ACTIVE'
                if (statusFilter === 'active' && !isActive) return false
                if (statusFilter === 'inactive' && isActive) return false
            }

            if (normalizedSearch) {
                const cropName = (schedule.cropView?.cropName || '').toLowerCase()
                const farmName = (schedule.farmView?.farmName || '').toLowerCase()
                const staffName = (schedule.staff?.fullname || schedule.staffName || '').toLowerCase()
                if (!cropName.includes(normalizedSearch) &&
                    !farmName.includes(normalizedSearch) &&
                    !staffName.includes(normalizedSearch)) {
                    return false
                }
            }

            return true
        })
    }, [displayItems, searchTerm, statusFilter])

    const sortedSchedules = useMemo(() => {
        const sorted = [...filteredSchedules]

        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => {
                    const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
                    const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
                    if (aActive !== bActive) {
                        return aActive ? -1 : 1
                    }
                    const aId = a.scheduleId || 0
                    const bId = b.scheduleId || 0
                    return bId - aId
                })

            case 'startDate':
                return sorted.sort((a, b) => {
                    const aDate = new Date(a.startDate).getTime()
                    const bDate = new Date(b.startDate).getTime()
                    if (aDate === bDate) {
                        const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
                        const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
                        if (aActive !== bActive) return aActive ? -1 : 1
                        return (b.scheduleId || 0) - (a.scheduleId || 0)
                    }
                    return aDate - bDate
                })

            case 'cropName':
                return sorted.sort((a, b) => {
                    const nameA = (a.cropView?.cropName || '').toLowerCase()
                    const nameB = (b.cropView?.cropName || '').toLowerCase()
                    if (nameA === nameB) {
                        const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
                        const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
                        if (aActive !== bActive) return aActive ? -1 : 1
                        return (b.scheduleId || 0) - (a.scheduleId || 0)
                    }
                    return nameA.localeCompare(nameB, 'vi')
                })

            case 'farmName':
                return sorted.sort((a, b) => {
                    const nameA = (a.farmView?.farmName || '').toLowerCase()
                    const nameB = (b.farmView?.farmName || '').toLowerCase()
                    if (nameA === nameB) {
                        const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
                        const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
                        if (aActive !== bActive) return aActive ? -1 : 1
                        return (b.scheduleId || 0) - (a.scheduleId || 0)
                    }
                    return nameA.localeCompare(nameB, 'vi')
                })

            default:
                return sorted
        }
    }, [filteredSchedules, sortBy])

    const serverTotalPages = useMemo(() => {
        return data?.data?.totalPagesCount ?? Math.max(1, Math.ceil(sortedSchedules.length / pageSize))
    }, [data?.data?.totalPagesCount, sortedSchedules.length, pageSize])

    const serverTotalItems = useMemo(() => {
        return data?.data?.totalItemCount ?? sortedSchedules.length
    }, [data?.data?.totalItemCount, sortedSchedules.length])

    const paginatedSchedules = useMemo(() => {
        if (data?.data?.items) {
            return sortedSchedules
        }
        const start = (pageIndex - 1) * pageSize
        return sortedSchedules.slice(start, start + pageSize)
    }, [sortedSchedules, pageIndex, pageSize, data?.data?.items])

    const groupedSchedules = useMemo(() => {
        const groups = new Map<string, ScheduleListItem[]>()
        const groupOrder: string[] = []

        paginatedSchedules.forEach(schedule => {
            const key = schedule.cropView?.cropName || 'Khác'
            if (!groups.has(key)) {
                groups.set(key, [])
                groupOrder.push(key)
            }
            groups.get(key)!.push(schedule)
        })

        return groupOrder.map(key => [key, groups.get(key)!] as [string, ScheduleListItem[]])
    }, [paginatedSchedules])

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await scheduleService.getScheduleList(pageIndex, pageSize)

            const currentMaxId = Math.max(...res.data.items.map(s => s.scheduleId || 0), 0)

            if (currentMaxId > previousMaxIdRef.current && previousMaxIdRef.current > 0) {
                setNewlyCreatedIds(new Set([currentMaxId]))
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }, 100)
            }

            previousMaxIdRef.current = currentMaxId

            setData(res)
            setFilteredItems(null)
        } catch (e) {
            handleFetchError(e, toast, 'lịch tưới')
        } finally {
            setLoading(false)
        }
    }, [pageIndex, pageSize, toast])

    const loadAllSchedules = useCallback(async (silent = false): Promise<ScheduleListItem[]> => {
        try {
            const first = await scheduleService.getScheduleList(1, BULK_PAGE_SIZE)
            let items = [...first.data.items]
            const totalPages = first.data.totalPagesCount
            if (totalPages > 1) {
                const requests: Promise<PaginatedSchedules>[] = []
                for (let page = 2; page <= totalPages; page++) {
                    requests.push(scheduleService.getScheduleList(page, BULK_PAGE_SIZE))
                }
                const results = await Promise.all(requests)
                results.forEach(res => {
                    items = items.concat(res.data.items)
                })
            }
            setAllSchedules(items)
            return items
        } catch (e) {
            if (!silent) {
                handleFetchError(e, toast, 'lịch tưới (toàn bộ)')
            }
            return []
        }
    }, [toast])

    const validateSchedulePayload = useCallback((payload: CreateScheduleRequest, currentScheduleId?: number) => {
        const errors: string[] = []
        const start = toDateOnly(payload.startDate)
        const end = toDateOnly(payload.endDate)
        const planting = toDateOnly(payload.plantingDate)
        const harvest = toDateOnly(payload.harvestDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (!payload.farmId) errors.push('Vui lòng chọn nông trại.')
        if (!payload.cropId) errors.push('Vui lòng chọn mùa vụ.')
        if (!payload.staffId) errors.push('Vui lòng chọn nhân viên.')
        if (!payload.quantity || payload.quantity <= 0) errors.push('Số lượng phải lớn hơn 0.')
        if (!start) errors.push('Ngày bắt đầu không hợp lệ.')
        if (!end) errors.push('Ngày kết thúc không hợp lệ.')

        const ensureFuture = (date: Date | null, label: string) => {
            if (date && date < today) {
                errors.push(`${label} không được nằm trong quá khứ.`)
            }
        }

        ensureFuture(start, 'Ngày bắt đầu')
        ensureFuture(end, 'Ngày kết thúc')
        if (planting) ensureFuture(planting, 'Ngày gieo trồng')
        if (harvest) ensureFuture(harvest, 'Ngày thu hoạch')

        if (start && end && start >= end) {
            errors.push('Ngày bắt đầu phải trước ngày kết thúc và không trùng nhau.')
        }

        if (planting && harvest && planting >= harvest) {
            errors.push('Ngày gieo trồng phải trước ngày thu hoạch.')
        }

        if (start && planting && planting < start) {
            errors.push('Ngày gieo trồng phải nằm trong khoảng của lịch.')
        }

        if (end && planting && planting > end) {
            errors.push('Ngày gieo trồng phải nằm trong khoảng của lịch.')
        }

        if (start && harvest && harvest < start) {
            errors.push('Ngày thu hoạch phải nằm sau ngày bắt đầu.')
        }

        if (end && harvest && harvest > end) {
            errors.push('Ngày thu hoạch phải nằm trong khoảng của lịch.')
        }

        if (start && end && payload.farmId && payload.cropId && allSchedules.length) {
            const hasOverlap = allSchedules.some(s => {
                if (!s.startDate || !s.endDate) return false
                if (currentScheduleId && s.scheduleId === currentScheduleId) return false
                if (s.farmId !== payload.farmId || s.cropId !== payload.cropId) return false
                const existingStart = toDateOnly(s.startDate)
                const existingEnd = toDateOnly(s.endDate)
                if (!existingStart || !existingEnd) return false
                return rangesOverlap(existingStart, existingEnd, start, end)
            })
            if (hasOverlap) {
                errors.push('Khoảng thời gian bị trùng với lịch khác của cùng nông trại/cây trồng.')
            }
        }

        if (planting && payload.diseaseStatus !== null && payload.diseaseStatus !== undefined) {
            const daysDiff = Math.floor((planting.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (daysDiff >= 0 || (daysDiff >= -7 && daysDiff < 0)) {
                if (payload.diseaseStatus >= 0) {
                    errors.push('Cây mới gieo trồng (trong vòng 7 ngày gần đây hoặc trong tương lai) không thể có tình trạng bệnh. Vui lòng chọn "Không có bệnh".')
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        }
    }, [allSchedules])

    const ensureScheduleValidity = useCallback((payload: CreateScheduleRequest, currentScheduleId?: number) => {
        const result = validateSchedulePayload(payload, currentScheduleId)
        if (!result.valid) {
            toast({
                title: 'Dữ liệu không hợp lệ',
                description: result.errors.map(err => `• ${err}`).join('\n'),
                variant: 'destructive',
            })
            return false
        }
        return true
    }, [toast, validateSchedulePayload])

    useEffect(() => {
        load()
    }, [load])

    useEffect(() => {
        loadAllSchedules(true)
    }, [loadAllSchedules])

    const loadReferenceData = useCallback(async () => {
        const [farmRes, cropRes, staffResRaw, fa] = await Promise.all([
            farmService.getAllFarms(),
            cropService.getAllCropsList(),
            accountApi.getAvailableStaff(),
            farmActivityService.getActiveFarmActivities({ pageIndex: 1, pageSize: 1000 }),
        ])

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const validActivities = (fa.items || []).filter((a: FarmActivity) => {
            const end = a.endDate ? new Date(a.endDate) : null
            if (end && !Number.isNaN(end.getTime())) {
                return end >= today
            }
            return true
        })

        const formatDateSafe = (value?: string) => {
            if (!value) return ''
            try {
                return formatDate(value)
            } catch {
                return value
            }
        }

        return {
            farmOptions: farmRes.map(f => ({ id: f.farmId, name: f.farmName })),
            cropOptions: cropRes
                .filter(c => c.status === 'ACTIVE')
                .map(c => ({ id: c.cropId, name: c.cropName, status: c.status })),
            staffOptions: (() => {
                const staffList = Array.isArray(staffResRaw) ? staffResRaw : (staffResRaw && (staffResRaw as any).items) || []
                return staffList.map((s: any) => ({
                    id: s.accountId,
                    name: s.accountProfile?.fullname ?? s.fullname ?? s.email ?? s.username ?? ''
                }))
            })(),
            activityOptions: validActivities.map((a: FarmActivity) => {
                const start = formatDateSafe(a.startDate)
                const end = formatDateSafe(a.endDate)
                const dateLabel = start || end ? ` (${start || '...'} → ${end || '...'})` : ''
                return {
                    id: a.farmActivitiesId,
                    name: `${translateActivityType(a.activityType)}${dateLabel}`,
                }
            }),
        }
    }, [translateActivityType])

    useEffect(() => {
        const shouldLoadMetadata = showCreate || showEdit || showAssignStaff
        if (!shouldLoadMetadata) return
        let cancelled = false
            ; (async () => {
                try {
                    setMetaLoading(true)
                    const result = await loadReferenceData()
                    if (cancelled) return
                    setFarms(result.farmOptions)
                    setCrops(result.cropOptions)
                    setStaffs(result.staffOptions)
                    setActivities(result.activityOptions)
                } catch (e) {
                    if (!cancelled) {
                        handleFetchError(e, toast, 'danh sách tham chiếu')
                    }
                } finally {
                    if (!cancelled) setMetaLoading(false)
                }
            })()
        return () => {
            cancelled = true
        }
    }, [showCreate, showEdit, showAssignStaff, loadReferenceData, toast])

    const handleCreateDialogChange = useCallback((open: boolean) => {
        setShowCreate(open)
        if (!open) {
            setForm(buildEmptyScheduleForm())
        }
    }, [setShowCreate, setForm])

    const handleEditDialogChange = useCallback((open: boolean) => {
        setShowEdit(open)
        if (!open) {
            setSelectedSchedule(null)
            setEditForm(buildEmptyScheduleForm())
            setEditingScheduleId(null)
            setEditLoading(false)
        }
    }, [setShowEdit, setSelectedSchedule, setEditForm])

    const handleAssignStaffDialogChange = useCallback((open: boolean) => {
        setShowAssignStaff(open)
        if (!open) {
            setAssignStaffId(0)
        }
    }, [setShowAssignStaff, setAssignStaffId])

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        const currentMaxId = Math.max(...displayItems.map(s => s.scheduleId || 0), 0)
        previousMaxIdRef.current = currentMaxId

        const payload: CreateScheduleRequest = {
            ...form,
            plantingDate: form.plantingDate || form.startDate,
            harvestDate: form.harvestDate || form.endDate,
        }
        if (!ensureScheduleValidity(payload)) return
        try {
            await scheduleService.createSchedule(payload)
            handleApiSuccess('Tạo lịch thành công', toast)
            handleCreateDialogChange(false)
            await load()
            await loadAllSchedules()
        } catch (e) {
            handleCreateError(e, toast, 'lịch tưới')
        }
    }

    const handleViewDetail = async (schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        setActionLoading({ [`detail-${schedule.scheduleId}`]: true })
        try {
            const res = await scheduleService.getScheduleById(schedule.scheduleId)
            const normalized = { ...(res.data || {}), diseaseStatus: parseDiseaseStatus((res.data as any)?.diseaseStatus) }
            setScheduleDetail(normalized)
            setSelectedSchedule(schedule)
            setShowDetail(true)
        } catch (e) {
            toast({ title: 'Không thể tải chi tiết lịch', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`detail-${schedule.scheduleId}`]: false })
        }
    }

    useEffect(() => {
        if (showDetail && scheduleDetail?.scheduleId) {
            const scheduleId = scheduleDetail.scheduleId
            if (lastAutoUpdatedScheduleId.current !== scheduleId) {
                lastAutoUpdatedScheduleId.current = scheduleId
                    ; (async () => {
                        try {
                            setActionLoading(prev => ({ ...prev, [`update-today-${scheduleId}`]: true }))
                            await scheduleService.updateToday(scheduleId)
                            const res = await scheduleService.getScheduleById(scheduleId)
                            setScheduleDetail(res.data)
                            await load()
                            await loadAllSchedules()
                        } catch (e) {
                            console.error('Auto-update schedule stage failed:', e)
                        } finally {
                            setActionLoading(prev => ({ ...prev, [`update-today-${scheduleId}`]: false }))
                        }
                    })()
            }
        } else if (!showDetail) {
            lastAutoUpdatedScheduleId.current = null
        }
    }, [showDetail, scheduleDetail?.scheduleId, load, loadAllSchedules])

    useEffect(() => {
        if (!showDetail) {
            setShowThresholdInline(false)
        }
    }, [showDetail])

    const handleUpdateToday = async (customDate?: string) => {
        if (!scheduleDetail?.scheduleId) return
        const scheduleId = scheduleDetail.scheduleId
        setActionLoading({ [`update-today-${scheduleId}`]: true })
        try {
            await scheduleService.updateToday(scheduleId, customDate)
            handleApiSuccess('Cập nhật giai đoạn theo ngày thành công', toast)
            const res = await scheduleService.getScheduleById(scheduleId)
            setScheduleDetail(res.data)
            await load()
            await loadAllSchedules()
            if (customDate) {
                setShowUpdateStageModal(false)
                setCustomToday('')
            }
        } catch (e) {
            toast({
                title: 'Cập nhật giai đoạn thất bại',
                description: (e as Error).message,
                variant: 'destructive'
            })
        } finally {
            setActionLoading({ [`update-today-${scheduleId}`]: false })
        }
    }

    const handleUpdateStageByDate = () => {
        if (!customToday) {
            toast({
                title: 'Vui lòng chọn ngày',
                description: 'Bạn cần chọn một ngày để cập nhật giai đoạn.',
                variant: 'destructive',
            })
            return
        }
        handleUpdateToday(customToday)
    }

    const handleEdit = (schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        setSelectedSchedule(schedule)
        setEditForm(buildEmptyScheduleForm())
        setEditingScheduleId(schedule.scheduleId)
        handleEditDialogChange(true)
    }

    useEffect(() => {
        if (!editingScheduleId) return
        let cancelled = false
        setEditLoading(true)
        setActionLoading({ [`edit-${editingScheduleId}`]: true })
            ; (async () => {
                try {
                    setMetaLoading(true)
                    let metaResult: {
                        farmOptions: { id: number; name: string }[]
                        cropOptions: { id: number; name: string; status?: string }[]
                        staffOptions: { id: number; name: string }[]
                        activityOptions: ActivityOption[]
                    } | null = null
                    try {
                        metaResult = await loadReferenceData()
                        if (cancelled) return
                        setFarms(metaResult.farmOptions)
                        setCrops(metaResult.cropOptions)
                        setStaffs(metaResult.staffOptions)
                        setActivities(metaResult.activityOptions)
                    } catch (metaErr) {
                        console.error('Failed to load metadata for edit dialog:', metaErr)
                        if (!cancelled) {
                            handleFetchError(metaErr, toast, 'danh sách tham chiếu')
                        }
                    } finally {
                        if (!cancelled) setMetaLoading(false)
                    }

                    const res = await scheduleService.getScheduleById(editingScheduleId)
                    if (cancelled) return
                    const detail = res.data
                    setEditDetailActivityType(detail.farmActivityView?.activityType ?? null)

                    let resolvedFarmId = detail.farmId ?? detail.farmView?.farmId ?? 0
                    if ((!resolvedFarmId || resolvedFarmId === 0) && detail.farmView?.farmName) {
                        const matched = (metaResult?.farmOptions || farms).find((f: { id: number; name: string }) => f.name === detail.farmView?.farmName)
                        if (matched) resolvedFarmId = matched.id
                    }

                    let resolvedStaffId = detail.staffId ?? detail.staff?.accountId ?? 0
                    if ((!resolvedStaffId || resolvedStaffId === 0) && (detail.staff?.fullname || detail.staffName)) {
                        const staffNameToMatch = detail.staff?.fullname ?? detail.staffName
                        const matchedStaff = (metaResult?.staffOptions || staffs).find((s: { id: number; name: string }) => {
                            if (!s?.name || !staffNameToMatch) return false
                            return s.name.trim().toLowerCase() === staffNameToMatch.trim().toLowerCase() || String(s.id) === String(detail.staff?.accountId)
                        })
                        if (matchedStaff) {
                            resolvedStaffId = matchedStaff.id
                        } else if (staffNameToMatch) {
                            const tempId = detail.staff?.accountId ?? 0
                            setStaffs(prev => {
                                if (prev.some(p => p.id === tempId && p.name === staffNameToMatch)) return prev
                                return [{ id: tempId, name: staffNameToMatch }, ...prev]
                            })
                            resolvedStaffId = tempId
                        }
                    }

                    let resolvedStatus = 0
                    if (typeof detail.status === 'number') {
                        resolvedStatus = detail.status
                    } else if (typeof detail.status === 'string') {
                        const normalized = detail.status.toUpperCase()
                        if (normalized === 'ACTIVE') resolvedStatus = 1
                        else resolvedStatus = 0
                    }

                    let resolvedActivityId = detail.farmActivitiesId ?? detail.farmActivityView?.farmActivitiesId ?? 0
                    if ((!resolvedActivityId || resolvedActivityId === 0) && detail.farmActivityView?.activityType) {
                        const translated = translateActivityType(detail.farmActivityView.activityType)
                        const matchedOption = (metaResult?.activityOptions || activities).find((a: ActivityOption) => {
                            return a.name.startsWith(translated) || a.name.includes(translated)
                        })
                        if (matchedOption) {
                            resolvedActivityId = matchedOption.id
                        }
                    }

                    setEditForm({
                        farmId: resolvedFarmId ?? 0,
                        cropId: detail.cropId ?? 0,
                        staffId: resolvedStaffId ?? 0,
                        startDate: detail.startDate,
                        endDate: detail.endDate,
                        plantingDate: detail.plantingDate ?? '',
                        harvestDate: detail.harvestDate ?? '',
                        quantity: detail.quantity,
                        status: resolvedStatus,
                        pesticideUsed: detail.pesticideUsed,
                        diseaseStatus: parseDiseaseStatus((detail as any)?.diseaseStatus) ?? null,
                        farmActivitiesId: resolvedActivityId ?? 0,
                    })
                    const fav = detail.farmActivityView
                    const activityIdFromDetail = fav?.farmActivitiesId
                    if (fav && activityIdFromDetail) {
                        const exists = (metaResult?.activityOptions || activities).some((a: ActivityOption) => a.id === activityIdFromDetail)
                        if (!exists) {
                            const formatDateSafeLocal = (value?: string) => {
                                if (!value) return ''
                                try {
                                    return formatDate(value)
                                } catch {
                                    return value || ''
                                }
                            }
                            const start = fav.startDate ? formatDateSafeLocal(fav.startDate) : ''
                            const end = fav.endDate ? formatDateSafeLocal(fav.endDate) : ''
                            const dateLabel = start || end ? ` (${start || '...'} → ${end || '...'})` : ''
                            const name = `${translateActivityType(fav.activityType ?? '')}${dateLabel}`
                            setActivities(prev => {
                                if (prev.some(p => p.id === activityIdFromDetail)) return prev
                                return [...prev, { id: activityIdFromDetail, name }]
                            })
                        }
                    }
                    try {
                        const staffAccountId = detail.staff?.accountId ?? detail.staffId ?? 0
                        const staffDisplayName = detail.staff?.fullname ?? detail.staffName ?? ''
                        if (staffAccountId && staffDisplayName) {
                            setStaffs(prev => {
                                const hasExact = prev.some(p => String(p.id) === String(staffAccountId) && p.name === staffDisplayName)
                                if (hasExact) return prev
                                const updated = prev.map(p => (String(p.id) === String(staffAccountId) ? { ...p, name: staffDisplayName } : p))
                                if (updated.some(p => String(p.id) === String(staffAccountId) && p.name === staffDisplayName)) {
                                    return updated
                                }
                                return [{ id: staffAccountId, name: staffDisplayName }, ...prev]
                            })
                        }
                    } catch {
                    }
                } catch (e) {
                    if (!cancelled) {
                        toast({
                            title: 'Không thể tải thông tin lịch',
                            description: (e as Error).message,
                            variant: 'destructive',
                        })
                        handleEditDialogChange(false)
                    }
                } finally {
                    if (!cancelled) {
                        setEditLoading(false)
                        setActionLoading({ [`edit-${editingScheduleId}`]: false })
                        setMetaLoading(false)
                    }
                }
            })()
        return () => {
            cancelled = true
        }
    }, [editingScheduleId, toast, handleEditDialogChange, loadReferenceData])

    useEffect(() => {
        if (!editingScheduleId) return
        if (editForm.farmActivitiesId && editForm.farmActivitiesId > 0) return
        if (!editDetailActivityType) return

        const translated = translateActivityType(editDetailActivityType)
        const matched = activities.find(a => a.name.startsWith(translated) || a.name.includes(translated))
        if (matched) {
            setEditForm(prev => ({ ...prev, farmActivitiesId: matched.id }))
        }
    }, [activities, editingScheduleId, editForm.farmActivitiesId, editDetailActivityType])

    const handleUpdateSchedule = async (ev: React.FormEvent) => {
        ev.preventDefault()
        if (!selectedSchedule?.scheduleId) return
        if (!ensureScheduleValidity(editForm, selectedSchedule.scheduleId)) return
        setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: true })
        try {
            await scheduleService.updateSchedule(selectedSchedule.scheduleId, editForm)
            toast({ title: 'Cập nhật lịch thành công', variant: 'success' })
            handleEditDialogChange(false)
            await load()
            await loadAllSchedules()
        } catch (e) {
            toast({ title: 'Cập nhật lịch thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: false })
        }
    }


    const handleAssignStaff = async () => {
        if (!selectedSchedule?.scheduleId || !assignStaffId) return
        setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: true })
        try {
            await scheduleService.assignStaff(selectedSchedule.scheduleId, assignStaffId)
            toast({ title: 'Phân công nhân viên thành công', variant: 'success' })
            handleAssignStaffDialogChange(false)
            await load()
            await loadAllSchedules()
        } catch (e) {
            toast({ title: 'Phân công nhân viên thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: false })
        }
    }

    const handleUpdateStatus = async (schedule: ScheduleListItem, nextStatus: ScheduleStatusString) => {
        if (!schedule.scheduleId) return
        setActionLoading({ [`status-${schedule.scheduleId}`]: true })
        try {
            await scheduleService.updateScheduleStatus(schedule.scheduleId, nextStatus)
            toast({ title: 'Cập nhật trạng thái lịch thành công', variant: 'success' })
            if (showDetail && scheduleDetail?.scheduleId === schedule.scheduleId) {
                const res = await scheduleService.getScheduleById(schedule.scheduleId)
                setScheduleDetail(res.data)
            }
            await load()
            await loadAllSchedules()
        } catch (e) {
            toast({ title: 'Cập nhật trạng thái thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`status-${schedule.scheduleId}`]: false })
        }
    }

    useEffect(() => {
        if (newlyCreatedIds.size > 0) {
            const timer = setTimeout(() => {
                setNewlyCreatedIds(new Set())
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [newlyCreatedIds])

    useEffect(() => {
        setPageIndex(1)
    }, [searchTerm, statusFilter, sortBy])

    return (
        <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Tìm kiếm theo cây trồng, nông trại..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Tạm dừng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sắp xếp" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Mới nhất</SelectItem>
                                <SelectItem value="startDate">Ngày bắt đầu</SelectItem>
                                <SelectItem value="cropName">Tên cây trồng</SelectItem>
                                <SelectItem value="farmName">Tên nông trại</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-auto flex items-center">
                        <Button onClick={() => setShowCreate(true)} className="bg-green-600 hover:bg-green-700">
                            Tạo
                        </Button>
                    </div>
                </div>
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
                            {(() => {
                                if (searchTerm) return 'Không tìm thấy lịch tưới nào'
                                if (statusFilter === 'active') return 'Chưa có lịch tưới đang hoạt động'
                                if (statusFilter === 'inactive') return 'Chưa có lịch tưới đã tạm dừng'
                                return 'Chưa có lịch tưới'
                            })()}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            {(() => {
                                if (searchTerm) return 'Không có lịch tưới nào phù hợp với điều kiện lọc hiện tại.'
                                if (statusFilter === 'active') return 'Hãy tạo lịch tưới mới hoặc kích hoạt các lịch đã tạm dừng.'
                                if (statusFilter === 'inactive') return 'Hãy tạo lịch tưới mới hoặc kích hoạt các lịch đã tạm dừng.'
                                return 'Hãy tạo lịch tưới đầu tiên.'
                            })()}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="space-y-6">
                        {groupedSchedules.map(([cropName, items]) => {
                            return (
                                <div key={cropName} className="space-y-3">
                                    <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">{cropName}</h3>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                        {items.map((schedule) => {
                                            const isNewlyCreated = schedule.scheduleId ? newlyCreatedIds.has(schedule.scheduleId) : false
                                            const isActive = typeof schedule.status === 'number'
                                                ? schedule.status === 1
                                                : schedule.status === 'ACTIVE'

                                            return (
                                                <Card
                                                    key={schedule.scheduleId ?? `schedule-${schedule.farmId}-${schedule.cropId}`}
                                                    className={cn(
                                                        "hover:shadow-md transition-all cursor-pointer",
                                                        isNewlyCreated && "ring-2 ring-green-500 bg-green-50/50 shadow-lg"
                                                    )}
                                                    onClick={() => handleViewDetail(schedule)}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                    <Badge className={cn(
                                                                        "h-6 items-center whitespace-nowrap text-xs",
                                                                        isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                                                    )}>
                                                                        {getStatusLabel(schedule.status)}
                                                                    </Badge>
                                                                    {isNewlyCreated && (
                                                                        <Badge className="h-6 items-center whitespace-nowrap text-xs bg-green-500 text-white">
                                                                            Mới
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-900 font-medium mb-2">
                                                                    {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                                                                </p>

                                                                {schedule.farmView?.farmName && (
                                                                    <p className="text-xs text-gray-600 mb-1 truncate" title={schedule.farmView.farmName}>
                                                                        Nông trại: {schedule.farmView.farmName}
                                                                    </p>
                                                                )}
                                                                {schedule.staffName && (
                                                                    <p className="text-xs text-gray-600 mb-1 truncate" title={schedule.staffName}>
                                                                        Nhân viên: {schedule.staffName}
                                                                    </p>
                                                                )}
                                                                {schedule.quantity && (
                                                                    <p className="text-xs text-gray-600 mb-1">
                                                                        Số lượng cây trồng: {schedule.quantity}
                                                                    </p>
                                                                )}
                                                                {schedule.currentPlantStage && (
                                                                    <p className="text-xs text-gray-600">
                                                                        Giai đoạn hiện tại: {translatePlantStage(schedule.currentPlantStage)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {schedule.scheduleId && (
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <ScheduleActionMenu
                                                                        schedule={schedule}
                                                                        onView={handleViewDetail}
                                                                        onEdit={handleEdit}
                                                                        onAssignStaff={(s) => {
                                                                            setSelectedSchedule(s)
                                                                            handleAssignStaffDialogChange(true)
                                                                        }}
                                                                        onUpdateStatus={handleUpdateStatus}
                                                                        actionLoading={actionLoading}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Hiển thị {paginatedSchedules.length} / {serverTotalItems}
                        </div>
                        {serverTotalPages > 1 && (
                            <div>
                                <Pagination
                                    currentPage={pageIndex}
                                    totalPages={serverTotalPages}
                                    onPageChange={setPageIndex}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            <Dialog open={showCreate} onOpenChange={handleCreateDialogChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tạo lịch tưới mới</DialogTitle>
                    </DialogHeader>
                    <form className="grid grid-cols-2 md:grid-cols-3 gap-3" onSubmit={submit}>
                        <div>
                            <Label>Nông trại</Label>
                            <Select
                                value={form.farmId ? String(form.farmId) : ''}
                                onValueChange={v => setForm({ ...form, farmId: Number(v) })}
                                disabled={metaLoading || editLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn nông trại'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {farms.map(f => (
                                        <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Cây trồng</Label>
                            <Select
                                value={form.cropId ? String(form.cropId) : ''}
                                onValueChange={v => setForm({ ...form, cropId: Number(v) })}
                                disabled={metaLoading || editLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn cây trồng'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-56 overflow-y-auto">
                                    {crops.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Nhân viên</Label>
                            <Select
                                value={form.staffId ? String(form.staffId) : ''}
                                onValueChange={v => setForm({ ...form, staffId: Number(v) })}
                                disabled={metaLoading || editLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn nhân viên'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {staffs.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Ngày bắt đầu</Label>
                            <Input
                                type="date"
                                min={todayString}
                                value={form.startDate}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Ngày kết thúc</Label>
                            <Input
                                type="date"
                                min={form.startDate || todayString}
                                value={form.endDate}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Số lượng</Label>
                            <Input
                                type="number"
                                min={1}
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <Label>Trạng thái</Label>
                            <Select
                                value={String(form.status)}
                                onValueChange={v => setForm({ ...form, status: Number(v) })}
                                disabled={metaLoading || editLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(o => (
                                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Tình trạng bệnh</Label>
                            <div className="mt-2 text-sm text-gray-700">Không có bệnh</div>
                        </div>
                        <div>
                            <Label>Hoạt động nông trại</Label>
                            <Select
                                value={form.farmActivitiesId ? String(form.farmActivitiesId) : ''}
                                onValueChange={v => setForm({ ...form, farmActivitiesId: Number(v) })}
                                disabled={metaLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn hoạt động'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {activities.map(a => (
                                        <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2 col-span-2 md:col-span-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.pesticideUsed}
                                    onChange={e => setForm({ ...form, pesticideUsed: e.target.checked })}
                                />
                                <span>Đã dùng thuốc BVTV</span>
                            </label>
                            <div className="ml-auto flex gap-2">
                                {metaLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                <Button type="button" variant="outline" size="sm" onClick={() => handleCreateDialogChange(false)}>Hủy</Button>
                                <Button type="submit" size="sm" disabled={metaLoading}>Tạo</Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
                        <DialogTitle>Chi tiết lịch tưới</DialogTitle>
                        {scheduleDetail?.scheduleId && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowThresholdInline(prev => !prev)
                                    }}
                                    className="p-2"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowUpdateStageModal(true)}
                                    className="flex items-center gap-2"
                                >
                                    Cập nhật giai đoạn theo ngày
                                </Button>
                            </div>
                        )}
                    </DialogHeader>
                    {scheduleDetail && (
                        <div className={`grid grid-cols-1 ${showThresholdInline ? 'lg:grid-cols-[1fr_360px]' : 'lg:grid-cols-1'} gap-6`}>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><strong>Ngày bắt đầu:</strong> {formatDate(scheduleDetail.startDate)}</div>
                                        <div><strong>Ngày kết thúc:</strong> {formatDate(scheduleDetail.endDate)}</div>
                                        <div>
                                            <strong>Trạng thái:</strong>{' '}
                                            <Badge variant={isActiveStatus(scheduleDetail.status) ? 'success' : 'destructive'}>
                                                {getStatusLabel(scheduleDetail.status)}
                                            </Badge>
                                        </div>
                                        <div><strong>Thuốc BVTV:</strong> {scheduleDetail.pesticideUsed ? 'Có' : 'Không'}</div>
                                        <div><strong>Tình trạng bệnh:</strong> {getDiseaseLabel(scheduleDetail.diseaseStatus)}</div>
                                        <div>
                                            <strong>Giai đoạn hiện tại:</strong>{' '}
                                            {scheduleDetail.currentPlantStage
                                                ? translatePlantStage(scheduleDetail.currentPlantStage)
                                                : scheduleDetail.cropView?.plantStage
                                                    ? translatePlantStage(scheduleDetail.cropView.plantStage)
                                                    : '-'}
                                        </div>
                                        <div>
                                            <strong>Tạo lúc:</strong>{' '}
                                            {scheduleDetail.createdAt ? formatDate(scheduleDetail.createdAt) : '-'}
                                        </div>
                                    </div>
                                </div>

                                {scheduleDetail.staff && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Thông tin nhân viên</h3>
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                            <div><strong>Họ tên:</strong> {scheduleDetail.staff.fullname ?? scheduleDetail.staffName ?? '-'}</div>
                                            <div><strong>Số điện thoại:</strong> {scheduleDetail.staff.phone ?? '-'}</div>
                                            {scheduleDetail.staff.email && (
                                                <div><strong>Email:</strong> {scheduleDetail.staff.email}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {scheduleDetail.farmView && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Thông tin nông trại</h3>
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                            <div><strong>Tên nông trại:</strong> {scheduleDetail.farmView.farmName ?? `#${scheduleDetail.farmView.farmId}`}</div>
                                            <div><strong>Địa điểm:</strong> {scheduleDetail.farmView.location ?? '-'}</div>
                                        </div>
                                    </div>
                                )}

                                {scheduleDetail.cropView && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Thông tin cây trồng</h3>
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                            <div><strong>Tên cây trồng:</strong> {scheduleDetail.cropView.cropName ?? `#${scheduleDetail.cropView.cropId}`}</div>
                                            <div><strong>Số lượng cây trồng:</strong> {scheduleDetail.quantity}</div>
                                            {scheduleDetail.cropView.origin && (
                                                <div><strong>Nguồn gốc:</strong> {scheduleDetail.cropView.origin}</div>
                                            )}
                                            {scheduleDetail.cropView.description && (
                                                <div className="col-span-2">
                                                    <strong>Mô tả:</strong>
                                                    <p className="mt-1 text-sm text-muted-foreground">{scheduleDetail.cropView.description}</p>
                                                </div>
                                            )}
                                        </div>
                                        {(() => {
                                            const allReqs = (scheduleDetail.cropRequirement ?? scheduleDetail.cropView?.cropRequirement) || []
                                            if (!allReqs || allReqs.length === 0) return null

                                            const sortedReqs = [...allReqs].sort((a, b) => {
                                                const aActive = (a as unknown as { isActive?: boolean }).isActive ? 1 : 0
                                                const bActive = (b as unknown as { isActive?: boolean }).isActive ? 1 : 0
                                                return bActive - aActive
                                            })



                                            return (
                                                <div className="mt-4">
                                                    <h4 className="text-md font-semibold mb-3">Yêu cầu cây trồng</h4>
                                                    <div className="space-y-3">
                                                        {sortedReqs.map((req, idx) => {
                                                            const r = req as any
                                                            const reqIsActive = r.isActive
                                                            return (
                                                                <div key={r.cropRequirementId ?? idx} className="relative p-4 bg-muted/30 rounded-lg border border-muted">
                                                                    <div className="absolute right-3 top-3">
                                                                        <Badge
                                                                            variant={reqIsActive ? 'success' : 'destructive'}
                                                                            className="text-xs"
                                                                        >
                                                                            {reqIsActive ? 'Hoạt động' : 'Tạm dừng'}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="text-xs bg-white">
                                                                                {translatePlantStage(r.plantStage)}
                                                                            </Badge>
                                                                            {r.estimatedDate && (
                                                                                <span className="text-sm text-muted-foreground">
                                                                                    Ước tính: {r.estimatedDate} ngày
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                                        {r.temperature !== null && r.temperature !== undefined && (
                                                                            <div><strong>Nhiệt độ:</strong> {r.temperature}°C</div>
                                                                        )}
                                                                        {r.moisture !== null && r.moisture !== undefined && (
                                                                            <div><strong>Độ ẩm:</strong> {r.moisture}%</div>
                                                                        )}
                                                                        {r.lightRequirement !== null && r.lightRequirement !== undefined && (
                                                                            <div><strong>Ánh sáng:</strong> {r.lightRequirement}</div>
                                                                        )}
                                                                        {r.wateringFrequency && (
                                                                            <div><strong>Tưới nước:</strong> {r.wateringFrequency} lần/ngày</div>
                                                                        )}
                                                                        {r.fertilizer && (
                                                                            <div className="col-span-2"><strong>Phân bón:</strong> {r.fertilizer}</div>
                                                                        )}
                                                                        {r.notes && (
                                                                            <div className="col-span-2">
                                                                                <strong>Ghi chú:</strong>
                                                                                <div className="mt-1 text-sm text-muted-foreground">{r.notes}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}

                                {scheduleDetail.farmActivityView && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Thông tin hoạt động nông trại</h3>
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                            <div>
                                                <strong>Loại hoạt động:</strong>{' '}
                                                {scheduleDetail.farmActivityView.activityType
                                                    ? translateActivityType(scheduleDetail.farmActivityView.activityType)
                                                    : `#${scheduleDetail.farmActivityView.farmActivitiesId}`}
                                            </div>
                                            {scheduleDetail.farmActivityView.status && (() => {
                                                const statusInfo = getFarmActivityStatusInfo(scheduleDetail.farmActivityView.status)
                                                return (
                                                    <div>
                                                        <strong>Trạng thái:</strong>{' '}
                                                        <Badge variant={statusInfo.variant}>
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="hidden lg:block">
                                {showThresholdInline && (
                                    <div className="sticky top-6 self-start p-4 bg-white rounded-lg border">
                                        <h3 className="text-lg font-semibold mb-3">Cấu hình ngưỡng</h3>
                                        <ThresholdPanel />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showEdit} onOpenChange={handleEditDialogChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa lịch tưới</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSchedule}>
                        <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-3" disabled={editLoading}>
                            {editLoading && (
                                <div className="col-span-2 md:col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang tải dữ liệu lịch...
                                </div>
                            )}
                            <div>
                                <Label>Farm</Label>
                                <Select
                                    value={editForm.farmId != null && editForm.farmId > 0 ? String(editForm.farmId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, farmId: Number(v) })}
                                    disabled={true}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn nông trại'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {farms.map(f => (
                                            <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Crop</Label>
                                <Select
                                    value={editForm.cropId != null && editForm.cropId > 0 ? String(editForm.cropId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, cropId: Number(v) })}
                                    disabled={true}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn cây trồng'} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-56 overflow-y-auto">
                                        {crops.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Staff</Label>
                                <Select
                                    value={editForm.staffId != null ? String(editForm.staffId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, staffId: Number(v) })}
                                    disabled={metaLoading || editLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn nhân viên'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffs.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Ngày bắt đầu</Label>
                                <Input
                                    type="date"
                                    min={todayString}
                                    value={editForm.startDate}
                                    onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Ngày kết thúc</Label>
                                <Input
                                    type="date"
                                    min={editForm.startDate || todayString}
                                    value={editForm.endDate}
                                    onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Số lượng</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={editForm.quantity}
                                    onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Trạng thái</Label>
                                <Select
                                    value={String(editForm.status)}
                                    onValueChange={v => setEditForm({ ...editForm, status: Number(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map(opt => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Tình trạng bệnh</Label>
                                <Select
                                    value={getDiseaseSelectValue(editForm.diseaseStatus)}
                                    onValueChange={v => {
                                        const numValue = Number(v)
                                        setEditForm({ ...editForm, diseaseStatus: numValue === -1 ? null : numValue })
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {diseaseOptions.map(opt => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Hoạt động</Label>
                                <Select
                                    value={editForm.farmActivitiesId != null && editForm.farmActivitiesId > 0 ? String(editForm.farmActivitiesId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, farmActivitiesId: Number(v) })}
                                    disabled={metaLoading || editLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={metaLoading || editLoading ? 'Đang tải...' : 'Chọn hoạt động'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activities.map(a => (
                                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="editPesticide"
                                    checked={editForm.pesticideUsed}
                                    onChange={e => setEditForm({ ...editForm, pesticideUsed: e.target.checked })}
                                />
                                <Label htmlFor="editPesticide">Sử dụng thuốc BVTV</Label>
                            </div>
                        </fieldset>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleUpdateSchedule}
                            disabled={actionLoading[`update-${selectedSchedule?.scheduleId}`]}
                        >
                            {actionLoading[`update-${selectedSchedule?.scheduleId}`] && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showAssignStaff} onOpenChange={handleAssignStaffDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Phân công nhân viên</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nhân viên</Label>
                            <Select
                                value={assignStaffId ? String(assignStaffId) : ''}
                                onValueChange={v => setAssignStaffId(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhân viên" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staffs.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleAssignStaffDialogChange(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleAssignStaff}
                            disabled={!assignStaffId || actionLoading[`assign-${selectedSchedule?.scheduleId}`]}
                        >
                            {actionLoading[`assign-${selectedSchedule?.scheduleId}`] && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Phân công
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showUpdateStageModal} onOpenChange={setShowUpdateStageModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            Cập nhật giai đoạn theo ngày
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Input
                                id="customToday"
                                type="date"
                                value={customToday}
                                onChange={(e) => setCustomToday(e.target.value)}
                                min={scheduleDetail?.startDate ? new Date(scheduleDetail.startDate).toISOString().split('T')[0] : undefined}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowUpdateStageModal(false)
                                setCustomToday('')
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateStageByDate}
                            disabled={!customToday || actionLoading[`update-today-${scheduleDetail?.scheduleId}`]}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading[`update-today-${scheduleDetail?.scheduleId}`] ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                'Cập nhật giai đoạn'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}


