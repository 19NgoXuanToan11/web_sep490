import { Card, CardContent } from '@/shared/ui/card'
import { useScheduleData } from '@/features/season/ui/hooks/useScheduleData'

type Props = {
    onFilterActive?: () => void
    onFilterDeactivated?: () => void
    onFilterOverdue?: () => void
    onFilterMissingLogs?: () => void
    onFilterTotal?: () => void
}

export default function ManagerOverview({ onFilterActive, onFilterDeactivated, onFilterOverdue, onFilterMissingLogs, onFilterTotal }: Props) {
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

    const overdue = all.filter(s => {
        try {
            const end = s.endDate ? new Date(s.endDate) : null
            if (!end || Number.isNaN(end.getTime())) return false
            const diff = Math.ceil((new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return diff < 0
        } catch {
            return false
        }
    }).length

    const missingLogs = all.filter(s => {
        const lastLog = (s as any).lastLogDate ?? (s as any).lastLogAt ?? (s as any).last_crop_log_date ?? (s as any).lastLogCreatedAt
        if (!lastLog) return true
        try {
            const last = new Date(lastLog)
            if (Number.isNaN(last.getTime())) return true
            const diffDays = Math.floor((today.getTime() - new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()) / (1000 * 60 * 60 * 24))
            return diffDays >= 3
        } catch {
            return true
        }
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


