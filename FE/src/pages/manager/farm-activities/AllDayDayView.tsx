import React from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import moment from 'moment'
import type { FarmActivity } from '@/shared/api/farmActivityService'
import { occursOnDay, formatVNLong, formatDateRange, rangeDay } from './calendarDate'

interface AllDayDayViewProps {
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

const AllDayDayViewComponent = ({
    date,
    events,
    onSelectEvent,
    onShowMore,
    getActivityTypeLabel,
    getStatusBadge,
    isActivityOverdue,
}: AllDayDayViewProps) => {
    const day = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()
    const activities = events.map(e => e.resource)

    const sortActivities = (items: FarmActivity[]): FarmActivity[] => {
        return [...items].sort((a, b) => {
            const aOverdue = isActivityOverdue ? isActivityOverdue(a) : false
            const bOverdue = isActivityOverdue ? isActivityOverdue(b) : false
            if (aOverdue && !bOverdue) return -1
            if (!aOverdue && bOverdue) return 1

            const statusOrder: Record<string, number> = {
                IN_PROGRESS: 0,
                ACTIVE: 1,
                COMPLETED: 2,
                DEACTIVATED: 3,
            }
            const aOrder = statusOrder[(a.status || '').toUpperCase()] ?? 99
            const bOrder = statusOrder[(b.status || '').toUpperCase()] ?? 99
            if (aOrder !== bOrder) return aOrder - bOrder

            const aStart = a.startDate ? new Date(a.startDate).getTime() : 0
            const bStart = b.startDate ? new Date(b.startDate).getTime() : 0
            return aStart - bStart
        })
    }

    const dayActivities = activities.filter(a => occursOnDay(a.startDate, a.endDate, day))
    const sortedActivities = sortActivities(dayActivities)

    const handleActivityClick = (activity: FarmActivity) => {
        if (onSelectEvent) {
            const event = events.find(e => e.resource.farmActivitiesId === activity.farmActivitiesId)
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
                            {sortedActivities.length} hoạt động trong ngày
                        </p>
                    </header>

                    <div className="space-y-3">
                        {sortedActivities.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
                                <p className="text-sm text-slate-400">Không có hoạt động trong ngày này</p>
                                {onShowMore && (
                                    <Button
                                        onClick={() => onShowMore(day)}
                                        className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                                        size="sm"
                                    >
                                        Tạo hoạt động mới
                                    </Button>
                                )}
                            </div>
                        ) : (
                            sortedActivities.map(activity => {
                                const overdue = isActivityOverdue ? isActivityOverdue(activity) : false

                                return (
                                    <button
                                        key={activity.farmActivitiesId}
                                        onClick={() => handleActivityClick(activity)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="text-base font-semibold text-slate-900">
                                                        {getActivityTypeLabel(activity.activityType)}
                                                    </h4>
                                                    {getStatusBadge(activity.status)}
                                                </div>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    {formatDateRange(activity.startDate, activity.endDate)}
                                                </div>
                                                {overdue && (
                                                    <div className="mt-2 text-sm font-medium text-red-600">
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
        </div>
    )
}

AllDayDayViewComponent.range = (date: Date, { localizer }: any) => {
    const validDate = date && date instanceof Date && !isNaN(date.getTime())
        ? date
        : new Date()
    return rangeDay(validDate)
}

AllDayDayViewComponent.navigate = (date: Date, action: any, { localizer }: any) => {
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

AllDayDayViewComponent.title = (date: Date, { localizer }: any) => {
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

