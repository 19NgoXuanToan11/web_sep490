import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/irrigation/ui/BackendScheduleList'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { scheduleService, type PaginatedSchedules, type ScheduleListItem } from '@/shared/api/scheduleService'
import { useToast } from '@/shared/ui/use-toast'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'
import { StaffFilterBar } from '@/shared/ui'
import { Search } from 'lucide-react'
import { accountApi } from '@/shared/api/auth'

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

  // Filter state
  const [staffFilter, setStaffFilter] = useState<number | null>(null)
  const [filteredItems, setFilteredItems] = useState<ScheduleListItem[] | null>(null)
  const [staffs, setStaffs] = useState<{ id: number; name: string }[]>([])
  const [allSchedules, setAllSchedules] = useState<ScheduleListItem[]>([])
  const [allSchedulesLoading, setAllSchedulesLoading] = useState(false)

  // Load staffs for filter
  useEffect(() => {
    const loadStaffs = async () => {
      try {
        const staffRes = await accountApi.getAll({ role: 'Staff', pageSize: 1000 })
        setStaffs(staffRes.items.map(s => ({ id: s.accountId, name: s.email })))
      } catch (error) {
        // Silent fail for staff list
      }
    }
    loadStaffs()
  }, [])

  // Load all schedules for filtering
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

  // Load all schedules in background
  useEffect(() => {
    loadAllSchedules()
  }, [loadAllSchedules])

  const loadStats = useCallback(async () => {
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

          <StaffFilterBar>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm lịch tưới..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={staffFilter ? String(staffFilter) : 'all'}
                onValueChange={v => {
                  if (v === 'all') {
                    setStaffFilter(null)
                    setFilteredItems(null)
                  } else {
                    setStaffFilter(Number(v))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {staffs.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto flex justify-end">
              <Button onClick={() => setShowCreate(true)} className="bg-green-600 hover:bg-green-700">
                Tạo
              </Button>
            </div>
          </StaffFilterBar>

          { }
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsContent value="calendar" className="space-y-6">
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
