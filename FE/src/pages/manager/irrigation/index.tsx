import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Calendar, Brain, Settings } from 'lucide-react'
import { useIrrigationStore } from '@/features/irrigation/store/irrigationStore'
import { userPreferences } from '@/shared/lib/localData/storage'
import { ScheduleCalendar } from '@/features/irrigation/ui/ScheduleCalendar'
import { RuleBuilder } from '@/features/irrigation/ui/RuleBuilder'
import { DeviceList } from '@/features/irrigation/ui/DeviceList'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'

export default function IrrigationPage() {
  const { selectedTab, setSelectedTab, initializeData } = useIrrigationStore()

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
          {}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý tưới tiêu thông minh</h1>
            <p className="text-gray-600 mt-2">Quản lý lịch tưới tự động và điều khiển thiết bị.</p>
          </div>

          {}
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border border-gray-200">
              <TabsTrigger
                value="calendar"
                className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Lịch tưới</span>
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Quy tắc tự động</span>
              </TabsTrigger>
              <TabsTrigger
                value="devices"
                className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Điều khiển thiết bị</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <ScheduleCalendar />
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <RuleBuilder />
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Bảng điều khiển thiết bị</h2>
                  <p className="text-gray-600">
                    Giám sát và điều khiển thiết bị tưới theo thời gian thực
                  </p>
                </div>
                <DeviceList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ManagerLayout>
  )
}
