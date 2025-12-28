import { useEffect, useState, useCallback } from 'react'
import { normalizeError, mapErrorToVietnamese } from '@/shared/lib/error-handler'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/irrigation/ui/BackendScheduleList'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { scheduleService, type PaginatedSchedules, type ScheduleListItem } from '@/shared/api/scheduleService'
import { useToast } from '@/shared/ui/use-toast'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'

const BULK_PAGE_SIZE = 50

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
      const normalized = normalizeError(e)
      const display = normalized.backendMessage ?? mapErrorToVietnamese(e).vietnamese
      toast({
        title: 'Không thể tải danh sách lịch',
        description: display,
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
          <ManagementPageHeader
            title="Quản lý lịch tưới"
            description="Quản lý và lập lịch tưới nước"
            actions={
              <Button onClick={handleRefresh} variant="outline">
                Làm mới
              </Button>
            }
          />

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 items-stretch">
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
                    <p className="text-sm text-gray-500">Hoạt động</p>
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
                    <p className="text-sm text-gray-500">Vô hiệu hóa</p>
                    <p className="text-2xl font-semibold mt-1 text-red-600">{stats.inactive}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Các lịch tưới đã bị vô hiệu hóa
                </p>
              </CardContent>
            </Card>
          </div>
          { }
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsContent value="calendar" className="space-y-6">
              <BackendScheduleList
                showCreate={showCreate}
                onShowCreateChange={setShowCreate}
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
