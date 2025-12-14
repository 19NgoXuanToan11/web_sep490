import React, { useState, useMemo, useCallback } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import { formatDate, formatDateTime } from '@/shared/lib/date-utils'
import { scheduleService, type ScheduleListItem } from '@/shared/api/scheduleService'
import { useToast } from '@/shared/ui/use-toast'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, startOfMonth, endOfMonth, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { vi } from 'date-fns/locale'

type ViewMode = 'month' | 'week' | 'day'

interface EnterpriseIrrigationCalendarProps {
  className?: string
}

export function EnterpriseIrrigationCalendar({ className }: EnterpriseIrrigationCalendarProps) {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([])
  const [, setLoading] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleListItem | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Load schedules
  const loadSchedules = useCallback(async () => {
    setLoading(true)
    try {
      // Load a large page size to get all schedules for calendar view
      const res = await scheduleService.getScheduleList(1, 1000)
      setSchedules(res.data.items || [])
    } catch (error) {
      toast({
        title: 'Không thể tải lịch tưới',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // Filter schedules by status
  const filteredSchedules = useMemo(() => {
    if (filterStatus === 'all') return schedules
    return schedules.filter(s => {
      const isActive = typeof s.status === 'number' ? s.status === 1 : s.status === 'ACTIVE'
      return filterStatus === 'active' ? isActive : !isActive
    })
  }, [schedules, filterStatus])

  // Get schedules for a specific date
  const getSchedulesForDate = useCallback((date: Date): ScheduleListItem[] => {
    return filteredSchedules.filter(s => {
      const start = new Date(s.startDate)
      const end = new Date(s.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return start <= date && date <= end
    })
  }, [filteredSchedules])

  // Calculate schedule density for a date
  const getScheduleDensity = useCallback((date: Date): number => {
    const daySchedules = getSchedulesForDate(date)
    return daySchedules.length
  }, [getSchedulesForDate])

  // Get schedules for current view period
  const getViewSchedules = useMemo(() => {
    if (viewMode === 'day') {
      return getSchedulesForDate(selectedDate)
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
      return weekDays.flatMap(day => getSchedulesForDate(day))
    } else {
      // Month view - return all schedules in the month
      const monthStart = startOfMonth(selectedDate)
      const monthEnd = endOfMonth(selectedDate)
      const allSchedules = filteredSchedules.filter(s => {
        const start = new Date(s.startDate)
        const end = new Date(s.endDate)
        return (start <= monthEnd && end >= monthStart)
      })
      return allSchedules
    }
  }, [viewMode, selectedDate, getSchedulesForDate, filteredSchedules])

  // Statistics
  const stats = useMemo(() => {
    const active = filteredSchedules.filter(s => {
      const isActive = typeof s.status === 'number' ? s.status === 1 : s.status === 'ACTIVE'
      return isActive
    }).length
    const todaySchedules = getSchedulesForDate(new Date())
    const upcoming = filteredSchedules.filter(s => {
      const start = new Date(s.startDate)
      return start > new Date()
    }).length

    return {
      total: filteredSchedules.length,
      active,
      inactive: filteredSchedules.length - active,
      today: todaySchedules.length,
      upcoming,
    }
  }, [filteredSchedules, getSchedulesForDate])

  // Handle date selection
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
    if (viewMode === 'day') {
      const daySchedules = getSchedulesForDate(date)
      if (daySchedules.length > 0) {
        setSelectedSchedule(daySchedules[0])
        setShowDetailPanel(true)
      }
    }
  }, [viewMode, getSchedulesForDate])

  // Navigate view
  const navigateView = useCallback((direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1))
    } else if (viewMode === 'week') {
      setSelectedDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1))
    } else {
      setSelectedDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
    }
  }, [viewMode])

  // Custom tile content for calendar
  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    const density = getScheduleDensity(date)
    const daySchedules = getSchedulesForDate(date)
    const activeCount = daySchedules.filter(s => {
      const isActive = typeof s.status === 'number' ? s.status === 1 : s.status === 'ACTIVE'
      return isActive
    }).length

    if (density === 0) return null

    return (
      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {Array.from({ length: Math.min(density, 5) }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                idx < activeCount ? "bg-green-500" : "bg-gray-400"
              )}
            />
          ))}
          {density > 5 && (
            <span className="text-[10px] text-muted-foreground ml-1">+{density - 5}</span>
          )}
        </div>
        {daySchedules.length > 0 && (
          <div className="text-[10px] text-muted-foreground truncate">
            {daySchedules[0].cropView?.cropName || 'Lịch tưới'}
          </div>
        )}
      </div>
    )
  }, [getScheduleDensity, getSchedulesForDate])

  // Custom tile className for density visualization
  const tileClassName = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    
    const density = getScheduleDensity(date)
    const isSelected = isSameDay(date, selectedDate)
    const isCurrentMonth = isSameMonth(date, selectedDate)
    const isTodayDate = isToday(date)
    const daySchedules = getSchedulesForDate(date)
    const hasActive = daySchedules.some(s => {
      const isActive = typeof s.status === 'number' ? s.status === 1 : s.status === 'ACTIVE'
      return isActive
    })

    return cn(
      "relative transition-all",
      !isCurrentMonth && "text-muted-foreground opacity-40",
      isTodayDate && !isSelected && "bg-primary/5 border-2 border-primary",
      isSelected && "bg-primary/10 border-2 border-primary shadow-md",
      !isSelected && !isTodayDate && "border border-transparent hover:border-border hover:bg-accent/30",
      density > 0 && hasActive && density <= 2 && "bg-green-50/20",
      density > 2 && hasActive && density <= 5 && "bg-green-100/30",
      density > 5 && hasActive && "bg-green-200/40"
    )
  }, [selectedDate, getScheduleDensity, getSchedulesForDate])

  // Handle schedule click
  const handleScheduleClick = useCallback((schedule: ScheduleListItem) => {
    setSelectedSchedule(schedule)
    setShowDetailPanel(true)
  }, [])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with Stats and Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Lịch tưới</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trung tâm điều phối vận hành theo thời gian
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterStatus(filterStatus === 'all' ? 'active' : filterStatus === 'active' ? 'inactive' : 'all')}
            >
              {filterStatus === 'all' ? 'Tất cả' : filterStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}
            </Button>
            <Button variant="outline" size="sm" onClick={loadSchedules}>
              Làm mới
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tổng lịch</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Hoạt động</p>
                <p className="text-2xl font-semibold text-green-600">{stats.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Hôm nay</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.today}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sắp tới</p>
                <p className="text-2xl font-semibold text-orange-600">{stats.upcoming}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tạm dừng</p>
                <p className="text-2xl font-semibold text-gray-600">{stats.inactive}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Panel - Takes 2 columns on large screens */}
        <div className={cn(
          "lg:col-span-2 space-y-4",
          showDetailPanel && "lg:col-span-2"
        )}>
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Tháng
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Tuần
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Ngày
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateView('prev')}>
                ‹
              </Button>
              <div className="text-sm font-medium min-w-[200px] text-center">
                {viewMode === 'month' && format(selectedDate, 'MMMM yyyy', { locale: vi })}
                {viewMode === 'week' && `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM', { locale: vi })} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM yyyy', { locale: vi })}`}
                {viewMode === 'day' && format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigateView('next')}>
                ›
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                Hôm nay
              </Button>
            </div>
          </div>

          {/* Calendar Component */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {viewMode === 'month' ? (
                <div className="react-calendar-wrapper">
                  <Calendar
                    onChange={(value) => handleDateChange(value as Date)}
                    value={selectedDate}
                    locale="vi"
                    className="w-full border-0"
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    formatShortWeekday={(_locale, date) => format(date, 'EEE', { locale: vi }).slice(0, 1)}
                  />
                </div>
              ) : viewMode === 'week' ? (
                <WeekView
                  selectedDate={selectedDate}
                  schedules={getViewSchedules}
                  onDateClick={handleDateChange}
                  onScheduleClick={handleScheduleClick}
                />
              ) : (
                <DayView
                  selectedDate={selectedDate}
                  schedules={getViewSchedules}
                  onScheduleClick={handleScheduleClick}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel - Takes 1 column on large screens */}
        {showDetailPanel && selectedSchedule && (
          <div className="lg:col-span-1">
            <ScheduleDetailPanel
              schedule={selectedSchedule}
              onClose={() => {
                setShowDetailPanel(false)
                setSelectedSchedule(null)
              }}
            />
          </div>
        )}
      </div>

      {/* Global Styles for react-calendar */}
      <style>{`
        .react-calendar {
          border: none;
          font-family: inherit;
          width: 100%;
          background: transparent;
        }
        .react-calendar__navigation {
          display: none;
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          padding-bottom: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }
        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
        }
        .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          border-radius: 0.5rem;
          margin: 0;
          height: auto;
          min-height: 90px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          position: relative;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .react-calendar__tile--active {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border-color: hsl(var(--primary));
        }
        .react-calendar__tile:hover {
          background: hsl(var(--accent));
          border-color: hsl(var(--border));
        }
        .react-calendar__tile--now {
          background: hsl(var(--primary) / 0.05);
          border: 2px solid hsl(var(--primary));
        }
        .react-calendar__tile abbr {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        .react-calendar-wrapper {
          width: 100%;
        }
      `}</style>
    </div>
  )
}

// Week View Component
interface WeekViewProps {
  selectedDate: Date
  schedules: ScheduleListItem[]
  onDateClick: (date: Date) => void
  onScheduleClick: (schedule: ScheduleListItem) => void
}

function WeekView({ selectedDate, schedules, onDateClick, onScheduleClick }: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  })

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(s => {
      const start = new Date(s.startDate)
      const end = new Date(s.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return start <= day && day <= end
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const daySchedules = getSchedulesForDay(day)
          const isTodayDate = isToday(day)
          const isSelected = isSameDay(day, selectedDate)

          return (
            <div
              key={idx}
              className={cn(
                "border rounded-lg p-3 min-h-[120px] cursor-pointer transition-colors",
                isTodayDate && "bg-primary/5 border-primary border-2",
                isSelected && "bg-primary/10 border-primary",
                !isSelected && !isTodayDate && "border-border hover:bg-accent/50"
              )}
              onClick={() => onDateClick(day)}
            >
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {format(day, 'EEE', { locale: vi })}
              </div>
              <div className="text-lg font-semibold mb-2">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {daySchedules.slice(0, 3).map(schedule => {
                  const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'
                  return (
                    <div
                      key={schedule.scheduleId || `${schedule.farmId}-${schedule.cropId}`}
                      className={cn(
                        "text-xs p-1.5 rounded cursor-pointer truncate",
                        isActive ? "bg-green-100 text-green-900 hover:bg-green-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onScheduleClick(schedule)
                      }}
                      title={schedule.cropView?.cropName || `Lịch #${schedule.scheduleId}`}
                    >
                      {schedule.cropView?.cropName || `Lịch #${schedule.scheduleId}`}
                    </div>
                  )
                })}
                {daySchedules.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{daySchedules.length - 3} khác
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Day View Component
interface DayViewProps {
  selectedDate: Date
  schedules: ScheduleListItem[]
  onScheduleClick: (schedule: ScheduleListItem) => void
}

function DayView({ selectedDate, schedules, onScheduleClick }: DayViewProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground mb-4">
        {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
      </div>
      {schedules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Không có lịch tưới trong ngày này</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(schedule => {
            const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'
            return (
              <Card
                key={schedule.scheduleId || `${schedule.farmId}-${schedule.cropId}`}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onScheduleClick(schedule)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={isActive ? 'success' : 'destructive'} className="text-xs">
                          {isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                        <span className="text-sm font-semibold">
                          {schedule.cropView?.cropName || `Lịch #${schedule.scheduleId}`}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          {schedule.farmView?.farmName || 'Nông trại không xác định'}
                        </div>
                        <div>
                          {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                        </div>
                        {schedule.staffName && (
                          <div>
                            {schedule.staffName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Schedule Detail Panel
interface ScheduleDetailPanelProps {
  schedule: ScheduleListItem
  onClose: () => void
}

function ScheduleDetailPanel({ schedule, onClose }: ScheduleDetailPanelProps) {
  const isActive = typeof schedule.status === 'number' ? schedule.status === 1 : schedule.status === 'ACTIVE'

  return (
    <Card className="border-0 shadow-lg h-full sticky top-6">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Chi tiết lịch</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={isActive ? 'success' : 'destructive'}>
              {isActive ? 'Hoạt động' : 'Tạm dừng'}
            </Badge>
            <h4 className="text-base font-semibold">
              {schedule.cropView?.cropName || `Lịch #${schedule.scheduleId}`}
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Thời gian</p>
            <p className="text-sm font-medium">
              {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
            </p>
          </div>

          {schedule.farmView && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nông trại</p>
              <p className="text-sm font-medium">{schedule.farmView.farmName}</p>
              {schedule.farmView.location && (
                <p className="text-xs text-muted-foreground mt-1">{schedule.farmView.location}</p>
              )}
            </div>
          )}

          {schedule.staffName && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nhân viên</p>
              <p className="text-sm font-medium">{schedule.staffName}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">Số lượng</p>
            <p className="text-sm font-medium">{schedule.quantity} cây</p>
          </div>

          {schedule.currentPlantStage && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Giai đoạn hiện tại</p>
              <p className="text-sm font-medium">{schedule.currentPlantStage}</p>
            </div>
          )}

          {schedule.diseaseStatus !== null && schedule.diseaseStatus !== undefined && schedule.diseaseStatus >= 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tình trạng bệnh</p>
              <p className="text-sm font-medium">
                {schedule.diseaseStatus === -1 ? 'Không có bệnh' : `Bệnh #${schedule.diseaseStatus}`}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-1">Tạo lúc</p>
            <p className="text-sm font-medium">{formatDateTime(schedule.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

