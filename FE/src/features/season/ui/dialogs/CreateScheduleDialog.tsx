import React from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Loader2 } from 'lucide-react'
import type { CreateScheduleRequest } from '../types'

interface CreateScheduleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    form: CreateScheduleRequest
    onFormChange: (form: CreateScheduleRequest) => void
    farms: { id: number; name: string }[]
    crops: { id: number; name: string; status?: string }[]
    metaLoading: boolean
    actionLoading: { [key: string]: boolean }
    todayString: string
    onSubmit: (form: CreateScheduleRequest) => void
}

export function CreateScheduleDialog({
    open,
    onOpenChange,
    form,
    onFormChange,
    farms,
    crops,
    metaLoading,
    actionLoading,
    todayString,
    onSubmit,
}: CreateScheduleDialogProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tạo thời vụ mới</DialogTitle>
                </DialogHeader>
                <form className="grid grid-cols-2 md:grid-cols-3 gap-3" onSubmit={handleSubmit}>
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
                            <Button type="submit" size="sm" disabled={actionLoading.create}>
                                {actionLoading.create && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Tạo
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
