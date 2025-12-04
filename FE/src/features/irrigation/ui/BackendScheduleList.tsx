import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { scheduleService, type PaginatedSchedules, type CreateScheduleRequest, type ScheduleDetail, type ScheduleListItem } from '@/shared/api/scheduleService'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Loader2, MoreHorizontal } from 'lucide-react'
import {
    StaffDataTable,
    type StaffDataTableColumn,
} from '@/shared/ui'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'
import { farmActivityService, type FarmActivity } from '@/shared/api/farmActivityService'
import { handleFetchError, handleCreateError, handleApiSuccess } from '@/shared/lib/error-handler'
import { formatDate, formatDateTime } from '@/shared/lib/date-utils'

interface BackendScheduleListProps {
    showCreate?: boolean
    onShowCreateChange?: (v: boolean) => void
    staffFilter?: number | null
    onStaffFilterChange?: (filter: number | null) => void
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
    Sowing: 'Gieo trồng',
    Irrigation: 'Tưới tiêu',
    Harvesting: 'Thu hoạch',
    Fertilization: 'Bón phân',
    Protection: 'Bảo vệ thực vật',
}

const plantStageLabels: Record<string, string> = {
    Sowing: 'Gieo hạt',
    Germination: 'Nảy mầm',
    CotyledonLeaves: 'Ra lá mầm',
    TrueLeavesGrowth: 'Phát triển lá thật',
    VigorousGrowth: 'Tăng trưởng mạnh',
    ReadyForHarvest: 'Sẵn sàng thu hoạch',
    PostHarvest: 'Sau thu hoạch',
}

const statusOptions = [
    { value: 0, label: 'Vô hiệu hóa' },
    { value: 1, label: 'Hoạt động' },
]

const diseaseOptions = [
    { value: -1, label: 'Không có bệnh' },
    { value: 0, label: 'Bệnh mốc sương' },
    { value: 1, label: 'Bệnh phấn trắng' },
    { value: 2, label: 'Bệnh đốm lá' },
    { value: 3, label: 'Thối nhũn do vi khuẩn' },
    { value: 4, label: 'Héo vàng Fusarium' },
    { value: 5, label: 'Bệnh thán thư' },
    { value: 6, label: 'Bệnh chết cây con' },
    { value: 7, label: 'Thối đen' },
    { value: 8, label: 'Virus khảm' },
    { value: 9, label: 'Rệp hại' },
    { value: 10, label: 'Hại do bọ trĩ' },
    { value: 11, label: 'Ruồi trắng gây hại' },
]

const translateActivityType = (type: string) => activityTypeLabels[type] ?? type
const translatePlantStage = (stage?: string | null) => {
    if (!stage) return '-'
    return plantStageLabels[stage] ?? stage
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

const getDiseaseLabel = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === -1) return 'Không có bệnh'
    return diseaseOptions.find(option => option.value === value)?.label ?? String(value)
}

const getDiseaseSelectValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-1'
    return String(value)
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

// Component riêng cho Action Menu
interface ScheduleActionMenuProps {
    schedule: ScheduleListItem
    onView: (schedule: ScheduleListItem) => void
    onEdit: (schedule: ScheduleListItem) => void
    onAssignStaff: (schedule: ScheduleListItem) => void
    actionLoading: { [key: string]: boolean }
}

const ScheduleActionMenu: React.FC<ScheduleActionMenuProps> = React.memo(({
    schedule,
    onView,
    onEdit,
    onAssignStaff,
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
            </DropdownMenuContent>
        </DropdownMenu>
    )
})

ScheduleActionMenu.displayName = 'ScheduleActionMenu'

export function BackendScheduleList({
    showCreate: externalShowCreate,
    onShowCreateChange,
    staffFilter: externalStaffFilter,
    onStaffFilterChange,
    filteredItems: externalFilteredItems,
    onFilteredItemsChange,
}: BackendScheduleListProps) {
    const { toast } = useToast()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)
    const [data, setData] = useState<PaginatedSchedules | null>(null)
    const [loading, setLoading] = useState(false)
    const [internalShowCreate, setInternalShowCreate] = useState(false)

    const showCreate = externalShowCreate ?? internalShowCreate
    const setShowCreate = onShowCreateChange ?? setInternalShowCreate
    const [form, setForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)

    const [farms, setFarms] = useState<{ id: number; name: string }[]>([])
    const [crops, setCrops] = useState<{ id: number; name: string }[]>([])
    const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
    const [activities, setActivities] = useState<ActivityOption[]>([])
    const [metaLoading, setMetaLoading] = useState(false)
    const [allSchedules, setAllSchedules] = useState<ScheduleListItem[]>([])

    // Use external state if provided, otherwise use internal state
    const [internalFilteredItems, setInternalFilteredItems] = useState<ScheduleListItem[] | null>(null)
    const filteredItems = externalFilteredItems !== undefined ? externalFilteredItems : internalFilteredItems
    const setFilteredItems = onFilteredItemsChange ?? setInternalFilteredItems

    const [internalStaffFilter] = useState<number | null>(null)

    const [showDetail, setShowDetail] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [showAssignStaff, setShowAssignStaff] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
    const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetail | null>(null)
    const [editForm, setEditForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)
    const [assignStaffId, setAssignStaffId] = useState<number>(0)
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
    const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const todayString = useMemo(() => new Date().toISOString().split('T')[0], [])
    const displayItems = filteredItems ?? data?.data.items ?? []
    const isFiltered = filteredItems !== null

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await scheduleService.getScheduleList(pageIndex, pageSize)
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
            // Chỉ hiển thị error khi không phải silent mode (khi user thực sự cần validate)
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
        if (!planting) errors.push('Ngày gieo trồng không hợp lệ.')
        if (!harvest) errors.push('Ngày thu hoạch không hợp lệ.')

        const ensureFuture = (date: Date | null, label: string) => {
            if (date && date < today) {
                errors.push(`${label} không được nằm trong quá khứ.`)
            }
        }

        ensureFuture(start, 'Ngày bắt đầu')
        ensureFuture(end, 'Ngày kết thúc')
        ensureFuture(planting, 'Ngày gieo trồng')
        ensureFuture(harvest, 'Ngày thu hoạch')

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

        if (payload.startDate && payload.endDate && payload.plantingDate && payload.harvestDate) {
            const unique = new Set([
                payload.startDate,
                payload.endDate,
                payload.plantingDate,
                payload.harvestDate,
            ])
            if (unique.size < 4) {
                errors.push('Các mốc thời gian không được trùng nhau.')
            }
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

        // Validate: Cây mới gieo trồng không thể có tình trạng bệnh
        if (planting && payload.diseaseStatus !== null && payload.diseaseStatus !== undefined) {
            // Tính số ngày từ ngày gieo trồng đến hôm nay
            const daysDiff = Math.floor((planting.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            // Nếu ngày gieo trồng là hôm nay hoặc trong tương lai, hoặc trong vòng 7 ngày gần đây
            if (daysDiff >= 0 || (daysDiff >= -7 && daysDiff < 0)) {
                // Kiểm tra xem có chọn bệnh không (-1 là "Không có bệnh", >= 0 là các loại bệnh)
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
        // Load trong background, không hiển thị error nếu fail (vì dữ liệu chính đã được load bởi load())
        loadAllSchedules(true)
    }, [loadAllSchedules])

    const loadReferenceData = useCallback(async () => {
        const [farmRes, cropRes, staffRes, fa] = await Promise.all([
            farmService.getAllFarms(),
            cropService.getAllCropsList(),
            accountApi.getAll({ role: 'Staff', pageSize: 1000 }),
            farmActivityService.getAllFarmActivities({ pageIndex: 1, pageSize: 1000 })
        ])

        return {
            farmOptions: farmRes.map(f => ({ id: f.farmId, name: f.farmName })),
            cropOptions: cropRes.map(c => ({ id: c.cropId, name: c.cropName })),
            staffOptions: staffRes.items.map(s => ({ id: s.accountId, name: s.email })),
            activityOptions: (fa.items || []).map((a: FarmActivity) => ({
                id: a.farmActivitiesId,
                name: `#${a.farmActivitiesId} • ${translateActivityType(a.activityType)}`,
            })),
        }
    }, [translateActivityType])

    // Load metadata whenever any dialog/filter that depends on it is opened
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
        if (!ensureScheduleValidity(form)) return
        try {
            await scheduleService.createSchedule(form)
            handleApiSuccess('Tạo lịch thành công', toast)
            handleCreateDialogChange(false)
            await load()
            await loadAllSchedules()
        } catch (e) {
            handleCreateError(e, toast, 'lịch tưới')
        }
    }

    // New action handlers
    const handleViewDetail = async (schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        setActionLoading({ [`detail-${schedule.scheduleId}`]: true })
        try {
            const res = await scheduleService.getScheduleById(schedule.scheduleId)
            setScheduleDetail(res.data)
            setSelectedSchedule(schedule)
            setShowDetail(true)
        } catch (e) {
            toast({ title: 'Không thể tải chi tiết lịch', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`detail-${schedule.scheduleId}`]: false })
        }
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
                    const res = await scheduleService.getScheduleById(editingScheduleId)
                    if (cancelled) return
                    const detail = res.data
                    setEditForm({
                        farmId: detail.farmId ?? 0,
                        cropId: detail.cropId ?? 0,
                        staffId: detail.staffId ?? 0,
                        startDate: detail.startDate,
                        endDate: detail.endDate,
                        plantingDate: detail.plantingDate ?? '',
                        harvestDate: detail.harvestDate ?? '',
                        quantity: detail.quantity,
                        status: typeof detail.status === 'number' ? detail.status : 0,
                        pesticideUsed: detail.pesticideUsed,
                        diseaseStatus: detail.diseaseStatus ?? null,
                        farmActivitiesId: detail.farmActivitiesId ?? 0,
                    })
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
                    }
                }
            })()
        return () => {
            cancelled = true
        }
    }, [editingScheduleId, toast, handleEditDialogChange])

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

    const handleToggleStatus = async (schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        const currentStatus = typeof schedule.status === 'number' ? schedule.status : 0
        const newStatus = currentStatus === 1 ? 'DEACTIVATED' : 'ACTIVE'
        setActionLoading({ [`status-${schedule.scheduleId}`]: true })
        try {
            await scheduleService.updateScheduleStatus(schedule.scheduleId, newStatus)
            toast({ title: 'Cập nhật trạng thái thành công', variant: 'success' })
            await load()
            await loadAllSchedules()
        } catch (e) {
            toast({ title: 'Cập nhật trạng thái thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`status-${schedule.scheduleId}`]: false })
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

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <StaffDataTable<ScheduleListItem>
                            className="px-4 sm:px-6 pb-6"
                            data={displayItems}
                            getRowKey={(schedule, index) => schedule.scheduleId ?? `schedule-${index}`}
                            currentPage={isFiltered ? 1 : pageIndex}
                            pageSize={isFiltered ? displayItems.length : pageSize}
                            totalPages={isFiltered ? 1 : (data?.data.totalPagesCount ?? 1)}
                            onPageChange={isFiltered ? undefined : setPageIndex}
                            emptyTitle="Không tìm thấy lịch tưới nào"
                            emptyDescription={
                                isFiltered
                                    ? 'Không có lịch tưới nào phù hợp với điều kiện lọc hiện tại.'
                                    : 'Hãy tạo lịch tưới đầu tiên.'
                            }
                            columns={[
                                {
                                    id: 'startDate',
                                    header: 'Ngày bắt đầu',
                                    render: (schedule: ScheduleListItem) => (
                                        <div className="font-medium">{formatDate(schedule.startDate)}</div>
                                    ),
                                },
                                {
                                    id: 'endDate',
                                    header: 'Ngày kết thúc',
                                    render: (schedule: ScheduleListItem) => (
                                        <div>{formatDate(schedule.endDate)}</div>
                                    ),
                                },
                                {
                                    id: 'status',
                                    header: 'Trạng thái',
                                    render: (schedule: ScheduleListItem) => (
                                        <Badge variant={typeof schedule.status === 'number' && schedule.status === 1 ? 'default' : 'secondary'}>
                                            {getStatusLabel(schedule.status)}
                                        </Badge>
                                    ),
                                },
                                {
                                    id: 'staff',
                                    header: 'Nhân viên',
                                    render: (schedule: ScheduleListItem) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{schedule.staff?.fullname ?? schedule.staffName ?? '-'}</span>
                                            {schedule.staff?.phone && (
                                                <span className="text-xs text-muted-foreground">{schedule.staff.phone}</span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    id: 'farm',
                                    header: 'Nông trại',
                                    render: (schedule: ScheduleListItem) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{schedule.farmView?.farmName ?? `#${schedule.farmId ?? '-'}`}</span>
                                            {schedule.farmView?.location && (
                                                <span className="text-xs text-muted-foreground">{schedule.farmView.location}</span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    id: 'crop',
                                    header: 'Cây trồng',
                                    render: (schedule: ScheduleListItem) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{schedule.cropView?.cropName ?? `#${schedule.cropId ?? '-'}`}</span>
                                            {schedule.cropView?.description && (
                                                <span className="text-xs text-muted-foreground line-clamp-1" title={schedule.cropView.description}>
                                                    {schedule.cropView.description}
                                                </span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    id: 'actions',
                                    header: '',
                                    render: (schedule: ScheduleListItem) => (
                                        <ScheduleActionMenu
                                            schedule={schedule}
                                            onView={handleViewDetail}
                                            onEdit={handleEdit}
                                            onAssignStaff={(s) => {
                                                setSelectedSchedule(s)
                                                handleAssignStaffDialogChange(true)
                                            }}
                                            actionLoading={actionLoading}
                                        />
                                    ),
                                },
                            ] satisfies StaffDataTableColumn<ScheduleListItem>[]}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={showCreate} onOpenChange={handleCreateDialogChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tạo lịch tưới mới</DialogTitle>
                    </DialogHeader>
                    <form className="grid grid-cols-2 md:grid-cols-3 gap-3" onSubmit={submit}>
                        <div>
                            <Label>Farm</Label>
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
                            <Label>Crop</Label>
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
                            <Label>Staff</Label>
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
                            <Label>Ngày gieo trồng</Label>
                            <Input
                                type="date"
                                min={form.startDate || todayString}
                                max={form.endDate || undefined}
                                value={form.plantingDate}
                                onChange={e => setForm({ ...form, plantingDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Ngày thu hoạch</Label>
                            <Input
                                type="date"
                                min={form.plantingDate || form.startDate || todayString}
                                max={form.endDate || undefined}
                                value={form.harvestDate}
                                onChange={e => setForm({ ...form, harvestDate: e.target.value })}
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
                            <Select
                                value={getDiseaseSelectValue(form.diseaseStatus)}
                                onValueChange={v => {
                                    const numValue = Number(v)
                                    setForm({ ...form, diseaseStatus: numValue === -1 ? null : numValue })
                                }}
                                disabled={metaLoading || editLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tình trạng bệnh" />
                                </SelectTrigger>
                                <SelectContent>
                                    {diseaseOptions.map(o => (
                                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Mã hoạt động nông trại</Label>
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

            {/* Detail View Modal */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chi tiết lịch tưới</DialogTitle>
                    </DialogHeader>
                    {scheduleDetail && (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><strong>Ngày bắt đầu:</strong> {formatDate(scheduleDetail.startDate)}</div>
                                    <div><strong>Ngày kết thúc:</strong> {formatDate(scheduleDetail.endDate)}</div>
                                    <div><strong>Ngày gieo trồng:</strong> {formatDate(scheduleDetail.plantingDate)}</div>
                                    <div><strong>Ngày thu hoạch:</strong> {formatDate(scheduleDetail.harvestDate)}</div>
                                    <div>
                                        <strong>Trạng thái:</strong>{' '}
                                        <Badge variant={typeof scheduleDetail.status === 'number' && scheduleDetail.status === 1 ? 'success' : 'secondary'}>
                                            {getStatusLabel(scheduleDetail.status)}
                                        </Badge>
                                    </div>
                                    <div><strong>Thuốc BVTV:</strong> {scheduleDetail.pesticideUsed ? 'Có' : 'Không'}</div>
                                    <div><strong>Tình trạng bệnh:</strong> {getDiseaseLabel(scheduleDetail.diseaseStatus)}</div>
                                    <div><strong>Tạo lúc:</strong> {formatDateTime(scheduleDetail.createdAt)}</div>
                                </div>
                            </div>

                            {/* Staff Information */}
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

                            {/* Farm Information */}
                            {scheduleDetail.farmView && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Thông tin nông trại</h3>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div><strong>Tên nông trại:</strong> {scheduleDetail.farmView.farmName ?? `#${scheduleDetail.farmView.farmId}`}</div>
                                        <div><strong>Địa điểm:</strong> {scheduleDetail.farmView.location ?? '-'}</div>
                                        {scheduleDetail.farmView.createdAt && (
                                            <div><strong>Ngày tạo:</strong> {formatDate(scheduleDetail.farmView.createdAt)}</div>
                                        )}
                                        {scheduleDetail.farmView.updatedAt && (
                                            <div><strong>Ngày cập nhật:</strong> {formatDate(scheduleDetail.farmView.updatedAt)}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Crop Information */}
                            {scheduleDetail.cropView && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Thông tin cây trồng</h3>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div><strong>Tên cây trồng:</strong> {scheduleDetail.cropView.cropName ?? `#${scheduleDetail.cropView.cropId}`}</div>
                                        <div><strong>Số lượng:</strong> {scheduleDetail.quantity}</div>
                                        {scheduleDetail.cropView.origin && (
                                            <div><strong>Nguồn gốc:</strong> {scheduleDetail.cropView.origin}</div>
                                        )}
                                        {/* TODO: Replace with API data */}
                                        <div><strong>Giai đoạn cây:</strong> {scheduleDetail.cropView.plantStage ? translatePlantStage(scheduleDetail.cropView.plantStage) : 'Giai đoạn nảy mầm'}</div>
                                        {/* TODO: Replace with API data */}
                                        <div><strong>Độ ẩm đất yêu cầu:</strong> 70% - 80%</div>
                                        {/* TODO: Replace with API data */}
                                        <div><strong>Nhiệt độ yêu cầu:</strong> 25°C - 30°C</div>
                                        {/* TODO: Replace with API data */}
                                        <div><strong>Phân bón:</strong> NPK 20-20-15</div>
                                        {scheduleDetail.cropView.description && (
                                            <div className="col-span-2">
                                                <strong>Mô tả:</strong>
                                                <p className="mt-1 text-sm text-muted-foreground">{scheduleDetail.cropView.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Farm Activity Information */}
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
                                        {scheduleDetail.farmActivityView.status && (
                                            <div>
                                                <strong>Trạng thái:</strong>{' '}
                                                <Badge variant={scheduleDetail.farmActivityView.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                                    {scheduleDetail.farmActivityView.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={showEdit} onOpenChange={handleEditDialogChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa lịch tưới</DialogTitle>
                        <DialogDescription>Cập nhật thông tin lịch tưới.</DialogDescription>
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
                                    disabled={metaLoading || editLoading}
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
                                    disabled={metaLoading || editLoading}
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
                                    value={editForm.staffId != null && editForm.staffId > 0 ? String(editForm.staffId) : ''}
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
                                <Label>Ngày gieo trồng</Label>
                                <Input
                                    type="date"
                                    min={editForm.startDate || todayString}
                                    max={editForm.endDate || undefined}
                                    value={editForm.plantingDate}
                                    onChange={e => setEditForm({ ...editForm, plantingDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Ngày thu hoạch</Label>
                                <Input
                                    type="date"
                                    min={editForm.plantingDate || editForm.startDate || todayString}
                                    max={editForm.endDate || undefined}
                                    value={editForm.harvestDate}
                                    onChange={e => setEditForm({ ...editForm, harvestDate: e.target.value })}
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

            {/* Assign Staff Modal */}
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
        </>
    )
}


