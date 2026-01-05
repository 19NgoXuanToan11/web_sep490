import React from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { activityTypeLabels } from '../utils/labels'

interface CreateActivityDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    form: {
        activityType: string
        startDate: string
        endDate: string
        staffId?: number
    }
    onFormChange: (form: {
        activityType: string
        startDate: string
        endDate: string
        staffId?: number
    }) => void
    staffs: { id: number; name: string }[]
    metaLoading: boolean
    todayString: string
    onSubmit: (form: {
        activityType: string
        startDate: string
        endDate: string
        staffId?: number
    }) => void
}

export function CreateActivityDialog({
    open,
    onOpenChange,
    form,
    onFormChange,
    staffs,
    metaLoading,
    todayString,
    onSubmit,
}: CreateActivityDialogProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tạo hoạt động</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-3">
                        <div>
                            <Label>Loại hoạt động</Label>
                            <Select
                                value={form.activityType}
                                onValueChange={v => onFormChange({ ...form, activityType: v })}
                                disabled={metaLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(activityTypeLabels).map(k => (
                                        <SelectItem key={k} value={k}>{activityTypeLabels[k]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Nhân viên</Label>
                            <Select
                                value={form.staffId ? String(form.staffId) : ''}
                                onValueChange={v => onFormChange({ ...form, staffId: Number(v) })}
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
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button type="submit">Tạo</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
