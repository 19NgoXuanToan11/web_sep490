import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { BackendScheduleList } from '@/features/irrigation/ui/BackendScheduleList'
import { Button } from '@/shared/ui/button'
import React from 'react'

export default function IrrigationPage() {
  const selectedTab = 'calendar'
  const handleTabChange = (_tab: string) => { }
  const [showCreate, setShowCreate] = React.useState(false)

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
              <Button size="sm" onClick={() => setShowCreate(v => !v)}>Tạo lịch mới</Button>
            </div>
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
