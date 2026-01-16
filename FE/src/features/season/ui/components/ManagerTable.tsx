import React, { useMemo, useState } from 'react'
import type { ScheduleListItem } from '../types'
import { formatDateRange } from '@/shared/lib/date-utils'
import { Badge } from '@/shared/ui/badge'
import ScheduleActionMenu from '../components/ScheduleActionMenu'
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
                                <tr
                                    key={id}
                                    className={cn('cursor-pointer hover:bg-gray-50 transition', !isActive && 'opacity-70')}
                                    onClick={() => onOpenDetail(item)}
                                >
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
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}


