import { useCallback, useEffect, useMemo, useState } from 'react'
import { scheduleService, type ScheduleListItem } from '@/shared/api/scheduleService'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { Label } from '@/shared/ui/label'
import { Loader2, RefreshCw } from 'lucide-react'
import { handleFetchError } from '@/shared/lib/error-handler'
import { formatDate } from '@/shared/lib/date-utils'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'

interface StaffScheduleBoardProps {
    className?: string
}

const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)

const getPlantStageLabel = (stage?: string) => {
    if (!stage) return undefined
    const labels: Record<string, string> = {
        Germination: 'Gieo hạt',
        Seedling: 'Nảy mầm',
        Vegetative: 'Tăng trưởng lá',
        Flowering: 'Ra hoa',
        Harvest: 'Thu hoạch',
    }
    return labels[stage] ?? stage
}

const isActiveStatus = (status: ScheduleListItem['status']) => {
    if (typeof status === 'string') {
        return status === 'ACTIVE'
    }
    return status === 1
}

export function StaffScheduleBoard({ className }: StaffScheduleBoardProps) {
    const { toast } = useToast()
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'DEACTIVATED'>('all')
    const [loading, setLoading] = useState(false)
    const [schedules, setSchedules] = useState<ScheduleListItem[]>([])

    const load = useCallback(
        async (targetMonth: number) => {
            setLoading(true)
            try {
                const res = await scheduleService.getSchedulesByStaff(targetMonth)
                setSchedules(res.data ?? [])
            } catch (e) {
                handleFetchError(e, toast, 'lịch làm việc của bạn')
            } finally {
                setLoading(false)
            }
        },
        [toast]
    )

    useEffect(() => {
        load(month)
    }, [load, month])

    const filteredSchedules = useMemo(() => {
        if (statusFilter === 'all') return schedules
        return schedules.filter(schedule => {
            if (typeof schedule.status === 'string') {
                return schedule.status === statusFilter
            }
            return (statusFilter === 'ACTIVE' && schedule.status === 1) || (statusFilter === 'DEACTIVATED' && schedule.status === 0)
        })
    }, [schedules, statusFilter])

    const handleRefresh = () => load(month)

    const events = useMemo(() => {
        return filteredSchedules.map(s => {
            const cropName = s.cropView?.cropName ?? `Cây #${s.cropId ?? ''}`
            const farmName = s.farmView?.farmName ?? `Nông trại #${s.farmId ?? ''}`
            const stageLabel = getPlantStageLabel(s.currentPlantStage ?? s.cropView?.plantStage)
            let title = `${cropName} — ${farmName}`
            if (stageLabel) title += ` • ${stageLabel}`
            if (s.quantity) title += ` • ${s.quantity} cây`

            const start = s.startDate ? new Date(s.startDate) : undefined
            const end = s.endDate ? new Date(s.endDate) : undefined

            const color = isActiveStatus(s.status) ? '#16a34a'  : '#dc2626'

            return {
                id: String(s.scheduleId ?? `${s.farmId}-${s.startDate}`),
                title,
                start,
                end,
                allDay: true,
                backgroundColor: color,
                borderColor: color,
                extendedProps: { original: s },
            }
        })
    }, [filteredSchedules])

    const handleEventClick = (arg: any) => {
        const original: ScheduleListItem | undefined = arg.event.extendedProps?.original
        if (!original) return
        toast({
            title: original.farmView?.farmName ?? `Nông trại #${original.farmId}`,
            description: `${original.cropView?.cropName ?? `Cây #${original.cropId}`}\n${formatDate(original.startDate)} → ${formatDate(original.endDate)}`,
        })
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle>Lịch làm việc của tôi</CardTitle>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-1">
                            <Label>Tháng</Label>
                            <Select value={String(month)} onValueChange={value => setMonth(Number(value))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map(m => (
                                        <SelectItem key={m} value={String(m)}>
                                            Tháng {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label>Trạng thái</Label>
                            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'ACTIVE' | 'DEACTIVATED')}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                    <SelectItem value="DEACTIVATED">Vô hiệu hóa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            <span className="ml-2">Tải lại</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div>
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        locale={viLocale}
                        events={events}
                        eventClick={handleEventClick}
                        height="auto"
                    />
                </div>
                {loading && (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang tải dữ liệu...
                    </div>
                )}
                {!loading && filteredSchedules.length === 0 && (
                    <div className="py-6 text-center text-muted-foreground">Không có lịch trong tháng này.</div>
                )}
            </CardContent>
        </Card>
    )
}

