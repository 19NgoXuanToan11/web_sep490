import React, { useEffect, useState } from 'react'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { StaffScheduleBoard } from '@/features/irrigation/ui/StaffScheduleBoard'
import { Card, CardContent } from '@/shared/ui/card'
import { scheduleService, type ScheduleListItem } from '@/shared/api/scheduleService'
import { useToast } from '@/shared/ui/use-toast'

const StaffOperationsPage: React.FC = () => {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    ongoing: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const currentMonth = new Date().getMonth() + 1
        const res = await scheduleService.getSchedulesByStaff(currentMonth)
        const items: ScheduleListItem[] = res.data ?? []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const total = items.length
        const active = items.filter(it => it.status === 1 || it.status === 'ACTIVE').length

        const upcoming = items.filter(it => {
          const start = new Date(it.startDate)
          return !Number.isNaN(start.getTime()) && start > today
        }).length

        const ongoing = items.filter(it => {
          const start = new Date(it.startDate)
          const end = new Date(it.endDate)
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
          return start <= today && today <= end
        }).length

        setStats({ total, active, upcoming, ongoing })
      } catch {
        toast({
          title: 'Không thể tải thống kê lịch công việc',
          description: 'Bạn vẫn có thể xem bảng lịch chi tiết bên dưới.',
          variant: 'destructive',
        })
      }
    }

    loadStats()
  }, [toast])

  return (
    <StaffLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lịch công việc</h1>
            <p className="text-muted-foreground">Theo dõi các lịch tưới và hoạt động được giao.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng lịch trong tháng</p>
                    <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Số lịch tưới và công việc được giao cho bạn trong tháng hiện tại
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Lịch hoạt động</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">{stats.active}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Lịch đang ở trạng thái hoạt động (ACTIVE)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sắp tới</p>
                    <p className="text-2xl font-semibold mt-1 text-blue-600">{stats.upcoming}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Lịch có ngày bắt đầu sau hôm nay
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đang diễn ra</p>
                    <p className="text-2xl font-semibold mt-1 text-orange-600">{stats.ongoing}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Hôm nay nằm trong khoảng thời gian thực hiện lịch
                </p>
              </CardContent>
            </Card>
          </div>

          <StaffScheduleBoard />
        </div>
      </div>
    </StaffLayout>
  )
}

export default StaffOperationsPage
