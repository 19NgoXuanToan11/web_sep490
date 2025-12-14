import React from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import moment from 'moment'
import type { ScheduleListItem } from '@/shared/api/scheduleService'
import { occursOnDay, formatVNLong, formatDateRange, rangeDay } from './calendarDate'

interface AllDayDayViewProps {
    date: Date
    localizer: any
    events: Array<{
        resource: ScheduleListItem
        title: string
        start: Date
        end: Date
        allDay?: boolean
    }>
    onSelectEvent?: (event: any) => void
    onShowMore?: (date: Date) => void
    getScheduleLabel: (schedule: ScheduleListItem) => string
    getStatusBadge: (status: number | string, isActive?: boolean) => React.ReactNode
}

const AllDayDayViewComponent = ({
    date,
    events,
    onSelectEvent,
    onShowMore,
    getScheduleLabel,
    getStatusBadge,
}: AllDayDayViewProps) => {
    const day = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()
    const schedules = events.map(e => e.resource)

    const sortSchedules = (items: ScheduleListItem[]): ScheduleListItem[] => {
        return [...items].sort((a, b) => {
            const aActive = typeof a.status === 'number' ? a.status === 1 : a.status === 'ACTIVE'
            const bActive = typeof b.status === 'number' ? b.status === 1 : b.status === 'ACTIVE'
            if (aActive && !bActive) return -1
            if (!aActive && bActive) return 1

            const aStart = a.startDate ? new Date(a.startDate).getTime() : 0
            const bStart = b.startDate ? new Date(b.startDate).getTime() : 0
            return aStart - bStart
        })
    }

    const daySchedules = schedules.filter(s => occursOnDay(s.startDate, s.endDate, day))
    const sortedSchedules = sortSchedules(daySchedules)

    const handleScheduleClick = (schedule: ScheduleListItem) => {
        if (onSelectEvent) {
            const event = events.find(e => e.resource.scheduleId === schedule.scheduleId)
            if (event) {
                onSelectEvent(event)
            }
        }
    }

    return (
        <div className="p-4">
            <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                    <header className="mb-6 border-b border-slate-200 pb-4">
                        <h2 className="text-xl font-bold text-slate-900">
                            {formatVNLong(day)}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {sortedSchedules.length} lịch tưới trong ngày
                        </p>
                    </header>

                    <div className="space-y-3">
                        {sortedSchedules.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                                <p className="text-sm text-slate-400">Không có lịch tưới trong ngày này</p>
                                {onShowMore && (
                                    <Button
                                        onClick={() => onShowMore(day)}
                                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                        size="sm"
                                    >
                                        Tạo lịch tưới mới
                                    </Button>
                                )}
                            </div>
                        ) : (
                            sortedSchedules.map(schedule => {
                                const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'

                                return (
                                    <button
                                        key={schedule.scheduleId || `${schedule.farmId}-${schedule.cropId}`}
                                        onClick={() => handleScheduleClick(schedule)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="text-base font-semibold text-slate-900">
                                                        {getScheduleLabel(schedule)}
                                                    </h4>
                                                    {getStatusBadge(schedule.status, isActive)}
                                                </div>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    {formatDateRange(schedule.startDate, schedule.endDate)}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

AllDayDayViewComponent.range = (date: Date, { localizer: _localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()
    return rangeDay(validDate)
}

AllDayDayViewComponent.navigate = (date: Date, action: any, { localizer: _localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()

    let result: Date
    switch (action) {
        case 'PREV':
            result = moment(validDate).subtract(1, 'day').toDate()
            break
        case 'NEXT':
            result = moment(validDate).add(1, 'day').toDate()
            break
        case 'TODAY':
            result = new Date()
            break
        default:
            result = validDate
    }

    if (!result || !(result instanceof Date) || isNaN(result.getTime())) {
        return new Date()
    }

    return result
}

AllDayDayViewComponent.title = (date: Date, { localizer: _localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()
    return formatVNLong(validDate)
}

export const AllDayDayView = AllDayDayViewComponent as typeof AllDayDayViewComponent & {
    range: (date: Date, options: { localizer: any }) => Date[]
    navigate: (date: Date, action: any, options: { localizer: any }) => Date
    title: (date: Date, options: { localizer: any }) => string
}

