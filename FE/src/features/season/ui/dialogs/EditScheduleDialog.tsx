import React from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Loader2 } from 'lucide-react'
import type { CreateScheduleRequest } from '../types'
import type { ActivityOption } from '../types'
import { diseaseEnumMap } from '../utils/labels'

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
    staffs: _staffs,
    activities: _activities,
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
    void _staffs
    void _activities

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
                            <Label>Nông trại</Label>
                            <Select
                                value={form.farmId ? String(form.farmId) : ''}
                                onValueChange={v => onFormChange({ ...form, farmId: Number(v) })}
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
                            <Label>Cây trồng</Label>
                            <Select
                                value={form.cropId ? String(form.cropId) : ''}
                                onValueChange={v => onFormChange({ ...form, cropId: Number(v) })}
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
                            <Label>Ngày bắt đầu</Label>
                            <Input
                                type="date"
                                min={todayString}
                                value={form.startDate}
                                onChange={e => onFormChange({ ...form, startDate: e.target.value })}
                            />
                            {form.startDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                    {(() => {
                                        const s = form.startDate
                                        try {
                                            const dt = s.includes('/') ? s.split('/') : s.split('T')[0].split('-').reverse()
                                            if (Array.isArray(dt) && dt.length >= 3) {
                                                if (s.includes('/')) return s
                                                return `${dt[2] ? dt[2] : dt[0]}/${dt[1]}/${dt[0]}`
                                            }
                                        } catch (err) {
                                            return s
                                        }
                                        return s
                                    })()}
                                </div>
                            )}
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
                                value={form.status != null ? String(form.status) : ''}
                                onValueChange={v => onFormChange({ ...form, status: (v as any) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                    <SelectItem value="DEACTIVATED">Vô hiệu hóa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Tình trạng bệnh</Label>
                            <Select
                                value={form.diseaseStatus == null ? '-1' : String(form.diseaseStatus)}
                                onValueChange={v => {
                                    const numValue = Number(v)
                                    onFormChange({ ...form, diseaseStatus: numValue === -1 ? null : numValue })
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tình trạng bệnh" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="-1">Không có bệnh</SelectItem>
                                    {Object.keys(diseaseEnumMap).map(key => (
                                        <SelectItem key={key} value={String((diseaseEnumMap as any)[key])}>
                                            {key}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end gap-2 col-span-2 md:col-span-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.pesticideUsed}
                                    onChange={e => onFormChange({ ...form, pesticideUsed: e.target.checked })}
                                />
                                <span>Đã dùng thuốc BVTV</span>
                            </label>
                            <div className="ml-auto flex gap-2">
                                {metaLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Hủy</Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={actionLoading[`update-${selectedScheduleId}`]}
                                >
                                    {actionLoading[`update-${selectedScheduleId}`] && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Cập nhật
                                </Button>
                            </div>
                        </div>

                        <input type="hidden" value={form.endDate || ''} />
                        <input type="hidden" value={form.staffId ?? ''} />
                        <input type="hidden" value={String(form.status ?? '')} />
                        <input type="hidden" value={String(form.diseaseStatus ?? '')} />
                        <input type="hidden" value={String(form.farmActivitiesId ?? '')} />
                    </fieldset>
                </form>
            </DialogContent>
        </Dialog>
    )
}
