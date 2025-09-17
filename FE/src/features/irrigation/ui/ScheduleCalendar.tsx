import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
import {
  Calendar,
  Clock,
  Droplets,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'
import type { IrrigationSchedule } from '@/shared/lib/localData'
import { formatTime, isToday } from '@/shared/lib/localData/storage'
import { ScheduleForm } from './ScheduleForm'

interface ScheduleCalendarProps {
  className?: string
}

export function ScheduleCalendar({ className }: ScheduleCalendarProps) {
  const { schedules, devices, loadingStates, deleteSchedule, toggleSchedule } = useIrrigationStore()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = React.useState(new Date())
  const [showScheduleForm, setShowScheduleForm] = React.useState(false)
  const [editingSchedule, setEditingSchedule] = React.useState<IrrigationSchedule | null>(null)

  const handleDeleteSchedule = async (schedule: IrrigationSchedule) => {
    try {
      await deleteSchedule(schedule.id)
      toast({
        title: 'Đã xóa lịch',
        description: `"${schedule.title}" đã được xóa thành công.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Xóa thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleSchedule = async (schedule: IrrigationSchedule) => {
    try {
      await toggleSchedule(schedule.id, !schedule.enabled)
      toast({
        title: 'Đã cập nhật lịch',
        description: `"${schedule.title}" đã được ${!schedule.enabled ? 'kích hoạt' : 'tắt'}.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Cập nhật thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    }
  }

  const handleEditSchedule = (schedule: IrrigationSchedule) => {
    setEditingSchedule(schedule)
    setShowScheduleForm(true)
  }

  const handleCloseForm = () => {
    setShowScheduleForm(false)
    setEditingSchedule(null)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  const getSchedulesForDate = (date: Date) => {
    // For this demo, we'll show all schedules that are enabled and recurring
    // In a real app, this would filter by actual schedule dates
    return schedules.filter(schedule => schedule.enabled)
  }

  const todaySchedules = getSchedulesForDate(new Date())
  const upcomingSchedules = schedules
    .filter(schedule => schedule.enabled)
    .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())
    .slice(0, 5)

  if (!schedules.length && !loadingStates['create-schedule']?.isLoading) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không có lịch tưới</h3>
          <p className="text-muted-foreground mb-6">
            Bắt đầu bằng cách tạo lịch tưới đầu tiên của bạn.
          </p>
          <Button onClick={() => setShowScheduleForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo lịch tưới
          </Button>
        </div>

        <ScheduleForm
          open={showScheduleForm}
          onOpenChange={setShowScheduleForm}
          editingSchedule={editingSchedule}
          onClose={handleCloseForm}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Lịch tưới</h2>
          <p className="text-muted-foreground">Quản lý các lịch tưới nước của bạn</p>
        </div>
        <Button onClick={() => setShowScheduleForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Lịch mới
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CalendarGrid
                selectedDate={selectedDate}
                schedules={schedules}
                onEditSchedule={handleEditSchedule}
              />
            </CardContent>
          </Card>
        </div>

        {/* Schedule List */}
        <div className="space-y-6">
          {/* Today's Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lịch hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Hôm nay không có lịch</p>
              ) : (
                <div className="space-y-3">
                  {todaySchedules.map(schedule => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      devices={devices}
                      onEdit={() => handleEditSchedule(schedule)}
                      onDelete={() => handleDeleteSchedule(schedule)}
                      onToggle={() => handleToggleSchedule(schedule)}
                      loading={loadingStates[`update-schedule-${schedule.id}`]?.isLoading}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sắp diễn ra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <div>
                      <p className="font-medium text-sm">{schedule.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(schedule.nextRun)} • {schedule.recurrenceText}
                      </p>
                    </div>
                    <Badge variant={schedule.enabled ? 'success' : 'secondary'} className="text-xs">
                      {schedule.status === 'Running'
                        ? 'Đang chạy'
                        : schedule.status === 'Scheduled'
                          ? 'Đã lên lịch'
                          : schedule.status === 'Paused'
                            ? 'Tạm dừng'
                            : schedule.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleForm
        open={showScheduleForm}
        onOpenChange={setShowScheduleForm}
        editingSchedule={editingSchedule}
        onClose={handleCloseForm}
      />
    </div>
  )
}

interface CalendarGridProps {
  selectedDate: Date
  schedules: IrrigationSchedule[]
  onEditSchedule: (schedule: IrrigationSchedule) => void
}

function CalendarGrid({ selectedDate, schedules, onEditSchedule }: CalendarGridProps) {
  // Simple calendar grid implementation
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
  const startOfWeek = new Date(startOfMonth)
  startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay())

  const days = []
  const currentDate = new Date(startOfWeek)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
          const isTodayDate = isToday(day)
          const daySchedules = schedules.filter(schedule => schedule.enabled).slice(0, 2) // Show max 2 per day for demo

          return (
            <div
              key={index}
              className={`min-h-[80px] p-1 border rounded ${
                isCurrentMonth ? 'bg-background' : 'bg-muted/30'
              } ${isTodayDate ? 'bg-primary/5 border-primary' : ''}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? '' : 'text-muted-foreground'
                } ${isTodayDate ? 'text-primary' : ''}`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {daySchedules.map((schedule, idx) => (
                  <div
                    key={schedule.id}
                    className="text-xs p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                    onClick={() => onEditSchedule(schedule)}
                    title={schedule.title}
                  >
                    {schedule.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ScheduleCardProps {
  schedule: IrrigationSchedule
  devices: any[]
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  loading?: boolean
}

function ScheduleCard({
  schedule,
  devices,
  onEdit,
  onDelete,
  onToggle,
  loading,
}: ScheduleCardProps) {
  const device = devices.find(d => d.id === schedule.deviceId)

  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium">{schedule.title}</h4>
          <p className="text-sm text-muted-foreground">
            {device?.name || 'Thiết bị không xác định'}
          </p>
        </div>
        <Badge variant={schedule.enabled ? 'success' : 'secondary'} className="text-xs">
          {schedule.status === 'Running'
            ? 'Đang chạy'
            : schedule.status === 'Scheduled'
              ? 'Đã lên lịch'
              : schedule.status === 'Paused'
                ? 'Tạm dừng'
                : schedule.status}
        </Badge>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
        </div>
        <div className="flex items-center gap-2">
          <Droplets className="h-3 w-3" />
          {schedule.moistureThresholdPct}% ngưỡng
        </div>
        <p className="text-xs">{schedule.recurrenceText}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} disabled={loading}>
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggle}
          disabled={loading}
          className={schedule.enabled ? '' : 'text-muted-foreground'}
        >
          {schedule.enabled ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete} disabled={loading}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
