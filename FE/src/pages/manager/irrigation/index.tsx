import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/irrigation/ui/BackendScheduleList'
import { NewIrrigationCalendar } from '@/features/irrigation/ui/NewIrrigationCalendar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { scheduleService, type PaginatedSchedules, type ScheduleListItem } from '@/shared/api/scheduleService'
import { useToast } from '@/shared/ui/use-toast'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'

const BULK_PAGE_SIZE = 50

export default function IrrigationPage() {
  const [selectedTab, setSelectedTab] = useState('calendar')
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
  }
  const [showCreate, setShowCreate] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    upcoming: 0,
    ongoing: 0,
  })
  const { toast } = useToast()

  const [staffFilter, setStaffFilter] = useState<number | null>(null)
  const [filteredItems, setFilteredItems] = useState<ScheduleListItem[] | null>(null)
  const [, setAllSchedules] = useState<ScheduleListItem[]>([])
  const [, setAllSchedulesLoading] = useState(false)

  const loadAllSchedules = useCallback(async (): Promise<ScheduleListItem[]> => {
    setAllSchedulesLoading(true)
    try {
      const first = await scheduleService.getScheduleList(1, BULK_PAGE_SIZE)
      let items = [...first.data.items]
      const totalPages = first.data.totalPagesCount
      if (totalPages > 1) {
        const requests: Promise<PaginatedSchedules>[] = []
        for (let page = 2; page <= totalPages; page++) {
          requests.push(scheduleService.getScheduleList(page, BULK_PAGE_SIZE))
        }
        const results = await Promise.all(requests)
        results.forEach(res => {
          items = items.concat(res.data.items)
        })
      }
      setAllSchedules(items)
      return items
    } catch (e) {
      toast({
        title: 'Không thể tải danh sách lịch',
        description: (e as Error).message,
        variant: 'destructive',
      })
      return []
    } finally {
      setAllSchedulesLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadAllSchedules()
  }, [loadAllSchedules])

  const loadStats = useCallback(async () => {
    try {
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
  }, [toast])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleRefresh = useCallback(async () => {
    await loadStats()
    await loadAllSchedules()
    toast({
      title: 'Đã làm mới',
      description: 'Dữ liệu lịch tưới đã được cập nhật',
    })
  }, [loadStats, loadAllSchedules, toast])

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          { }
          <ManagementPageHeader
            title="Quản lý lịch tưới"
            description="Quản lý và lập lịch tưới nước"
            actions={
              <Button onClick={handleRefresh} variant="outline">
                Làm mới
              </Button>
            }
          />

          { }
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng lịch tưới</p>
                    <p className="text-2xl font-semibold mt-1">{stats.total}</p>
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
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Hôm nay nằm trong khoảng thời gian của lịch
                </p>
              </CardContent>
            </Card>
          </div>

          { }
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="calendar">Lịch</TabsTrigger>
              <TabsTrigger value="list">Danh sách</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="space-y-6">
              <NewIrrigationCalendar />
            </TabsContent>
            <TabsContent value="list" className="space-y-6 mt-6">
              <BackendScheduleList
                showCreate={showCreate}
                onShowCreateChange={setShowCreate}
                staffFilter={staffFilter}
                onStaffFilterChange={setStaffFilter}
                filteredItems={filteredItems}
                onFilteredItemsChange={setFilteredItems}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ManagerLayout>
  )
}
