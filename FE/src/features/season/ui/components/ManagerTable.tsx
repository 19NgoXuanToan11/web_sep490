import React, { useMemo, useState } from 'react'
import type { ScheduleListItem } from '../types'
import { formatDateRange } from '@/shared/lib/date-utils'
import { Badge } from '@/shared/ui/badge'
import ScheduleActionMenu from '../components/ScheduleActionMenu'
import { scheduleLogService } from '@/shared/api/scheduleLogService'
import ScheduleLogPanel from './ScheduleLogPanel'
import { cn } from '@/shared/lib/utils'

type Props = {
    items: ScheduleListItem[]
    onOpenDetail: (s: ScheduleListItem) => void
    onAddLog: (s: ScheduleListItem) => void
    onEdit: (s: ScheduleListItem) => void
    onUpdateStatus: (s: ScheduleListItem, next: any) => void
    onOpenLogEditor?: (log: any) => void
}

export default function ManagerTable({ items, onOpenDetail, onAddLog, onEdit, onUpdateStatus, onOpenLogEditor }: Props) {
    const [expanded, setExpanded] = useState<Record<number, boolean>>({})

    const rows = useMemo(() => {
        return items.map(i => {
            return { item: i }
        })
    }, [items])

    return (
        <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Thời gian</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {rows.map(({ item }) => {
                            const id = Number(item.scheduleId ?? Math.random() * 1000000)
                            const isActive = typeof item.status === 'number' ? item.status === 1 : item.status === 'ACTIVE'
                            return (
                                <React.Fragment key={id}>
                                    <tr className={cn('cursor-pointer hover:bg-gray-50 transition', !isActive && 'opacity-70')} onClick={() => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center gap-2">
                                                <Badge className={`h-6 text-xs ${isActive ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>{isActive ? 'Hoạt động' : 'Vô hiệu hóa'}</Badge>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 align-top text-sm text-gray-700">{formatDateRange(item.startDate, item.endDate)}</td>

                                        <td className="px-4 py-3 align-top">
                                            {item.scheduleId && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <ScheduleActionMenu
                                                        schedule={item}
                                                        onView={(s) => onOpenDetail(s)}
                                                        onEdit={(s) => onEdit(s)}
                                                        onViewLogs={(s) => onOpenDetail(s)}
                                                        onAddLog={(s) => onAddLog(s)}
                                                        onAssignStaff={() => { }}
                                                        onUpdateStatus={(s, ns) => onUpdateStatus(s, ns)}
                                                        actionLoading={{}}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>

                                    {expanded[id] && (
                                        <tr>
                                            <td colSpan={3} className="p-4 bg-gray-50">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2 md:col-span-3">
                                                        <div className="text-sm font-semibold">Nhật ký hoạt động</div>
                                                        {item.scheduleId ? (
                                                            <ScheduleLogPanel
                                                                scheduleId={item.scheduleId}
                                                                onEdit={(log) => {
                                                                    if (onOpenLogEditor) onOpenLogEditor(log)
                                                                }}
                                                                registerUpdater={() => { }}
                                                            />
                                                        ) : (
                                                            <div className="text-sm text-gray-600">{(item as any).lastLogNotes ?? 'Không có nhật ký gần đây.'}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        className="px-3 py-1 bg-gradient-to-r from-emerald-300 to-emerald-600 text-white rounded-full text-sm font-medium shadow-sm hover:from-emerald-500 hover:to-emerald-700 transition-colors duration-200 focus:outline-none"
                                                        onClick={(e) => { e.stopPropagation(); onAddLog(item) }}
                                                    >
                                                        Ghi nhật ký
                                                    </button>
                                                    {onOpenLogEditor ? (
                                                        <button
                                                            className="px-3 py-1 bg-white text-gray-800 border border-gray-200 rounded-full text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none"
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                try {
                                                                    if (!item.scheduleId) return
                                                                    const logs = await scheduleLogService.getLogsBySchedule(item.scheduleId, 1, 1)
                                                                    const latest = Array.isArray((logs as any).items) && (logs as any).items.length > 0 ? (logs as any).items[0] : null
                                                                    if (latest && onOpenLogEditor) {
                                                                        onOpenLogEditor(latest)
                                                                    }
                                                                } catch (err) {
                                                                }
                                                            }}
                                                        >
                                                            Điều chỉnh
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


