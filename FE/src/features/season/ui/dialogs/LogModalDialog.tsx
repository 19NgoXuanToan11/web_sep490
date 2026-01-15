import React, { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { toastManager } from '@/shared/lib/toast-manager'
import { scheduleLogService } from '@/shared/api/scheduleLogService'
import { scheduleService } from '@/shared/api/scheduleService'
import type { ScheduleLogItem } from '../types'

const stripSystemPrefixes = (s?: string | null) => {
    if (!s) return ''
    try {
        return String(s).replace(/\[Ghi chú thủ công(?: \(Đã sửa lúc [^\]]+\))?\]\s*/g, '').trim()
    } catch {
        return String(s)
    }
}

interface LogModalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit'
    editingLog: ScheduleLogItem | null
    selectedScheduleId?: number
    selectedFarmActivityId?: number
    onSuccess?: (createdOrUpdated?: any) => void
}

export function LogModalDialog({
    open,
    onOpenChange,
    mode,
    editingLog,
    selectedScheduleId,
    selectedFarmActivityId,
    onSuccess,
}: LogModalDialogProps) {
    const [notes, setNotes] = useState('')

    React.useEffect(() => {
        if (open && editingLog) {
            setNotes(stripSystemPrefixes(editingLog.notes || ''))
        } else if (open && mode === 'create') {
            setNotes('')
        }
    }, [open, editingLog, mode])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedNotes = notes.trim()
        if (!trimmedNotes) {
            toastManager.error('Vui lòng nhập nội dung ghi nhận')
            return
        }

        try {
            if (mode === 'create' && selectedScheduleId) {
                let farmActivityId = selectedFarmActivityId
                if ((farmActivityId === undefined || farmActivityId === null) && selectedScheduleId) {
                    try {
                        const schedRes: any = await scheduleService.getScheduleById(selectedScheduleId)
                        const sched = schedRes?.data ?? {}
                        farmActivityId =
                            sched?.farmActivityView?.farmActivitiesId ??
                            (Array.isArray((sched as any)?.farmActivities) ? (sched as any).farmActivities[0]?.farmActivitiesId : undefined) ??
                            sched?.farmActivitiesId ??
                            sched?.farmActivityId
                    } catch {
                        farmActivityId = undefined
                    }
                }
                try {
                    console.debug('[LogModalDialog] creating log, selectedScheduleId:', selectedScheduleId, 'selectedFarmActivityId:', selectedFarmActivityId, 'computedFarmActivityId:', farmActivityId)
                } catch { }

                const res: any = await scheduleLogService.createLog({
                    scheduleId: selectedScheduleId,
                    notes: trimmedNotes,
                    farmActivityId,
                })
                if (res?.status === 1) {
                    if (res?.message) toastManager.success(res.message)
                } else {
                    const msg = res?.message
                    if (msg) throw new Error(msg)
                }
                const createdPayload = res?.data ?? res
                onSuccess?.(createdPayload)
            } else if (mode === 'edit' && editingLog) {
                const res: any = await scheduleLogService.updateLog({
                    id: editingLog.id,
                    notes: trimmedNotes,
                })
                if (res?.status === 1) {
                    if (res?.message) toastManager.success(res.message)
                } else {
                    const msg = res?.message ?? 'Không thể cập nhật nhật ký'
                    throw new Error(msg)
                }
                const updatedPayload = res?.data ?? res
                onSuccess?.(updatedPayload)
            }
            onOpenChange(false)

        } catch (err) {
            const msg = (err as any)?.message
            if (msg) toastManager.error(msg)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Tạo ghi nhận' : 'Chỉnh sửa ghi nhận'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-3">
                        <div>
                            <Label>Nội dung</Label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2 border rounded"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button type="submit">{mode === 'create' ? 'Lưu' : 'Lưu'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
