import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { scheduleService, type ScheduleListItem, type ScheduleStatusString } from '@/shared/api/scheduleService'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'
import { Label } from '@/shared/ui/label'
import { Loader2, RefreshCw } from 'lucide-react'
import { handleFetchError } from '@/shared/lib/error-handler'

interface StaffScheduleBoardProps {
    className?: string
}

const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)

const statusLabelMap: Record<ScheduleStatusString | number, string> = {
    ACTIVE: 'Hoạt động',
    DEACTIVATED: 'Vô hiệu hóa',
    1: 'Hoạt động',
    0: 'Vô hiệu hóa',
}

const getStatusLabel = (status: ScheduleListItem['status']) => {
    if (typeof status === 'string') {
        return statusLabelMap[status as ScheduleStatusString] ?? status
    }
    return statusLabelMap[status] ?? String(status)
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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-3">Nông trại</th>
                                <th className="py-2 pr-3">Cây trồng</th>
                                <th className="py-2 pr-3">Bắt đầu</th>
                                <th className="py-2 pr-3">Kết thúc</th>
                                <th className="py-2 pr-3">Gieo trồng</th>
                                <th className="py-2 pr-3">Thu hoạch</th>
                                <th className="py-2 pr-3">Hoạt động</th>
                                <th className="py-2 pr-3">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSchedules.map(schedule => (
                                <tr key={schedule.scheduleId ?? `${schedule.farmId}-${schedule.startDate}`} className="border-b last:border-0">
                                    <td className="py-2 pr-3">{schedule.farmView?.farmName ?? `#${schedule.farmId}`}</td>
                                    <td className="py-2 pr-3">{schedule.cropView?.cropName ?? `#${schedule.cropId}`}</td>
                                    <td className="py-2 pr-3">{schedule.startDate}</td>
                                    <td className="py-2 pr-3">{schedule.endDate}</td>
                                    <td className="py-2 pr-3">{schedule.plantingDate ?? '-'}</td>
                                    <td className="py-2 pr-3">{schedule.harvestDate ?? '-'}</td>
                                    <td className="py-2 pr-3">{schedule.farmActivityView?.activityType ?? (schedule.farmActivitiesId ? `#${schedule.farmActivitiesId}` : '-')}</td>
                                    <td className="py-2 pr-3">
                                        <Badge variant={isActiveStatus(schedule.status) ? 'success' : 'secondary'}>{getStatusLabel(schedule.status)}</Badge>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredSchedules.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                                        Không có lịch trong tháng này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {loading && (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang tải dữ liệu...
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

