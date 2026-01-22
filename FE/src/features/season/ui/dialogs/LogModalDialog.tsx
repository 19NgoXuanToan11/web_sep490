import React, { useState, useEffect } from 'react'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { toastManager } from '@/shared/lib/toast-manager'
import { scheduleLogService } from '@/shared/api/scheduleLogService'
import { scheduleService } from '@/shared/api/scheduleService'
import { farmActivityService } from '@/shared/api/farmActivityService'
import type { ScheduleLogItem } from '../types'
import type { FarmActivity } from '@/shared/api/farmActivityService'
import { translateActivityType } from '../utils/labels'

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
    const [availableActivities, setAvailableActivities] = useState<FarmActivity[] | null>(null)
    const [selectedActivityIdLocal, setSelectedActivityIdLocal] = useState<number | null>(selectedFarmActivityId ?? null)

    React.useEffect(() => {
        if (open && editingLog) {
            setNotes(stripSystemPrefixes(editingLog.notes || ''))
        } else if (open && mode === 'create') {
            setNotes('')
            setSelectedActivityIdLocal(selectedFarmActivityId ?? null)
            setAvailableActivities(null)
        }
    }, [open, editingLog, mode])

    useEffect(() => {
        if (!(open && mode === 'create' && selectedScheduleId)) return
        let cancelled = false
            ; (async () => {
                try {
                    const list = await farmActivityService.getFarmActivitiesBySchedule(Number(selectedScheduleId))
                    if (cancelled) return
                    setAvailableActivities(list)
                    if ((selectedActivityIdLocal === null || selectedActivityIdLocal === undefined) && Array.isArray(list) && list.length > 0) {
                        setSelectedActivityIdLocal(list[0]?.farmActivitiesId ?? null)
                    }
                } catch (err) {
                    console.debug('[LogModalDialog] failed to fetch farm activities for schedule', err)
                    if (!cancelled) setAvailableActivities([])
                }
            })()
        return () => { cancelled = true }
    }, [open, mode, selectedScheduleId])

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
                        const faId = await farmActivityService.getFarmActivityBySchedule(Number(selectedScheduleId))
                        if (faId !== undefined && faId !== null) {
                            farmActivityId = faId
                        } else {
                            const schedRes: any = await scheduleService.getScheduleById(selectedScheduleId)
                            const sched = schedRes?.data ?? {}
                            if (Array.isArray(sched?.farmActivityView) && sched.farmActivityView.length > 0) {
                                farmActivityId =
                                    sched.farmActivityView[0]?.farmActivitiesId ??
                                    sched.farmActivityView[0]?.farmActivityId ??
                                    sched.farmActivityView[0]?.id ??
                                    undefined
                            } else {
                                farmActivityId =
                                    sched?.farmActivityView?.farmActivitiesId ??
                                    (Array.isArray((sched as any)?.farmActivities) ? (sched as any).farmActivities[0]?.farmActivitiesId : undefined) ??
                                    sched?.farmActivitiesId ??
                                    sched?.farmActivityId
                            }
                        }
                    } catch {
                        try {
                            const schedRes: any = await scheduleService.getScheduleById(selectedScheduleId)
                            const sched = schedRes?.data ?? {}
                            if (Array.isArray(sched?.farmActivityView) && sched.farmActivityView.length > 0) {
                                farmActivityId =
                                    sched.farmActivityView[0]?.farmActivitiesId ??
                                    sched.farmActivityView[0]?.farmActivityId ??
                                    sched.farmActivityView[0]?.id ??
                                    undefined
                            } else {
                                farmActivityId =
                                    sched?.farmActivityView?.farmActivitiesId ??
                                    (Array.isArray((sched as any)?.farmActivities) ? (sched as any).farmActivities[0]?.farmActivitiesId : undefined) ??
                                    sched?.farmActivitiesId ??
                                    sched?.farmActivityId
                            }
                        } catch {
                            farmActivityId = undefined
                        }
                    }
                }
                try {
                    console.debug(
                        '[LogModalDialog] creating log values',
                        { selectedScheduleId, selectedFarmActivityId, computedFarmActivityId: farmActivityId }
                    )
                    try {
                        const lastFa = await farmActivityService.getFarmActivityBySchedule(Number(selectedScheduleId))
                        console.debug('[LogModalDialog] farmActivityService.getFarmActivityBySchedule returned', lastFa)
                    } catch (dbgErr) {
                        console.debug('[LogModalDialog] farmActivityService.getFarmActivityBySchedule error', dbgErr)
                    }
                } catch { }

                const finalFarmActivityId = selectedActivityIdLocal ?? farmActivityId
                const res: any = await scheduleLogService.createLog({
                    scheduleId: selectedScheduleId,
                    notes: trimmedNotes,
                    farmActivityId: finalFarmActivityId,
                })
                if ((finalFarmActivityId === undefined || finalFarmActivityId === null) && res?.status !== 1) {
                    toastManager.error('Không tìm thấy farmActivityId cho lịch này; không thể tạo ghi nhận. Vui lòng thử lại sau.')
                }
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
            <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl p-6">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-lg font-semibold text-gray-900">{mode === 'create' ? 'Tạo ghi nhận' : 'Chỉnh sửa ghi nhận'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        {mode === 'create' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Hoạt động nông trại</label>
                                <div className="relative">
                                    <select
                                        value={selectedActivityIdLocal ?? ''}
                                        onChange={(e) => setSelectedActivityIdLocal(e.target.value ? Number(e.target.value) : null)}
                                        className="block w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-100"
                                    >
                                        <option value="">-- Không chọn --</option>
                                        {Array.isArray(availableActivities) &&
                                            availableActivities.map((a) => {
                                                const id = (a as any).farmActivitiesId ?? (a as any).farmActivityId ?? (a as any).id
                                                const rawType = (a as any).activityType ?? (a as any).activityName ?? null
                                                const label = translateActivityType(String(rawType ?? `Hoạt động #${id}`))
                                                return (
                                                    <option key={String(id ?? Math.random())} value={String(id ?? '')}>
                                                        {label}
                                                    </option>
                                                )
                                            })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.11 1.01l-4.25 4.657a.75.75 0 01-1.11 0L5.23 8.27a.75.75 0 01.0-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Nội dung</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="block w-full p-3 border border-gray-200 rounded-xl text-sm text-gray-800 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-100"
                                rows={5}
                                placeholder="Nhập nội dung ghi nhận (ví dụ: quan sát, ghi chú, kết quả...)"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                        <Button type="submit">{mode === 'create' ? 'Lưu' : 'Lưu'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
