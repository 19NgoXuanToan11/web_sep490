import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { scheduleService, type PaginatedSchedules, type CreateScheduleRequest, type ScheduleDetail, type ScheduleListItem } from '@/shared/api/scheduleService'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { Loader2, Eye, Edit, UserPlus, ToggleLeft, ToggleRight, Filter } from 'lucide-react'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'
import { farmActivityService } from '@/shared/api/farmActivityService'
import { handleFetchError, handleCreateError, handleApiSuccess } from '@/shared/lib/error-handler'

interface BackendScheduleListProps {
    showCreate?: boolean
    onShowCreateChange?: (v: boolean) => void
}

export function BackendScheduleList({ showCreate: externalShowCreate, onShowCreateChange }: BackendScheduleListProps) {
    const { toast } = useToast()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize] = useState(10)
    const [data, setData] = useState<PaginatedSchedules | null>(null)
    const [loading, setLoading] = useState(false)
    const [internalShowCreate, setInternalShowCreate] = useState(false)

    const showCreate = externalShowCreate ?? internalShowCreate
    const setShowCreate = onShowCreateChange ?? setInternalShowCreate
    const [form, setForm] = useState<CreateScheduleRequest>({
        farmId: 0,
        cropId: 0,
        staffId: 0,
        startDate: '',
        endDate: '',
        quantity: 0,
        status: 0,
        pesticideUsed: false,
        diseaseStatus: 0,
        farmActivitiesId: 0,
    })

    // metadata for selects
    const [farms, setFarms] = useState<{ id: number; name: string }[]>([])
    const [crops, setCrops] = useState<{ id: number; name: string }[]>([])
    const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
    const [activities, setActivities] = useState<{ id: number; name: string }[]>([])
    const [metaLoading, setMetaLoading] = useState(false)

    // New state for additional functionality
    const [showDetail, setShowDetail] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [showAssignStaff, setShowAssignStaff] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
    const [scheduleDetail, setScheduleDetail] = useState<ScheduleDetail | null>(null)
    const [editForm, setEditForm] = useState<CreateScheduleRequest>({
        farmId: 0,
        cropId: 0,
        staffId: 0,
        startDate: '',
        endDate: '',
        quantity: 0,
        status: 0,
        pesticideUsed: false,
        diseaseStatus: 0,
        farmActivitiesId: 0,
    })
    const [assignStaffId, setAssignStaffId] = useState<number>(0)
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
    const [staffFilter, setStaffFilter] = useState<number | null>(null)
    const [showStaffFilter, setShowStaffFilter] = useState(false)

    const translateActivityType = useCallback((type: string) => {
        switch (type) {
            case 'Sowing':
                return 'Gieo trồng'
            case 'Irrigation':
                return 'Tưới tiêu'
            case 'Harvesting':
                return 'Thu hoạch'
            case 'Fertilization':
                return 'Bón phân'
            case 'Protection':
                return 'Bảo vệ thực vật'
            default:
                return type
        }
    }, [])

    // local enum options mapping to backend numeric enums
    const statusOptions = useMemo(
        () => [
            { value: 0, label: 'Vô hiệu hóa' }, // DEACTIVATED
            { value: 1, label: 'Hoạt động' },   // ACTIVE
        ],
        []
    )
    const diseaseOptions = useMemo(
        () => [
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
        ],
        []
    )

    const getStatusLabel = useCallback(
        (value: number | string | null | undefined) => {
            if (value === null || value === undefined) return '-'
            if (typeof value === 'string') {
                // Handle string status values
                switch (value) {
                    case 'ACTIVE': return 'Hoạt động'
                    case 'DEACTIVATED': return 'Vô hiệu hóa'
                    default: return value
                }
            }
            return statusOptions.find(o => o.value === value)?.label ?? String(value)
        },
        [statusOptions]
    )

    const getDiseaseLabel = useCallback(
        (value: number | null | undefined) => {
            if (value === null || value === undefined) return '-'
            return diseaseOptions.find(o => o.value === value)?.label ?? String(value)
        },
        [diseaseOptions]
    )

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await scheduleService.getScheduleList(pageIndex, pageSize)
            setData(res)
        } catch (e) {
            handleFetchError(e, toast, 'lịch tưới')
        } finally {
            setLoading(false)
        }
    }, [pageIndex, pageSize, toast])

    useEffect(() => {
        load()
    }, [load])

    // load metadata when opening create dialog
    useEffect(() => {
        if (!showCreate) return
        let mounted = true
            ; (async () => {
                try {
                    setMetaLoading(true)
                    const [farmRes, cropRes, staffRes] = await Promise.all([
                        farmService.getAllFarms(),
                        cropService.getAllCropsActive(),
                        accountApi.getAll({ role: 'Staff', pageSize: 1000 }),
                    ])
                    if (!mounted) return
                    setFarms(farmRes.map(f => ({ id: f.farmId, name: f.farmName })))
                    setCrops(cropRes.map(c => ({ id: c.cropId, name: c.cropName })))
                    setStaffs(staffRes.items.map(s => ({ id: s.accountId, name: s.email })))

                    // load farm activities
                    const fa = await farmActivityService.getAllFarmActivities()
                    if (!mounted) return
                    setActivities(
                        fa.map(a => ({
                            id: a.farmActivitiesId,
                            name: `#${a.farmActivitiesId} • ${translateActivityType(a.activityType)}`,
                        }))
                    )
                } catch (e) {
                    handleFetchError(e, toast, 'danh sách tham chiếu')
                } finally {
                    if (mounted) setMetaLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [showCreate, toast])

    // load metadata when opening edit dialog
    useEffect(() => {
        if (!showEdit && !showAssignStaff) return
        let mounted = true
            ; (async () => {
                try {
                    setMetaLoading(true)
                    const [farmRes, cropRes, staffRes] = await Promise.all([
                        farmService.getAllFarms(),
                        cropService.getAllCropsActive(),
                        accountApi.getAll({ role: 'Staff', pageSize: 1000 }),
                    ])
                    if (!mounted) return
                    setFarms(farmRes.map(f => ({ id: f.farmId, name: f.farmName })))
                    setCrops(cropRes.map(c => ({ id: c.cropId, name: c.cropName })))
                    setStaffs(staffRes.items.map(s => ({ id: s.accountId, name: s.email })))

                    // load farm activities
                    const fa = await farmActivityService.getAllFarmActivities()
                    if (!mounted) return
                    setActivities(
                        fa.map(a => ({
                            id: a.farmActivitiesId,
                            name: `#${a.farmActivitiesId} • ${translateActivityType(a.activityType)}`,
                        }))
                    )
                } catch (e) {
                    toast({
                        title: 'Không thể tải danh sách tham chiếu',
                        description: (e as Error).message,
                        variant: 'destructive',
                    })
                } finally {
                    if (mounted) setMetaLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [showEdit, showAssignStaff, toast, translateActivityType])

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        try {
            await scheduleService.createSchedule(form)
            handleApiSuccess('Tạo lịch thành công', toast)
            setShowCreate(false)
            await load()
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

    const handleEdit = async (schedule: ScheduleListItem) => {
        if (!schedule.scheduleId) return
        setActionLoading({ [`edit-${schedule.scheduleId}`]: true })
        try {
            const res = await scheduleService.getScheduleById(schedule.scheduleId)
            const detail = res.data
            setEditForm({
                farmId: detail.farmId || 0,
                cropId: detail.cropId || 0,
                staffId: detail.staffId || 0,
                startDate: detail.startDate,
                endDate: detail.endDate,
                quantity: detail.quantity,
                status: typeof detail.status === 'number' ? detail.status : 0,
                pesticideUsed: detail.pesticideUsed,
                diseaseStatus: detail.diseaseStatus || 0,
                farmActivitiesId: detail.farmActivitiesId || 0,
            })
            setSelectedSchedule(schedule)
            setShowEdit(true)
        } catch (e) {
            toast({ title: 'Không thể tải thông tin lịch', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`edit-${schedule.scheduleId}`]: false })
        }
    }

    const handleUpdateSchedule = async (ev: React.FormEvent) => {
        ev.preventDefault()
        if (!selectedSchedule?.scheduleId) return
        setActionLoading({ [`update-${selectedSchedule.scheduleId}`]: true })
        try {
            await scheduleService.updateSchedule(selectedSchedule.scheduleId, editForm)
            toast({ title: 'Cập nhật lịch thành công', variant: 'success' })
            setShowEdit(false)
            await load()
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
            setShowAssignStaff(false)
            setAssignStaffId(0)
            await load()
        } catch (e) {
            toast({ title: 'Phân công nhân viên thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setActionLoading({ [`assign-${selectedSchedule.scheduleId}`]: false })
        }
    }

    const handleStaffFilter = async () => {
        if (!staffFilter) return
        setLoading(true)
        try {
            const res = await scheduleService.getSchedulesByStaff(staffFilter)
            setData({
                status: res.status,
                message: res.message,
                data: {
                    totalItemCount: res.data.length,
                    pageSize: res.data.length,
                    totalPagesCount: 1,
                    pageIndex: 1,
                    next: false,
                    previous: false,
                    items: res.data
                }
            })
        } catch (e) {
            toast({ title: 'Lọc theo nhân viên thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            { /* Header kept minimal; create button now lives in page header */}
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStaffFilter(!showStaffFilter)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Lọc theo nhân viên
                    </Button>
                    {staffFilter && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setStaffFilter(null)
                                load()
                            }}
                        >
                            Xóa bộ lọc
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showStaffFilter && (
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                        <Select
                            value={staffFilter ? String(staffFilter) : ''}
                            onValueChange={v => setStaffFilter(Number(v))}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Chọn nhân viên" />
                            </SelectTrigger>
                            <SelectContent>
                                {staffs.map(s => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleStaffFilter} disabled={!staffFilter || loading}>
                            Áp dụng
                        </Button>
                    </div>
                )}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tạo lịch tưới mới</DialogTitle>
                            <DialogDescription>Nhập thông tin lịch tưới rồi bấm Tạo.</DialogDescription>
                        </DialogHeader>
                        <form className="grid grid-cols-2 md:grid-cols-3 gap-3" onSubmit={submit}>
                            <div>
                                <Label>Farm</Label>
                                <Select
                                    value={form.farmId ? String(form.farmId) : ''}
                                    onValueChange={v => setForm({ ...form, farmId: Number(v) })}
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
                                <Label>Crop</Label>
                                <Select
                                    value={form.cropId ? String(form.cropId) : ''}
                                    onValueChange={v => setForm({ ...form, cropId: Number(v) })}
                                    disabled={metaLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={metaLoading ? 'Đang tải...' : 'Chọn mùa vụ'} />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                <Label>Ngày bắt đầu</Label>
                                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                            </div>
                            <div>
                                <Label>Ngày kết thúc</Label>
                                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                            </div>
                            <div>
                                <Label>Số lượng</Label>
                                <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <Label>Trạng thái</Label>
                                <Select
                                    value={String(form.status)}
                                    onValueChange={v => setForm({ ...form, status: Number(v) })}
                                    disabled={metaLoading}
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
                                    value={String(form.diseaseStatus)}
                                    onValueChange={v => setForm({ ...form, diseaseStatus: Number(v) })}
                                    disabled={metaLoading}
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
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Hủy</Button>
                                    <Button type="submit" size="sm" disabled={metaLoading}>Tạo</Button>
                                </div>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-3">Ngày bắt đầu</th>
                                <th className="py-2 pr-3">Ngày kết thúc</th>
                                <th className="py-2 pr-3">Số lượng</th>
                                <th className="py-2 pr-3">Trạng thái</th>
                                <th className="py-2 pr-3">Thuốc BVTV</th>
                                <th className="py-2 pr-3">Ngày gieo trồng</th>
                                <th className="py-2 pr-3">Ngày thu hoạch</th>
                                <th className="py-2 pr-3">Tình trạng bệnh</th>
                                <th className="py-2 pr-3">Tạo lúc</th>
                                <th className="py-2 pr-3">Cập nhật lúc</th>
                                <th className="py-2 pr-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data.items.map((it, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                    <td className="py-2 pr-3">{it.startDate}</td>
                                    <td className="py-2 pr-3">{it.endDate}</td>
                                    <td className="py-2 pr-3">{it.quantity}</td>
                                    <td className="py-2 pr-3">
                                        <Badge variant={typeof it.status === 'number' && it.status === 1 ? 'success' : 'secondary'}>
                                            {getStatusLabel(it.status)}
                                        </Badge>
                                    </td>
                                    <td className="py-2 pr-3">{it.pesticideUsed ? 'Có' : 'Không'}</td>
                                    <td className="py-2 pr-3">{it.plantingDate ?? '-'}</td>
                                    <td className="py-2 pr-3">{it.harvestDate ?? '-'}</td>
                                    <td className="py-2 pr-3">{getDiseaseLabel(it.diseaseStatus)}</td>
                                    <td className="py-2 pr-3">{it.createdAt}</td>
                                    <td className="py-2 pr-3">{it.updatedAt ?? '-'}</td>
                                    <td className="py-2 pr-3">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleViewDetail(it)}
                                                disabled={actionLoading[`detail-${it.scheduleId}`]}
                                            >
                                                {actionLoading[`detail-${it.scheduleId}`] ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Eye className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(it)}
                                                disabled={actionLoading[`edit-${it.scheduleId}`]}
                                            >
                                                {actionLoading[`edit-${it.scheduleId}`] ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Edit className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedSchedule(it)
                                                    setShowAssignStaff(true)
                                                }}
                                            >
                                                <UserPlus className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleStatus(it)}
                                                disabled={actionLoading[`status-${it.scheduleId}`]}
                                            >
                                                {actionLoading[`status-${it.scheduleId}`] ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : typeof it.status === 'number' && it.status === 1 ? (
                                                    <ToggleRight className="h-3 w-3 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="h-3 w-3 text-gray-400" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data && data.data.items.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="py-6 text-center text-muted-foreground">
                                        Chưa có dữ liệu
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Tổng: {data?.data.totalItemCount ?? 0} • Trang {data?.data.pageIndex ?? pageIndex + 1}/{data?.data.totalPagesCount ?? 1}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={loading || !(data?.data.previous)}
                            onClick={() => setPageIndex(p => Math.max(1, p - 1))}
                        >
                            Trước
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={loading || !(data?.data.next)}
                            onClick={() => setPageIndex(p => p + 1)}
                        >
                            Sau
                        </Button>
                    </div>
                </div>

                {/* Detail View Modal */}
                <Dialog open={showDetail} onOpenChange={setShowDetail}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Chi tiết lịch tưới</DialogTitle>
                            <DialogDescription>Thông tin chi tiết về lịch tưới được chọn.</DialogDescription>
                        </DialogHeader>
                        {scheduleDetail && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><strong>ID:</strong> {scheduleDetail.scheduleId}</div>
                                <div><strong>Farm:</strong> {scheduleDetail.farmView?.farmName || scheduleDetail.farmId}</div>
                                <div><strong>Crop:</strong> {scheduleDetail.cropView?.cropName || scheduleDetail.cropId}</div>
                                <div><strong>Staff:</strong> {scheduleDetail.staff?.email || scheduleDetail.staffId}</div>
                                <div><strong>Ngày bắt đầu:</strong> {scheduleDetail.startDate}</div>
                                <div><strong>Ngày kết thúc:</strong> {scheduleDetail.endDate}</div>
                                <div><strong>Số lượng:</strong> {scheduleDetail.quantity}</div>
                                <div><strong>Trạng thái:</strong> {getStatusLabel(scheduleDetail.status)}</div>
                                <div><strong>Thuốc BVTV:</strong> {scheduleDetail.pesticideUsed ? 'Có' : 'Không'}</div>
                                <div><strong>Tình trạng bệnh:</strong> {getDiseaseLabel(scheduleDetail.diseaseStatus)}</div>
                                <div><strong>Hoạt động:</strong> {scheduleDetail.farmActivityView?.activityType || scheduleDetail.farmActivitiesId}</div>
                                <div><strong>Tạo lúc:</strong> {scheduleDetail.createdAt}</div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={showEdit} onOpenChange={setShowEdit}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa lịch tưới</DialogTitle>
                            <DialogDescription>Cập nhật thông tin lịch tưới.</DialogDescription>
                        </DialogHeader>
                        <form className="grid grid-cols-2 md:grid-cols-3 gap-3" onSubmit={handleUpdateSchedule}>
                            <div>
                                <Label>Farm</Label>
                                <Select
                                    value={editForm.farmId ? String(editForm.farmId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, farmId: Number(v) })}
                                    disabled={metaLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn nông trại" />
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
                                    value={editForm.cropId ? String(editForm.cropId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, cropId: Number(v) })}
                                    disabled={metaLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn cây trồng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {crops.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Staff</Label>
                                <Select
                                    value={editForm.staffId ? String(editForm.staffId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, staffId: Number(v) })}
                                    disabled={metaLoading}
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
                                    value={editForm.endDate}
                                    onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Số lượng</Label>
                                <Input
                                    type="number"
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
                                    value={String(editForm.diseaseStatus)}
                                    onValueChange={v => setEditForm({ ...editForm, diseaseStatus: Number(v) })}
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
                                    value={editForm.farmActivitiesId ? String(editForm.farmActivitiesId) : ''}
                                    onValueChange={v => setEditForm({ ...editForm, farmActivitiesId: Number(v) })}
                                    disabled={metaLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn hoạt động" />
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
                        </form>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
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
                <Dialog open={showAssignStaff} onOpenChange={setShowAssignStaff}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Phân công nhân viên</DialogTitle>
                            <DialogDescription>Chọn nhân viên để phân công cho lịch tưới này.</DialogDescription>
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
                            <Button type="button" variant="outline" onClick={() => setShowAssignStaff(false)}>
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
            </CardContent>
        </Card>
    )
}


