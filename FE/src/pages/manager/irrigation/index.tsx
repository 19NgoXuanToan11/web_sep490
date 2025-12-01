import { useEffect, useState } from 'react'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/irrigation/ui/BackendScheduleList'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Droplets, CalendarRange, CheckCircle2, Clock3 } from 'lucide-react'
import { scheduleService, type PaginatedSchedules } from '@/shared/api/scheduleService'
import { useToast } from '@/shared/ui/use-toast'

export default function IrrigationPage() {
  const selectedTab = 'calendar'
  const handleTabChange = (_tab: string) => { }
  const [showCreate, setShowCreate] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    upcoming: 0,
    ongoing: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Lấy một trang lớn để có cái nhìn tổng quan chính xác nhất có thể
        const res: PaginatedSchedules = await scheduleService.getScheduleList(1, 1000)
        const items = res.data.items || []
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const total = res.data.totalItemCount || items.length
        const activeItems = items.filter(it => it.status === 1 || it.status === 'ACTIVE')
        const inactiveItems = items.filter(it => it.status === 0 || it.status === 'DEACTIVATED')

        const upcoming = items.filter(it => {
          const start = new Date(it.startDate)
          return !Number.isNaN(start.getTime()) && start > now
        }).length

        const ongoing = items.filter(it => {
          const start = new Date(it.startDate)
          const end = new Date(it.endDate)
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
          return start <= now && now <= end
        }).length

        setStats({
          total,
          active: activeItems.length,
          inactive: inactiveItems.length,
          upcoming,
          ongoing,
        })
      } catch (error) {
        toast({
          title: 'Không thể tải thống kê lịch tưới',
          description: 'Vẫn có thể sử dụng danh sách lịch, nhưng số liệu tổng quan chưa được cập nhật.',
          variant: 'destructive',
        })
      }
    }

    loadStats()
  }, [toast])

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          { }
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý tưới nước</h1>
                <p>Quản lý và lập lịch tưới nước</p>
              </div>
              <Button size="sm" onClick={() => setShowCreate(true)}>Tạo lịch mới</Button>
            </div>
          </div>

          { }
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng lịch tưới</p>
                    <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    <Droplets className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tất cả lịch tưới đã được tạo trong hệ thống
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đang hoạt động</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">{stats.active}</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Lịch tưới ở trạng thái hoạt động/được sử dụng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sắp tới</p>
                    <p className="text-2xl font-semibold mt-1 text-emerald-600">{stats.upcoming}</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Lịch tưới có ngày bắt đầu sau hôm nay
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
                  <div className="rounded-full bg-orange-100 p-3 text-orange-600">
                    <Clock3 className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Hôm nay nằm trong khoảng thời gian của lịch
                </p>
              </CardContent>
            </Card>
          </div>

          { }
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsContent value="calendar" className="space-y-6">
              <BackendScheduleList showCreate={showCreate} onShowCreateChange={setShowCreate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ManagerLayout>
  )
}
