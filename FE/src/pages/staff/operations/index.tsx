import React from 'react'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { StaffScheduleBoard } from '@/features/irrigation/ui/StaffScheduleBoard'

const StaffOperationsPage: React.FC = () => {
  return (
    <StaffLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lịch công việc</h1>
            <p className="text-muted-foreground">Theo dõi các lịch tưới và hoạt động được giao.</p>
          </div>
          <StaffScheduleBoard />
        </div>
      </div>
    </StaffLayout>
  )
}

export default StaffOperationsPage
