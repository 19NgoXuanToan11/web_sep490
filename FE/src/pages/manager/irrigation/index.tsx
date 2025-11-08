import React from 'react'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useIrrigationStore } from '@/features/irrigation/store/irrigationStore'
import { userPreferences } from '@/shared/lib/localData/storage'
import { ScheduleCalendar } from '@/features/irrigation/ui/ScheduleCalendar'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'

export default function IrrigationPage() {
  const { selectedTab, setSelectedTab, initializeData } = useIrrigationStore()
  const [showScheduleForm, setShowScheduleForm] = React.useState(false)

  React.useEffect(() => {
    initializeData()

    const prefs = userPreferences.get()
    if (prefs.lastSelectedTab?.irrigation) {
      setSelectedTab(prefs.lastSelectedTab.irrigation)
    }
  }, [initializeData, setSelectedTab])

  React.useEffect(() => {
    return () => {
      if ((window as any).__irrigationStatusInterval) {
        clearInterval((window as any).__irrigationStatusInterval)
      }
    }
  }, [])

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
  }

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          { }
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý tưới tiêu thông minh</h1>
                <p className="text-gray-600 mt-2">Quản lý lịch tưới tự động và điều khiển thiết bị.</p>
              </div>
              <Button onClick={() => setShowScheduleForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Lịch mới
              </Button>
            </div>
          </div>

          { }
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsContent value="calendar" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <ScheduleCalendar showScheduleForm={showScheduleForm} onShowScheduleFormChange={setShowScheduleForm} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ManagerLayout>
  )
}
