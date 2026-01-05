import React from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Loader2 } from 'lucide-react'
import type { CreateScheduleRequest } from '../types'
import { statusOptions, getDiseaseSelectValue } from '../utils/labels'
import type { ActivityOption } from '../types'

interface EditScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    form: CreateScheduleRequest
    onFormChange: (form: CreateScheduleRequest) => void
    farms: { id: number; name: string }[]
    crops: { id: number; name: string; status?: string }[]
    staffs: { id: number; name: string }[]
    activities: ActivityOption[]
    metaLoading: boolean
    editLoading: boolean
    actionLoading: { [key: string]: boolean }
    todayString: string
    selectedScheduleId?: number
    onSubmit: (form: CreateScheduleRequest) => void
}

export function EditScheduleDialog({
    open,
    onOpenChange,
    form,
    onFormChange,
    farms,
    crops,
    staffs,
    activities,
    metaLoading,
    editLoading,
    actionLoading,
    todayString,
    selectedScheduleId,
    onSubmit,
}: EditScheduleDialogProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa lịch tưới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
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
                                value={form.farmId != null && form.farmId > 0 ? String(form.farmId) : ''}
                                onValueChange={v => onFormChange({ ...form, farmId: Number(v) })}
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
                                value={form.cropId != null && form.cropId > 0 ? String(form.cropId) : ''}
                                onValueChange={v => onFormChange({ ...form, cropId: Number(v) })}
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
                                value={form.staffId != null ? String(form.staffId) : ''}
                                onValueChange={v => onFormChange({ ...form, staffId: Number(v) })}
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
                                value={form.startDate}
                                onChange={e => onFormChange({ ...form, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Ngày kết thúc</Label>
                            <Input
                                type="date"
                                min={form.startDate || todayString}
                                value={form.endDate}
                                onChange={e => onFormChange({ ...form, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Số lượng</Label>
                            <Input
                                type="number"
                                min={1}
                                value={form.quantity}
                                onChange={e => onFormChange({ ...form, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <Label>Trạng thái</Label>
                            <Select
                                value={String(form.status)}
                                onValueChange={v => onFormChange({ ...form, status: Number(v) })}
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
                                value={getDiseaseSelectValue(form.diseaseStatus)}
                                onValueChange={v => {
                                    const numValue = Number(v)
                                    onFormChange({ ...form, diseaseStatus: numValue === -1 ? null : numValue })
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-1">Không có bệnh</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Hoạt động</Label>
                            <Select
                                value={form.farmActivitiesId != null && form.farmActivitiesId > 0 ? String(form.farmActivitiesId) : ''}
                                onValueChange={v => onFormChange({ ...form, farmActivitiesId: Number(v) })}
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
                                checked={form.pesticideUsed}
                                onChange={e => onFormChange({ ...form, pesticideUsed: e.target.checked })}
                            />
                            <Label htmlFor="editPesticide">Sử dụng thuốc BVTV</Label>
                        </div>
                    </fieldset>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={actionLoading[`update-${selectedScheduleId}`]}
                    >
                        {actionLoading[`update-${selectedScheduleId}`] && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Cập nhật
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
