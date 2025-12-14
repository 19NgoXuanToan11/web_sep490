import React, { useMemo } from 'react'
import { Calendar, momentLocalizer, Navigate } from 'react-big-calendar'
import type { View as RBCView } from 'react-big-calendar'
import moment from 'moment'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import type { FarmActivity } from '@/shared/api/farmActivityService'
import { AllDayWeekView } from './AllDayWeekView'
import { AllDayDayView } from './AllDayDayView'
import { StatusBadge } from './components/StatusBadge'

// View type definition (not exported from react-big-calendar)
export type View = 'month' | 'week' | 'day' | 'agenda'

// SlotInfo type definition (not exported from react-big-calendar)
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

// Configure moment for Vietnamese locale with Monday as week start
try {
  require('moment/locale/vi')
  moment.locale('vi', {
    week: {
      dow: 1, // Monday is the first day of the week
    },
  })
} catch {
  // Fallback if locale not available
  moment.locale('en', {
    week: {
      dow: 1,
    },
  })
}

// Create localizer using moment (required for react-big-calendar v1.x)
const localizer = momentLocalizer(moment)

// Calendar Event interface (Event is not exported from react-big-calendar, so we define it)
export interface CalendarEvent {
  resource: FarmActivity // Store full backend activity object
  title: string
  start: Date
  end: Date
  allDay?: boolean
}

interface ActivitiesCalendarProps {
  events: CalendarEvent[]
  view: View
  date: Date
  onViewChange: (view: RBCView) => void
  onNavigate: (date: Date) => void
  onSelectEvent: (event: CalendarEvent) => void
  onSelectSlot: (slotInfo: any) => void
  getActivityTypeLabel: (type: string | null | undefined) => string
  getStatusBadge: (status: string, isOverdue?: boolean) => React.ReactNode
  onShowMore?: (date: Date) => void
  isActivityOverdue?: (activity: FarmActivity) => boolean
}

export function mapActivitiesToCalendarEvents(
  activities: FarmActivity[],
  getActivityTypeLabel: (type: string | null | undefined) => string
): CalendarEvent[] {
  return activities
    .filter(activity => activity.startDate && activity.endDate)
    .map(activity => {
      let startDate: Date
      let endDate: Date

      try {
        if (activity.startDate.includes('/')) {
          const parts = activity.startDate.split('/')
          if (parts.length === 3) {
            const month = parseInt(parts[0], 10) - 1 
            const day = parseInt(parts[1], 10)
            const year = parseInt(parts[2], 10)
            startDate = new Date(year, month, day, 0, 0, 0, 0)
          } else {
            startDate = new Date(activity.startDate)
          }
        } else {
          startDate = new Date(activity.startDate)
        }

        if (activity.endDate.includes('/')) {
          const parts = activity.endDate.split('/')
          if (parts.length === 3) {
            const month = parseInt(parts[0], 10) - 1
            const day = parseInt(parts[1], 10)
            const year = parseInt(parts[2], 10)
            endDate = new Date(year, month, day, 23, 59, 59, 999) 
          } else {
            endDate = new Date(activity.endDate)
            endDate.setHours(23, 59, 59, 999)
          }
        } else {
          endDate = new Date(activity.endDate)
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
        console.warn('Failed to parse dates for activity:', activity.farmActivitiesId, error)
        return null
      }

      return {
        title: getActivityTypeLabel(activity.activityType),
        start: startDate,
        end: endDate,
        resource: activity, 
      } as CalendarEvent
    })
    .filter((event): event is CalendarEvent => event !== null)
}

function eventStyleGetter(event: CalendarEvent) {
  const status = (event.resource.status || '').toUpperCase()
  const activityType = event.resource.activityType || ''

  let backgroundColor = '#64748b' 
  let color = '#ffffff' 
  let borderColor = 'transparent'
  let borderLeftWidth = '0px'

  if (activityType === 'SoilPreparation') {
    backgroundColor = '#92400e' 
  } else {    
    switch (status) {
      case 'ACTIVE':
        backgroundColor = '#10b981' 
        break
      case 'IN_PROGRESS':
        backgroundColor = '#3b82f6' 
        break
      case 'COMPLETED':
        backgroundColor = '#64748b' 
        break
      case 'DEACTIVATED':
        backgroundColor = '#f59e0b' 
        break
      default:
        backgroundColor = '#64748b' 
    }
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
  isActivityOverdue
}: {
  event: CalendarEvent
  isActivityOverdue?: (activity: FarmActivity) => boolean
}) {
  const overdue = isActivityOverdue ? isActivityOverdue(event.resource) : false

  return (
    <div className="flex items-center gap-1.5 truncate w-full min-w-0">
      <span className="truncate font-medium text-xs flex-1 min-w-0">{event.title}</span>
      <StatusBadge
        status={event.resource.status || ''}
        isOverdue={overdue}
        size="sm"
        className="flex-shrink-0"
      />
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

export function ActivitiesCalendar({
  events,
  view,
  date,
  onViewChange,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  getActivityTypeLabel,
  getStatusBadge,
  onShowMore,
  isActivityOverdue,
}: ActivitiesCalendarProps) {
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
      noEventsInRange: 'Không có hoạt động trong khoảng thời gian này.',
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
        getActivityTypeLabel={getActivityTypeLabel}
        getStatusBadge={getStatusBadge}
        isActivityOverdue={isActivityOverdue}
      />
    )
  }, [allDayEvents, onSelectEvent, onShowMore, getActivityTypeLabel, getStatusBadge, isActivityOverdue])

  const CustomDayView = useMemo(() => {
    return (props: any) => (
      <AllDayDayView
        {...props}
        events={allDayEvents}
        onSelectEvent={onSelectEvent}
        onShowMore={onShowMore}
        getActivityTypeLabel={getActivityTypeLabel}
        getStatusBadge={getStatusBadge}
        isActivityOverdue={isActivityOverdue}
      />
    )
  }, [allDayEvents, onSelectEvent, onShowMore, getActivityTypeLabel, getStatusBadge, isActivityOverdue])

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
                  event: (props: any) => <EventComponent event={props.event} isActivityOverdue={isActivityOverdue} />,
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
            /* Week view: Custom All-Day Week Board */
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
                getActivityTypeLabel={getActivityTypeLabel}
                getStatusBadge={getStatusBadge}
                isActivityOverdue={isActivityOverdue}
              />
            </div>
          ) : view === 'day' ? (
            /* Day view: Custom All-Day Day Board */
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
                getActivityTypeLabel={getActivityTypeLabel}
                getStatusBadge={getStatusBadge}
                isActivityOverdue={isActivityOverdue}
              />
            </div>
          ) : (
            /* Agenda/List view: Keep existing or use RBC agenda */
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
                  event: (props: any) => <EventComponent event={props.event} isActivityOverdue={isActivityOverdue} />,
                  toolbar: CustomToolbar,
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

