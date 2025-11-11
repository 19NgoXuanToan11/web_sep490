import React from 'react'
import { scheduleService, type PaginatedSchedules, type CreateScheduleRequest } from '@/shared/api/scheduleService'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useToast } from '@/shared/ui/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Loader2 } from 'lucide-react'
import { farmService } from '@/shared/api/farmService'
import { cropService } from '@/shared/api/cropService'
import { accountApi } from '@/shared/api/auth'
import { farmActivityService } from '@/shared/api/farmActivityService'

interface BackendScheduleListProps {
    showCreate?: boolean
    onShowCreateChange?: (v: boolean) => void
}

export function BackendScheduleList({ showCreate: externalShowCreate, onShowCreateChange }: BackendScheduleListProps) {
    const { toast } = useToast()
    const [pageIndex, setPageIndex] = React.useState(1)
    const [pageSize] = React.useState(10)
    const [data, setData] = React.useState<PaginatedSchedules | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [internalShowCreate, setInternalShowCreate] = React.useState(false)

    const showCreate = externalShowCreate ?? internalShowCreate
    const setShowCreate = onShowCreateChange ?? setInternalShowCreate
    const [form, setForm] = React.useState<CreateScheduleRequest>({
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
    const [farms, setFarms] = React.useState<{ id: number; name: string }[]>([])
    const [crops, setCrops] = React.useState<{ id: number; name: string }[]>([])
    const [staffs, setStaffs] = React.useState<{ id: number; name: string }[]>([])
    const [activities, setActivities] = React.useState<{ id: number; name: string }[]>([])
    const [metaLoading, setMetaLoading] = React.useState(false)

    const translateActivityType = React.useCallback((type: string) => {
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
    const statusOptions = React.useMemo(
        () => [
            { value: 0, label: 'Vô hiệu hóa' }, // DEACTIVATED
            { value: 1, label: 'Hoạt động' },   // ACTIVE
        ],
        []
    )
    const diseaseOptions = React.useMemo(
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

    const getStatusLabel = React.useCallback(
        (value: number | null | undefined) => {
            if (value === null || value === undefined) return '-'
            return statusOptions.find(o => o.value === value)?.label ?? String(value)
        },
        [statusOptions]
    )

    const getDiseaseLabel = React.useCallback(
        (value: number | null | undefined) => {
            if (value === null || value === undefined) return '-'
            return diseaseOptions.find(o => o.value === value)?.label ?? String(value)
        },
        [diseaseOptions]
    )

    const load = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await scheduleService.getScheduleList(pageIndex, pageSize)
            setData(res)
        } catch (e) {
            toast({ title: 'Tải lịch thất bại', description: (e as Error).message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [pageIndex, pageSize, toast])

    React.useEffect(() => {
        load()
    }, [load])

    // load metadata when opening create dialog
    React.useEffect(() => {
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
    }, [showCreate, toast])

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        try {
            await scheduleService.createSchedule(form)
            toast({ title: 'Tạo lịch thành công', variant: 'success' })
            setShowCreate(false)
            await load()
        } catch (e) {
            toast({ title: 'Tạo lịch thất bại', description: (e as Error).message, variant: 'destructive' })
        }
    }

    return (
        <Card>
            { /* Header kept minimal; create button now lives in page header */}
            <CardHeader className="flex flex-row items-center justify-between" />
            <CardContent className="space-y-4">
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
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data.items.map((it, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                    <td className="py-2 pr-3">{it.startDate}</td>
                                    <td className="py-2 pr-3">{it.endDate}</td>
                                    <td className="py-2 pr-3">{it.quantity}</td>
                                    <td className="py-2 pr-3">{getStatusLabel(it.status)}</td>
                                    <td className="py-2 pr-3">{it.pesticideUsed ? 'Có' : 'Không'}</td>
                                    <td className="py-2 pr-3">{it.plantingDate ?? '-'}</td>
                                    <td className="py-2 pr-3">{it.harvestDate ?? '-'}</td>
                                    <td className="py-2 pr-3">{getDiseaseLabel(it.diseaseStatus)}</td>
                                    <td className="py-2 pr-3">{it.createdAt}</td>
                                    <td className="py-2 pr-3">{it.updatedAt ?? '-'}</td>
                                </tr>
                            ))}
                            {!loading && data && data.data.items.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="py-6 text-center text-muted-foreground">
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
            </CardContent>
        </Card>
    )
}


