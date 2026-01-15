import { Card, CardContent } from '@/shared/ui/card'
import { useScheduleData } from '@/features/season/ui/hooks/useScheduleData'

type Props = {
    onFilterActive?: () => void
    onFilterDeactivated?: () => void
    onFilterTotal?: () => void
}

export default function ManagerOverview({ onFilterActive, onFilterDeactivated, onFilterTotal }: Props) {
    const scheduleData = useScheduleData()
    const all = scheduleData.allSchedules ?? []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const active = all.filter(s => {
        const st = s?.status
        if (typeof st === 'number') return st === 1
        return String(st ?? '').toUpperCase() === 'ACTIVE'
    }).length

    const deactivated = all.filter(s => {
        const st = s?.status
        if (typeof st === 'number') return st !== 1
        return String(st ?? '').toUpperCase() !== 'ACTIVE'
    }).length

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                        <p className="text-2xl font-bold text-green-600">{active}</p>
                        <p className="text-xs text-gray-400 mt-1">Số thời vụ đang hoạt động</p>
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


