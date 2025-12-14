import React from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import moment from 'moment'
import type { FarmActivity } from '@/shared/api/farmActivityService'
import { occursOnDay, formatVNShort, formatDateRange, rangeWeek } from './calendarDate'

interface AllDayWeekViewProps {
    date: Date
    localizer: any
    events: Array<{
        resource: FarmActivity
        title: string
        start: Date
        end: Date
        allDay?: boolean
    }>
    onSelectEvent?: (event: any) => void
    onShowMore?: (date: Date) => void
    getActivityTypeLabel: (type: string | null | undefined) => string
    getStatusBadge: (status: string) => React.ReactNode
    isActivityOverdue?: (activity: FarmActivity) => boolean
}

const AllDayWeekViewComponent = ({
    date,
    localizer: _localizer,
    events,
    onSelectEvent,
    onShowMore,
    getActivityTypeLabel,
    getStatusBadge,
    isActivityOverdue,
}: AllDayWeekViewProps) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()

    const days = rangeWeek(validDate)
    const activities = events.map(e => e.resource)

    // Sort activities: overdue/at-risk first, then by status priority
    const sortActivities = (items: FarmActivity[]): FarmActivity[] => {
        return [...items].sort((a, b) => {
            // Overdue/at-risk first
            const aOverdue = isActivityOverdue ? isActivityOverdue(a) : false
            const bOverdue = isActivityOverdue ? isActivityOverdue(b) : false
            if (aOverdue && !bOverdue) return -1
            if (!aOverdue && bOverdue) return 1

            // Then by status priority
            const statusOrder: Record<string, number> = {
                IN_PROGRESS: 0,
                ACTIVE: 1,
                COMPLETED: 2,
                DEACTIVATED: 3,
            }
            const aOrder = statusOrder[(a.status || '').toUpperCase()] ?? 99
            const bOrder = statusOrder[(b.status || '').toUpperCase()] ?? 99
            if (aOrder !== bOrder) return aOrder - bOrder

            // Then by start date
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

    const handleActivityClick = (activity: FarmActivity) => {
        if (onSelectEvent) {
            // Find the event that corresponds to this activity
            const event = events.find(e => e.resource.farmActivitiesId === activity.farmActivitiesId)
            if (event) {
                onSelectEvent(event)
            }
        }
    }

    return (
        <div className="grid grid-cols-7 gap-3 p-4">
            {days.map((day) => {
                // Validate day before using it
                if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
                    return null
                }

                const dayActivities = activities.filter(a =>
                    occursOnDay(a.startDate, a.endDate, day)
                )
                const sortedActivities = sortActivities(dayActivities)

                return (
                    <Card
                        key={day.toISOString()}
                        className="rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                        <CardContent className="p-3">
                            {/* Day Header */}
                            <header className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                                <button
                                    onClick={() => handleDayClick(day)}
                                    className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                                >
                                    {formatVNShort(day)}
                                </button>
                                <span className="text-xs font-medium text-slate-500">
                                    ({sortedActivities.length})
                                </span>
                            </header>

                            {/* Activities List */}
                            <div className="space-y-2 min-h-[200px]">
                                {sortedActivities.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center">
                                        <p className="text-xs text-slate-400">Không có hoạt động</p>
                                    </div>
                                ) : (
                                    sortedActivities.map(activity => {
                                        const overdue = isActivityOverdue ? isActivityOverdue(activity) : false

                                        return (
                                            <button
                                                key={activity.farmActivitiesId}
                                                onClick={() => handleActivityClick(activity)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-sm font-medium text-slate-900 truncate">
                                                                {getActivityTypeLabel(activity.activityType)}
                                                            </h4>
                                                            {getStatusBadge(activity.status)}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            {formatDateRange(activity.startDate, activity.endDate)}
                                                        </div>
                                                        {overdue && (
                                                            <div className="mt-1 text-xs font-medium text-red-600">
                                                                Quá hạn
                                                            </div>
                                                        )}
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
    // Validate input date
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

    // Validate result date
    if (!result || !(result instanceof Date) || isNaN(result.getTime())) {
        return new Date()
    }

    return result
}

AllDayWeekViewComponent.title = (date: Date, { localizer: _localizer }: any) => {
    // Validate input date
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

