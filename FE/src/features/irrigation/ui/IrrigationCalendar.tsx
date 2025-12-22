import React, { useMemo } from 'react'
import { Calendar, momentLocalizer, Navigate } from 'react-big-calendar'
import type { View as RBCView } from 'react-big-calendar'
import moment from 'moment'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import type { ScheduleListItem } from '@/shared/api/scheduleService'
import { AllDayWeekView } from './AllDayWeekView'
import { AllDayDayView } from './AllDayDayView'

export type View = 'month' | 'week' | 'day' | 'agenda'

export interface SlotInfo {
    start: Date
    end: Date
    action: 'select' | 'click'
    bounds?: {
        x: number
        y: number
        top: number
        left: number
        width: number
        height: number
    }
    box?: {
        x: number
        y: number
        clientX: number
        clientY: number
    }
}

try {
    require('moment/locale/vi')
    moment.locale('vi', {
        week: {
            dow: 1,
        },
    })
} catch {
    moment.locale('en', {
        week: {
            dow: 1,
        },
    })
}

const localizer = momentLocalizer(moment)

export interface CalendarEvent {
    resource: ScheduleListItem
    title: string
    start: Date
    end: Date
    allDay?: boolean
}

interface IrrigationCalendarProps {
    events: CalendarEvent[]
    view: View
    date: Date
    onViewChange: (view: RBCView) => void
    onNavigate: (date: Date) => void
    onSelectEvent: (event: CalendarEvent) => void
    onSelectSlot: (slotInfo: any) => void
    getScheduleLabel: (schedule: ScheduleListItem) => string
    getStatusBadge: (status: number | string, isActive?: boolean) => React.ReactNode
    onShowMore?: (date: Date) => void
}

export function mapSchedulesToCalendarEvents(
    schedules: ScheduleListItem[],
    getScheduleLabel: (schedule: ScheduleListItem) => string
): CalendarEvent[] {
    return schedules
        .filter(schedule => schedule.startDate && schedule.endDate)
        .map(schedule => {
            let startDate: Date
            let endDate: Date

            try {
                if (schedule.startDate.includes('/')) {
                    const parts = schedule.startDate.split('/')
                    if (parts.length === 3) {
                        const month = parseInt(parts[0], 10) - 1
                        const day = parseInt(parts[1], 10)
                        const year = parseInt(parts[2], 10)
                        startDate = new Date(year, month, day, 0, 0, 0, 0)
                    } else {
                        startDate = new Date(schedule.startDate)
                    }
                } else {
                    startDate = new Date(schedule.startDate)
                }

                if (schedule.endDate.includes('/')) {
                    const parts = schedule.endDate.split('/')
                    if (parts.length === 3) {
                        const month = parseInt(parts[0], 10) - 1
                        const day = parseInt(parts[1], 10)
                        const year = parseInt(parts[2], 10)
                        endDate = new Date(year, month, day, 23, 59, 59, 999)
                    } else {
                        endDate = new Date(schedule.endDate)
                        endDate.setHours(23, 59, 59, 999)
                    }
                } else {
                    endDate = new Date(schedule.endDate)
                    endDate.setHours(23, 59, 59, 999)
                }

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    return null
                }

                if (endDate < startDate) {
                    endDate = new Date(startDate)
                    endDate.setHours(23, 59, 59, 999)
                }
            } catch (error) {
                console.warn('Failed to parse dates for schedule:', schedule.scheduleId, error)
                return null
            }

            return {
                title: getScheduleLabel(schedule),
                start: startDate,
                end: endDate,
                resource: schedule,
            } as CalendarEvent
        })
        .filter((event): event is CalendarEvent => event !== null)
}

function eventStyleGetter(event: CalendarEvent) {
    const status = event.resource.status
    const isActive = typeof status === 'number' ? status === 1 : status === 'ACTIVE'

    let backgroundColor = '#64748b'
    let color = '#ffffff'
    let borderColor = 'transparent'
    let borderLeftWidth = '0px'

    if (isActive) {
        backgroundColor = '#10b981'
    } else {
        backgroundColor = '#94a3b8'
    }

    return {
        className: 'rbc-event-enterprise',
        style: {
            backgroundColor,
            borderColor,
            borderLeftWidth,
            borderWidth: '0px',
            borderStyle: 'solid',
            color,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: '500',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        },
    }
}

function EventComponent({
    event,
    getStatusBadge,
}: {
    event: CalendarEvent
    getStatusBadge: (status: number | string, isActive?: boolean) => React.ReactNode
}) {
    const status = event.resource.status
    const isActive = typeof status === 'number' ? status === 1 : status === 'ACTIVE'

    return (
        <div className="flex items-center gap-1.5 truncate w-full min-w-0">
            <span className="truncate font-medium text-xs flex-1 min-w-0">{event.title}</span>
            {getStatusBadge(status, isActive)}
        </div>
    )
}

const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        if (toolbar.view === 'week' || toolbar.view === 'day') {
            const currentDate = toolbar.date && toolbar.date instanceof Date && !isNaN(toolbar.date.getTime())
                ? toolbar.date
                : new Date()

            let newDate: Date
            if (toolbar.view === 'week') {
                newDate = AllDayWeekView.navigate(currentDate, 'PREV', { localizer: null })
            } else {
                newDate = AllDayDayView.navigate(currentDate, 'PREV', { localizer: null })
            }

            if (toolbar.onNavigate) {
                toolbar.onNavigate(newDate)
            }
        } else {
            toolbar.onNavigate(Navigate.PREVIOUS)
        }
    }

    const goToNext = () => {
        if (toolbar.view === 'week' || toolbar.view === 'day') {
            const currentDate = toolbar.date && toolbar.date instanceof Date && !isNaN(toolbar.date.getTime())
                ? toolbar.date
                : new Date()

            let newDate: Date
            if (toolbar.view === 'week') {
                newDate = AllDayWeekView.navigate(currentDate, 'NEXT', { localizer: null })
            } else {
                newDate = AllDayDayView.navigate(currentDate, 'NEXT', { localizer: null })
            }

            if (toolbar.onNavigate) {
                toolbar.onNavigate(newDate)
            }
        } else {
            toolbar.onNavigate(Navigate.NEXT)
        }
    }

    const goToToday = () => {
        if (toolbar.view === 'week' || toolbar.view === 'day') {
            const newDate = new Date()
            if (toolbar.onNavigate) {
                toolbar.onNavigate(newDate)
            }
        } else {
            toolbar.onNavigate(Navigate.TODAY)
        }
    }

    const label = () => {
        const toolbarDate = toolbar.date
        const validDate = toolbarDate && toolbarDate instanceof Date && !isNaN(toolbarDate.getTime())
            ? toolbarDate
            : new Date()

        if (toolbar.label && typeof toolbar.label === 'function') {
            try {
                return toolbar.label()
            } catch (error) {
            }
        }

        const date = moment(validDate)
        if (!date.isValid()) {
            const fallbackDate = moment()
            switch (toolbar.view) {
                case 'month':
                    return fallbackDate.format('MMMM YYYY')
                case 'week':
                    const start = fallbackDate.startOf('week')
                    const end = fallbackDate.endOf('week')
                    return `${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`
                case 'day':
                    return fallbackDate.format('dddd, DD/MM')
                default:
                    return fallbackDate.format('MMMM YYYY')
            }
        }

        switch (toolbar.view) {
            case 'month':
                return date.format('MMMM YYYY')
            case 'week':
                const start = moment(validDate).startOf('week')
                const end = moment(validDate).endOf('week')
                return `${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`
            case 'day':
                return date.format('dddd, DD/MM')
            default:
                return date.format('MMMM YYYY')
        }
    }

    return (
        <div className="rbc-toolbar relative flex items-center justify-center p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30">
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={goToBack}
                    className="h-12 w-12 rounded-full hover:bg-emerald-100/80 hover:text-emerald-700 transition-all duration-300 group shadow-sm hover:shadow-md border border-slate-200/60 hover:border-emerald-300/60"
                    aria-label="Previous Week"
                >
                    <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                </Button>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={goToToday}
                        className="h-12 px-4 rounded-full border-slate-200/80 bg-white/90 backdrop-blur-sm hover:bg-emerald-50 hover:border-emerald-300/60 hover:text-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md font-medium text-sm"
                    >
                        Hôm nay
                    </Button>

                    <div className="px-6 py-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-md min-w-[200px] text-center">
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            {label()}
                        </span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="lg"
                    onClick={goToNext}
                    className="h-12 w-12 rounded-full hover:bg-emerald-100/80 hover:text-emerald-700 transition-all duration-300 group shadow-sm hover:shadow-md border border-slate-200/60 hover:border-emerald-300/60"
                    aria-label="Next Week"
                >
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
            </div>
        </div>
    )
}

const CustomShowMore = ({ events, date, onShowMore }: any) => {
    if (!onShowMore || !events || events.length === 0) return null

    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onShowMore && date) {
                    onShowMore(date)
                }
            }}
            className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium mt-1 px-2 py-0.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        >
            +{events.length} thêm
        </button>
    )
}

const CustomAgendaTime = () => {
    return <span style={{ display: 'none' }} />
}

const CustomAgendaDate = ({ date }: any) => {
    return <span>{moment(date).format('ddd MMM DD')}</span>
}

export function IrrigationCalendar({
    events,
    view,
    date,
    onViewChange,
    onNavigate,
    onSelectEvent,
    onSelectSlot,
    getScheduleLabel,
    getStatusBadge,
    onShowMore,
}: IrrigationCalendarProps) {
    const messages = useMemo(
        () => ({
            next: 'Tiếp',
            previous: 'Trước',
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            day: 'Ngày',
            agenda: 'Danh sách',
            date: 'Ngày',
            time: 'Giờ',
            event: 'Sự kiện',
            noEventsInRange: 'Không có lịch tưới trong khoảng thời gian này.',
            showMore: (total: number) => `+${total} thêm`,
        }),
        []
    )

    const allDayEvents = useMemo(() => {
        return events.map(event => ({
            ...event,
            allDay: true,
        }))
    }, [events])

    const CustomWeekView = useMemo(() => {
        return (props: any) => (
            <AllDayWeekView
                {...props}
                events={allDayEvents}
                onSelectEvent={onSelectEvent}
                onShowMore={onShowMore}
                getScheduleLabel={getScheduleLabel}
                getStatusBadge={getStatusBadge}
            />
        )
    }, [allDayEvents, onSelectEvent, onShowMore, getScheduleLabel, getStatusBadge])

    const CustomDayView = useMemo(() => {
        return (props: any) => (
            <AllDayDayView
                {...props}
                events={allDayEvents}
                onSelectEvent={onSelectEvent}
                onShowMore={onShowMore}
                getScheduleLabel={getScheduleLabel}
                getStatusBadge={getStatusBadge}
            />
        )
    }, [allDayEvents, onSelectEvent, onShowMore, getScheduleLabel, getStatusBadge])

    const isMonthView = view === 'month'

    return (
        <>
            <style>{`
        .rbc-event-enterprise {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rbc-event-enterprise:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        .rbc-event-enterprise:hover {
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .rbc-month-view .rbc-event {
          margin: 2px 0;
          padding: 2px 6px;
        }
        
        .rbc-show-more {
          background: transparent;
          border: none;
          box-shadow: none;
          cursor: pointer;
        }
        .rbc-show-more:hover {
          text-decoration: underline;
        }
        
        .rbc-agenda-view table thead th.rbc-agenda-time-cell,
        .rbc-agenda-view table tbody td.rbc-agenda-time-cell,
        .rbc-agenda-view .rbc-agenda-time-cell,
        .rbc-agenda-view .rbc-agenda-time-cell-header,
        .rbc-agenda-view table thead th:nth-child(2),
        .rbc-agenda-view table tbody td:nth-child(2) {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          visibility: hidden !important;
          overflow: hidden !important;
          font-size: 0 !important;
          line-height: 0 !important;
        }
        .rbc-agenda-view table {
          table-layout: auto !important;
        }
        .rbc-agenda-view table thead th:first-child,
        .rbc-agenda-view table tbody td:first-child {
          width: auto !important;
        }
      `}</style>
            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    {isMonthView ? (
                        <div style={{ height: '600px' }} className="rbc-calendar-wrapper">
                            <Calendar
                                localizer={localizer}
                                events={allDayEvents}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                view={view}
                                date={date}
                                onView={onViewChange}
                                onNavigate={onNavigate}
                                onSelectEvent={onSelectEvent}
                                onSelectSlot={onSelectSlot}
                                selectable
                                eventPropGetter={eventStyleGetter}
                                components={{
                                    event: (props: any) => <EventComponent event={props.event} getStatusBadge={getStatusBadge} />,
                                    toolbar: CustomToolbar,
                                    ...(onShowMore ? { showMore: (props: any) => <CustomShowMore {...props} onShowMore={onShowMore} /> } : {}),
                                }}
                                messages={messages}
                                formats={{
                                    dayFormat: 'dddd, DD/MM',
                                    weekdayFormat: 'dddd',
                                    monthHeaderFormat: 'MMMM YYYY',
                                    dayHeaderFormat: 'dddd, DD/MM',
                                    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                                        `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`,
                                }}
                                culture="vi"
                                showMultiDayTimes={false}
                                popup
                                popupOffset={{ x: 0, y: 5 }}
                            />
                        </div>
                    ) : view === 'week' ? (
                        <div className="rbc-calendar-wrapper">
                            <CustomToolbar
                                date={date}
                                view={view}
                                onNavigate={onNavigate}
                                onView={onViewChange}
                                label={() => AllDayWeekView.title(date, { localizer })}
                            />
                            <CustomWeekView
                                date={date}
                                localizer={localizer}
                                events={allDayEvents}
                                onSelectEvent={onSelectEvent}
                                onShowMore={onShowMore}
                                getScheduleLabel={getScheduleLabel}
                                getStatusBadge={getStatusBadge}
                            />
                        </div>
                    ) : view === 'day' ? (
                        <div className="rbc-calendar-wrapper">
                            <CustomToolbar
                                date={date}
                                view={view}
                                onNavigate={onNavigate}
                                onView={onViewChange}
                                label={() => AllDayDayView.title(date, { localizer })}
                            />
                            <CustomDayView
                                date={date}
                                localizer={localizer}
                                events={allDayEvents}
                                onSelectEvent={onSelectEvent}
                                onShowMore={onShowMore}
                                getScheduleLabel={getScheduleLabel}
                                getStatusBadge={getStatusBadge}
                            />
                        </div>
                    ) : (           
                        <div style={{ height: '600px' }} className="rbc-calendar-wrapper">
                            <Calendar
                                localizer={localizer}
                                events={allDayEvents}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                view={view}
                                date={date}
                                onView={onViewChange}
                                onNavigate={onNavigate}
                                onSelectEvent={onSelectEvent}
                                onSelectSlot={onSelectSlot}
                                selectable
                                eventPropGetter={eventStyleGetter}
                                components={{
                                    event: (props: any) => <EventComponent event={props.event} getStatusBadge={getStatusBadge} />,
                                    toolbar: CustomToolbar,
                                    agenda: {
                                        time: CustomAgendaTime,
                                        date: CustomAgendaDate,
                                    },
                                }}
                                messages={messages}
                                formats={{
                                    dayFormat: 'dddd, DD/MM',
                                    weekdayFormat: 'dddd',
                                    monthHeaderFormat: 'MMMM YYYY',
                                    dayHeaderFormat: 'dddd, DD/MM',
                                }}
                                culture="vi"
                                showMultiDayTimes={false}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}

