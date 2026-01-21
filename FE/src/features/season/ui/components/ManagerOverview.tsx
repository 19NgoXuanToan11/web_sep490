import { Card, CardContent } from '@/shared/ui/card'
import { useScheduleData } from '@/features/season/ui/hooks/useScheduleData'
import type { ScheduleListItem } from '@/shared/api/scheduleService'

type Props = {
    onFilterActive?: () => void
    onFilterDeactivated?: () => void
    onFilterTotal?: () => void
    onFilterCompleted?: () => void
}

export default function ManagerOverview({ onFilterActive, onFilterDeactivated, onFilterTotal, onFilterCompleted }: Props) {
    const scheduleData = useScheduleData()
    const all = scheduleData.allSchedules ?? []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const active = all.filter((s: ScheduleListItem) => {
        const st = s?.status
        if (typeof st === 'number') return st === 1
        return String(st ?? '').toUpperCase() === 'ACTIVE'
    }).length

    const completed = all.filter((s: ScheduleListItem) => {
        const st = s?.status
        if (typeof st === 'number') return st === 2
        return String(st ?? '').toUpperCase() === 'COMPLETED'
    }).length

    const deactivated = all.filter((s: ScheduleListItem) => {
        const st = s?.status
        if (typeof st === 'number') return st === 0
        return String(st ?? '').toUpperCase() === 'DEACTIVATED'
    }).length

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card onClick={() => onFilterTotal ? onFilterTotal() : undefined} className="cursor-pointer">
                <CardContent className="p-4">
                    <div>
                        <p className="text-sm text-gray-500">Tổng thời vụ</p>
                        <p className="text-2xl font-bold text-blue-600">{all.length}</p>
                        <p className="text-xs text-gray-400 mt-1">Tổng số thời vụ</p>
                    </div>
                </CardContent>
            </Card>
            <Card onClick={() => onFilterActive ? onFilterActive() : undefined} className="cursor-pointer">
                <CardContent className="p-4">
                    <div>
                        <p className="text-sm text-gray-500">Đang hoạt động</p>
                        <p className="text-2xl font-bold text-yellow-500">{active}</p>
                        <p className="text-xs text-gray-400 mt-1">Số thời vụ đang hoạt động</p>
                    </div>
                </CardContent>
            </Card>
            <Card onClick={() => (typeof (onFilterCompleted) === 'function' ? onFilterCompleted() : undefined)} className="cursor-pointer">
                <CardContent className="p-4">
                    <div>
                        <p className="text-sm text-gray-500">Hoàn thành</p>
                        <p className="text-2xl font-bold text-teal-600">{completed}</p>
                        <p className="text-xs text-gray-400 mt-1">Số thời vụ đã hoàn thành</p>
                    </div>
                </CardContent>
            </Card>

            <Card onClick={() => onFilterDeactivated ? onFilterDeactivated() : undefined} className="cursor-pointer">
                <CardContent className="p-4">
                    <div>
                        <p className="text-sm text-gray-500">Vô hiệu hóa</p>
                        <p className="text-2xl font-bold text-orange-500">{deactivated}</p>
                        <p className="text-xs text-gray-400 mt-1">Số thời vụ đã vô hiệu hóa</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


