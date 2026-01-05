import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/season'
import { scheduleService, type PaginatedSchedules, type ScheduleListItem } from '@/shared/api/scheduleService'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'
import { showErrorToast } from '@/shared/lib/toast-manager'

const BULK_PAGE_SIZE = 50

export default function SeasonPage() {
  const selectedTab = 'calendar'
  const handleTabChange = (_tab: string) => { }
  const [showCreate, setShowCreate] = useState(false)

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



  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <ManagementPageHeader
            title="Quản lý thời vụ gieo trồng"
            description="Quản lý và lập thời vụ gieo trồng"
          />
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


