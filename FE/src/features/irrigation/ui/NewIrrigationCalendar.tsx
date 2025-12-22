import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { useToast } from '@/shared/ui/use-toast'
import { scheduleService, type ScheduleListItem, type ScheduleStatusString, type CreateScheduleRequest } from '@/shared/api/scheduleService'
import { IrrigationCalendar, mapSchedulesToCalendarEvents, type CalendarEvent, type SlotInfo } from './IrrigationCalendar'
import { StatusBadge } from './components/StatusBadge'
import { ScheduleDrawer } from './ScheduleDrawer'
import { Loader2 } from 'lucide-react'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'

interface NewIrrigationCalendarProps {
    className?: string
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

const isActiveStatus = (status: number | string | null | undefined) => {
    if (status === null || status === undefined) return false
    if (typeof status === 'string') {
        return status === 'ACTIVE'
    }
    return status === 1
}

export function NewIrrigationCalendar({ className }: NewIrrigationCalendarProps) {
    const { toast } = useToast()
    const [schedules, setSchedules] = useState<ScheduleListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
    const [calendarDate, setCalendarDate] = useState(new Date())
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerMode, setDrawerMode] = useState<'day' | 'event' | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

    const [createForm, setCreateForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)
    const [editForm, setEditForm] = useState<CreateScheduleRequest>(buildEmptyScheduleForm)
    const [editLoading, setEditLoading] = useState(false)
    const [assignStaffId, setAssignStaffId] = useState<number | null>(null)

    const [farms, setFarms] = useState<{ id: number; name: string }[]>([])
    const [crops, setCrops] = useState<{ id: number; name: string }[]>([])
    const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
    const [metaLoading, setMetaLoading] = useState(false)

    const loadSchedules = useCallback(async () => {
        try {
            setLoading(true)
            const res = await scheduleService.getScheduleList(1, 1000)
            setSchedules(res.data.items || [])
        } catch (error) {
            toast({
                title: 'Không thể tải lịch tưới',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadSchedules()
    }, [loadSchedules])

    const loadMetaData = useCallback(async () => {
        setMetaLoading(true)
        try {
            const [farmsRes, cropsRes, staffsRes] = await Promise.all([
                farmService.getAllFarms().catch(() => []),
                cropService.getAllCropsList(1000).catch(() => []),
                accountApi.getAll({ role: 'Staff', pageSize: 1000 }).catch(() => ({ items: [] })),
            ])

            setFarms(Array.isArray(farmsRes) ? farmsRes.map(f => ({ id: f.farmId, name: f.farmName || '' })) : [])
            setCrops(Array.isArray(cropsRes) ? cropsRes.map(c => ({ id: c.cropId, name: c.cropName || '' })) : [])
            setStaffs(Array.isArray(staffsRes.items) ? staffsRes.items.map(s => ({ id: s.accountId, name: s.email || '' })) : [])
        } catch (error) {
            console.error('Error loading meta data:', error)
        } finally {
            setMetaLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMetaData()
    }, [loadMetaData])

    const handleEdit = useCallback((schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        setSelectedSchedule(schedule)
        setEditForm(buildEmptyScheduleForm())
        setShowEditDialog(true)

        setEditLoading(true)
        scheduleService.getScheduleById(schedule.scheduleId)
            .then(res => {
                const detail = res.data
                setEditForm({
                    farmId: detail.farmId ?? 0,
                    cropId: detail.cropId ?? 0,
                    staffId: detail.staffId ?? 0,
                    startDate: detail.startDate || '',
                    endDate: detail.endDate || '',
                    plantingDate: detail.plantingDate ?? '',
                    harvestDate: detail.harvestDate ?? '',
                    quantity: detail.quantity || 0,
                    status: typeof detail.status === 'number' ? detail.status : (detail.status === 'ACTIVE' ? 1 : 0),
                    pesticideUsed: detail.pesticideUsed || false,
                    diseaseStatus: detail.diseaseStatus ?? null,
                    farmActivitiesId: detail.farmActivitiesId ?? 0,
                })
            })
            .catch(e => {
                toast({
                    title: 'Không thể tải thông tin lịch',
                    description: (e as Error).message,
                    variant: 'destructive',
                })
                setShowEditDialog(false)
            })
            .finally(() => {
                setEditLoading(false)
            })
    }, [toast])

    const handleUpdateSchedule = useCallback(async (ev: React.FormEvent) => {
        ev.preventDefault()
        if (!selectedSchedule?.scheduleId) return

        setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: true })
        try {
            await scheduleService.updateSchedule(selectedSchedule.scheduleId, editForm)
            toast({ title: 'Cập nhật lịch thành công', variant: 'success' })
            setShowEditDialog(false)
            await loadSchedules()
        } catch (e) {
            toast({
                title: 'Cập nhật lịch thất bại',
                description: (e as Error).message,
                variant: 'destructive'
            })
        } finally {
            setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: false })
        }
    }, [selectedSchedule, editForm, toast, loadSchedules])

    const handleAssignStaff = useCallback((schedule: ScheduleListItem) => {
        setSelectedSchedule(schedule)
        setAssignStaffId(schedule.staffId || null)
        setShowAssignStaffDialog(true)
    }, [])

    const handleAssignStaffSubmit = useCallback(async () => {
        if (!selectedSchedule?.scheduleId || !assignStaffId) return

        setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: true })
        try {
            await scheduleService.assignStaff(selectedSchedule.scheduleId, assignStaffId)
            toast({ title: 'Phân công nhân viên thành công', variant: 'success' })
            setShowAssignStaffDialog(false)
            await loadSchedules()
        } catch (e) {
            toast({
                title: 'Phân công nhân viên thất bại',
                description: (e as Error).message,
                variant: 'destructive'
            })
        } finally {
            setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: false })
        }
    }, [selectedSchedule, assignStaffId, toast, loadSchedules])

    const handleToggleStatus = useCallback(async (schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return

        const nextStatus: ScheduleStatusString = isActiveStatus(schedule.status) ? 'DEACTIVATED' : 'ACTIVE'
        setActionLoading({ [`status-${schedule.scheduleId}`]: true })
        try {
            await scheduleService.updateScheduleStatus(schedule.scheduleId, nextStatus)
            toast({ title: 'Cập nhật trạng thái lịch thành công', variant: 'success' })
            await loadSchedules()
        } catch (e) {
            toast({
                title: 'Cập nhật trạng thái lịch thất bại',
                description: (e as Error).message,
                variant: 'destructive'
            })
        } finally {
            setActionLoading({ [`status-${schedule.scheduleId}`]: false })
        }
    }, [toast, loadSchedules])

    const handleCreateSchedule = useCallback(async (ev: React.FormEvent) => {
        ev.preventDefault()

        if (!createForm.farmId || !createForm.cropId || !createForm.staffId || !createForm.startDate || !createForm.endDate || !createForm.quantity) {
            toast({
                title: 'Dữ liệu không hợp lệ',
                description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                variant: 'destructive',
            })
            return
        }

        setActionLoading({ create: true })
        try {
            await scheduleService.createSchedule(createForm)
            toast({ title: 'Tạo lịch tưới thành công', variant: 'success' })
            setShowCreateDialog(false)
            setCreateForm(buildEmptyScheduleForm())
            await loadSchedules()
        } catch (e) {
            toast({
                title: 'Tạo lịch tưới thất bại',
                description: (e as Error).message,
                variant: 'destructive'
            })
        } finally {
            setActionLoading({ create: false })
        }
    }, [createForm, toast, loadSchedules])

    const filteredSchedules = useMemo(() => {
        let filtered = schedules

        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => {
                const isActive = typeof s.status === 'number' ? s.status === 1 : s.status === 'ACTIVE'
                return statusFilter === 'active' ? isActive : !isActive
            })
        }

        if (searchTerm.trim()) {
            const normalizedSearch = searchTerm.trim().toLowerCase()
            filtered = filtered.filter(s => {
                const cropName = s.cropView?.cropName || ''
                const farmName = s.farmView?.farmName || ''
                return cropName.toLowerCase().includes(normalizedSearch) ||
                    farmName.toLowerCase().includes(normalizedSearch)
            })
        }

        return filtered
    }, [schedules, statusFilter, searchTerm])

    const getScheduleLabel = useCallback((schedule: ScheduleListItem): string => {
        return schedule.cropView?.cropName || `Lịch #${schedule.scheduleId || 'N/A'}`
    }, [])

    const getStatusBadge = useCallback((status: number | string, isActive?: boolean) => {
        return <StatusBadge status={status} isActive={isActive} size="sm" />
    }, [])

    const calendarEvents = useMemo(() => {
        return mapSchedulesToCalendarEvents(filteredSchedules, getScheduleLabel)
    }, [filteredSchedules, getScheduleLabel])

    const daySchedules = useMemo(() => {
        if (!selectedDate) return []
        const selectedDateStr = selectedDate.toISOString().split('T')[0]
        return calendarEvents.filter(event => {
            const eventStart = event.start.toISOString().split('T')[0]
            const eventEnd = event.end.toISOString().split('T')[0]
            return selectedDateStr >= eventStart && selectedDateStr <= eventEnd
        })
    }, [selectedDate, calendarEvents])

    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedEvent(event)
        setDrawerMode('event')
        setDrawerOpen(true)
    }, [])

    const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
        if (slotInfo.action === 'click') {
            setSelectedDate(slotInfo.start)
            setDrawerMode('day')
            setDrawerOpen(true)
        } else if (slotInfo.action === 'select') {
            console.log('Date range selected:', slotInfo.start, slotInfo.end)
        }
    }, [])

    const handleViewChange = useCallback((view: any) => {
        setViewMode(view as 'month' | 'week' | 'day' | 'agenda')
    }, [])

    const handleNavigate = useCallback((date: Date) => {
        setCalendarDate(date)
    }, [])

    const handleShowMore = useCallback((date: Date) => {
        setSelectedDate(date)
        setDrawerMode('day')
        setDrawerOpen(true)
    }, [])

    return (
        <div className={className}>
            <div className="space-y-6">
                {/* Unified Command Toolbar */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        {/* Search */}
                        <div className="flex-1 w-full lg:w-auto min-w-0">
                            <Input
                                id="search"
                                placeholder="Tìm kiếm lịch tưới, cây trồng, nông trại..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-9"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 flex-1 lg:flex-initial">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 w-full sm:w-[160px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-2 w-full lg:w-auto">
                            <div className="flex border rounded-md p-1 bg-slate-50">
                                <Button
                                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('month')}
                                    className="h-7 px-3"
                                >
                                    Tháng
                                </Button>
                                <Button
                                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('week')}
                                    className="h-7 px-3"
                                >
                                    Tuần
                                </Button>
                                <Button
                                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('day')}
                                    className="h-7 px-3"
                                >
                                    Ngày
                                </Button>
                                <Button
                                    variant={viewMode === 'agenda' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('agenda')}
                                    className="h-7 px-3"
                                >
                                    Danh sách
                                </Button>
                            </div>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                variant="default"
                                size="sm"
                                className="h-9 bg-green-600 hover:bg-green-700"
                            >
                                Tạo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Calendar */}
                {loading ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-8">
                            <div className="text-center text-slate-500">Đang tải...</div>
                        </CardContent>
                    </Card>
                ) : filteredSchedules.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-12">
                            <div className="text-center space-y-3">
                                <p className="text-lg font-semibold text-slate-900">
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'Không tìm thấy lịch tưới nào'
                                        : 'Chưa có lịch tưới'}
                                </p>
                                <p className="text-sm text-slate-600 max-w-md mx-auto">
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'Không có lịch tưới nào phù hợp với điều kiện lọc hiện tại.'
                                        : 'Hãy tạo lịch tưới đầu tiên để bắt đầu quản lý.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <IrrigationCalendar
                        events={calendarEvents}
                        view={viewMode}
                        date={calendarDate}
                        onViewChange={handleViewChange}
                        onNavigate={handleNavigate}
                        onSelectEvent={handleSelectEvent}
                        onSelectSlot={handleSelectSlot}
                        getScheduleLabel={getScheduleLabel}
                        getStatusBadge={getStatusBadge}
                        onShowMore={handleShowMore}
                    />
                )}

                {/* Schedule Drawer */}
                <ScheduleDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    mode={drawerMode}
                    selectedDate={selectedDate}
                    selectedEvent={selectedEvent}
                    daySchedules={daySchedules}
                    loading={false}
                    getScheduleLabel={getScheduleLabel}
                    getStatusBadge={getStatusBadge}
                    onEdit={handleEdit}
                    onAssignStaff={handleAssignStaff}
                    onToggleStatus={handleToggleStatus}
                />

                {/* Create Dialog */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tạo lịch tưới mới</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateSchedule}>
                            <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                    <Label>Nông trại *</Label>
                                    <Select
                                        value={createForm.farmId > 0 ? String(createForm.farmId) : ''}
                                        onValueChange={v => setCreateForm({ ...createForm, farmId: Number(v) })}
                                        disabled={metaLoading}
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
                                    <Label>Cây trồng *</Label>
                                    <Select
                                        value={createForm.cropId > 0 ? String(createForm.cropId) : ''}
                                        onValueChange={v => setCreateForm({ ...createForm, cropId: Number(v) })}
                                        disabled={metaLoading}
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
                                    <Label>Nhân viên *</Label>
                                    <Select
                                        value={createForm.staffId > 0 ? String(createForm.staffId) : ''}
                                        onValueChange={v => setCreateForm({ ...createForm, staffId: Number(v) })}
                                        disabled={metaLoading}
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
                                    <Label>Ngày bắt đầu *</Label>
                                    <Input
                                        type="date"
                                        value={createForm.startDate}
                                        onChange={e => setCreateForm({ ...createForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Ngày kết thúc *</Label>
                                    <Input
                                        type="date"
                                        min={createForm.startDate}
                                        value={createForm.endDate}
                                        onChange={e => setCreateForm({ ...createForm, endDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Số lượng *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={createForm.quantity}
                                        onChange={e => setCreateForm({ ...createForm, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label>Trạng thái</Label>
                                    <Select
                                        value={String(createForm.status)}
                                        onValueChange={v => setCreateForm({ ...createForm, status: Number(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Vô hiệu hóa</SelectItem>
                                            <SelectItem value="1">Hoạt động</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="createPesticide"
                                        checked={createForm.pesticideUsed}
                                        onChange={e => setCreateForm({ ...createForm, pesticideUsed: e.target.checked })}
                                    />
                                    <Label htmlFor="createPesticide">Sử dụng thuốc BVTV</Label>
                                </div>
                            </fieldset>
                        </form>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => {
                                setShowCreateDialog(false)
                                setCreateForm(buildEmptyScheduleForm())
                            }}>
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleCreateSchedule}
                                disabled={actionLoading.create}
                            >
                                {actionLoading.create && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Tạo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                    <Label>Nông trại</Label>
                                    <Select
                                        value={editForm.farmId > 0 ? String(editForm.farmId) : ''}
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
                                    <Label>Cây trồng</Label>
                                    <Select
                                        value={editForm.cropId > 0 ? String(editForm.cropId) : ''}
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
                                    <Label>Nhân viên</Label>
                                    <Select
                                        value={editForm.staffId > 0 ? String(editForm.staffId) : ''}
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
                                        value={editForm.startDate}
                                        onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Ngày kết thúc</Label>
                                    <Input
                                        type="date"
                                        min={editForm.startDate}
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
                                            <SelectItem value="0">Vô hiệu hóa</SelectItem>
                                            <SelectItem value="1">Hoạt động</SelectItem>
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
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
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

                {/* Assign Staff Dialog */}
                <Dialog open={showAssignStaffDialog} onOpenChange={setShowAssignStaffDialog}>
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
                            <Button type="button" variant="outline" onClick={() => setShowAssignStaffDialog(false)}>
                                Hủy
                            </Button>
                            <Button
                                onClick={handleAssignStaffSubmit}
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
            </div>
        </div>
    )
}

