import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/season'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { scheduleService, type PaginatedSchedules, type ScheduleListItem } from '@/shared/api/scheduleService'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'
import { showErrorToast } from '@/shared/lib/toast-manager'

const BULK_PAGE_SIZE = 50

export default function SeasonPage() {
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
      items.sort((a, b) => {
        const aTime = Number.isNaN(new Date(a.createdAt).getTime()) ? 0 : new Date(a.createdAt).getTime()
        const bTime = Number.isNaN(new Date(b.createdAt).getTime()) ? 0 : new Date(b.createdAt).getTime()
        return bTime - aTime
      })

      setAllSchedules(items)
      setFilteredItems(prev => (prev === null ? items : prev))
      return items
    } catch (e) {
      showErrorToast(e)
      return []
    } finally {
      setAllSchedulesLoading(false)
    }
  }, [])

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
      showErrorToast(error)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleRefresh = useCallback(async () => {
    await loadStats()
    await loadAllSchedules()
  }, [loadStats, loadAllSchedules])

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <ManagementPageHeader
            title="Quản lý thời vụ gieo trồng"
            description="Quản lý và lập thời vụ gieo trồng"
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
                    <p className="text-sm text-gray-500">Tổng thời vụ</p>
                    <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tất cả thời vụ đã được tạo trong hệ thống
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
                  Thời vụ ở trạng thái hoạt động/đang áp dụng
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
                  Các thời vụ đã bị vô hiệu hóa
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


