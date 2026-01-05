import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
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
import { useSeasonStore } from '@/features/season'
import type { SeasonSchedule } from '@/shared/lib/localData'
import { withBackendToast } from '@/shared/lib/backend-toast'
import { formatTime } from '@/shared/lib/localData/storage'
import { ScheduleForm } from './ScheduleForm'

interface ScheduleCalendarProps {
    className?: string
    showScheduleForm?: boolean
    onShowScheduleFormChange?: (show: boolean) => void
}

export function ScheduleCalendar({ className, showScheduleForm: externalShowScheduleForm, onShowScheduleFormChange }: ScheduleCalendarProps) {
    const { schedules, loadingStates, deleteSchedule, toggleSchedule } = useSeasonStore()
    const [selectedDate, setSelectedDate] = React.useState(new Date())
    const [internalShowScheduleForm, setInternalShowScheduleForm] = React.useState(false)
    const [editingSchedule, setEditingSchedule] = React.useState<SeasonSchedule | null>(null)

    const showScheduleForm = externalShowScheduleForm !== undefined ? externalShowScheduleForm : internalShowScheduleForm
    const setShowScheduleForm = onShowScheduleFormChange || setInternalShowScheduleForm

    const handleDeleteSchedule = async (schedule: SeasonSchedule) => {
        try {
            await withBackendToast(
                () => deleteSchedule(schedule.id),
                {
                }
            )
        } catch (error) {
        }
    }

    const handleToggleSchedule = async (schedule: SeasonSchedule) => {
        try {
            await withBackendToast(
                () => toggleSchedule(schedule.id, !schedule.enabled),
                {
                }
            )
        } catch (error) {
        }
    }

    const handleEditSchedule = (schedule: SeasonSchedule) => {
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

    const getSchedulesForDate = (_date: Date) => {
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
                    <h3 className="text-lg font-semibold mb-2">Không có thời vụ</h3>
                    <p className="text-muted-foreground mb-6">
                        Bắt đầu bằng cách tạo thời vụ đầu tiên của bạn.
                    </p>
                    <Button onClick={() => setShowScheduleForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo thời vụ
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
            <div className="grid gap-6 lg:grid-cols-3">
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
                            <div className="text-sm text-muted-foreground">[Lưới lịch (calendar) tạm]</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thời vụ hôm nay</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todaySchedules.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Hôm nay không có thời vụ</p>
                            ) : (
                                <div className="space-y-3">
                                    {todaySchedules.map(schedule => (
                                        <div key={schedule.id} className="p-3 border rounded-lg bg-card">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-medium">{schedule.title}</h4>
                                                    <p className="text-sm text-muted-foreground">Thiết bị: {schedule.deviceId}</p>
                                                </div>
                                                <Badge variant={schedule.enabled ? 'success' : 'destructive'} className="text-xs">
                                                    {schedule.status}
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
                                                <Button size="sm" variant="outline" onClick={() => handleEditSchedule(schedule)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleToggleSchedule(schedule)} className={schedule.enabled ? '' : 'text-muted-foreground'}>
                                                    {schedule.enabled ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDeleteSchedule(schedule)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Sắp diễn ra</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcomingSchedules.map(schedule => (
                                    <div key={schedule.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                        <div>
                                            <p className="font-medium text-sm">{schedule.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTime(schedule.nextRun)} • {schedule.recurrenceText}
                                            </p>
                                        </div>
                                        <Badge variant={schedule.enabled ? 'success' : 'destructive'} className="text-xs">
                                            {schedule.status}
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

export default ScheduleCalendar


