import React from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import moment from 'moment'
import type { ScheduleListItem } from '@/shared/api/scheduleService'
import { occursOnDay, formatVNShort, formatDateRange, rangeWeek } from './calendarDate'

interface AllDayWeekViewProps {
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

const AllDayWeekViewComponent = ({
    date,
    localizer: _localizer,
    events,
    onSelectEvent,
    onShowMore,
    getScheduleLabel,
    getStatusBadge,
}: AllDayWeekViewProps) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()

    const days = rangeWeek(validDate)
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

    const handleDayClick = (day: Date) => {
        if (onShowMore) {
            onShowMore(day)
        }
    }

    const handleScheduleClick = (schedule: ScheduleListItem) => {
        if (onSelectEvent) {
            const event = events.find(e => e.resource.scheduleId === schedule.scheduleId)
            if (event) {
                onSelectEvent(event)
            }
        }
    }

    return (
        <div className="grid grid-cols-7 gap-3 p-4">
            {days.map((day) => {
                if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
                    return null
                }

                const daySchedules = schedules.filter(s =>
                    occursOnDay(s.startDate, s.endDate, day)
                )
                const sortedSchedules = sortSchedules(daySchedules)

                return (
                    <Card
                        key={day.toISOString()}
                        className="rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                        <CardContent className="p-3">
                            <header className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                                <button
                                    onClick={() => handleDayClick(day)}
                                    className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                                >
                                    {formatVNShort(day)}
                                </button>
                                <span className="text-xs font-medium text-slate-500">
                                    ({sortedSchedules.length})
                                </span>
                            </header>

                            <div className="space-y-2 min-h-[200px]">
                                {sortedSchedules.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
                                        <p className="text-xs text-slate-400">Không có lịch tưới</p>
                                    </div>
                                ) : (
                                    sortedSchedules.map(schedule => {
                                        const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'

                                        return (
                                            <button
                                                key={schedule.scheduleId || `${schedule.farmId}-${schedule.cropId}`}
                                                onClick={() => handleScheduleClick(schedule)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-sm font-medium text-slate-900 truncate">
                                                                {getScheduleLabel(schedule)}
                                                            </h4>
                                                            {getStatusBadge(schedule.status, isActive)}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">
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
                )
            })}
        </div>
    )
}

AllDayWeekViewComponent.range = (date: Date, { localizer: _localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()
    return rangeWeek(validDate)
}

AllDayWeekViewComponent.navigate = (date: Date, action: any, { localizer: _localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()

    let result: Date
    switch (action) {
        case 'PREV':
            result = moment(validDate).subtract(1, 'week').toDate()
            break
        case 'NEXT':
            result = moment(validDate).add(1, 'week').toDate()
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

AllDayWeekViewComponent.title = (date: Date, { localizer: _localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()

    const start = moment(validDate).startOf('week')
    const end = moment(validDate).endOf('week')
    return `${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`
}

export const AllDayWeekView = AllDayWeekViewComponent as typeof AllDayWeekViewComponent & {
    range: (date: Date, options: { localizer: any }) => Date[]
    navigate: (date: Date, action: any, options: { localizer: any }) => Date
    title: (date: Date, options: { localizer: any }) => string
}

