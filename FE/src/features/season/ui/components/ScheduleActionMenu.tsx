import React, { useState, useCallback } from 'react'
import { Button } from '@/shared/ui/button'
import { Loader2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import type { ScheduleActionMenuProps, ScheduleStatusString } from '../types'
import { isActiveStatus } from '../utils/labels'

const ScheduleActionMenu: React.FC<ScheduleActionMenuProps> = React.memo(({
  schedule,
  onView,
  onEdit,
  onUpdateStatus,
  actionLoading,
}) => {
  const [open, setOpen] = useState(false)
  const isLoading = actionLoading[`detail-${schedule.scheduleId}`] ||
    actionLoading[`edit-${schedule.scheduleId}`] ||
    actionLoading[`status-${schedule.scheduleId}`]


  const handleView = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setTimeout(() => {
        onView(schedule)
      }, 0)
    },
    [schedule, onView]
  )

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setTimeout(() => {
        onEdit(schedule)
      }, 0)
    },
    [schedule, onEdit]
  )



  const handleUpdateStatus = useCallback(
    (nextStatus: ScheduleStatusString) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setTimeout(() => {
        onUpdateStatus(schedule, nextStatus)
      }, 0)
    },
    [schedule, onUpdateStatus]
  )

  const nextStatus: ScheduleStatusString = isActiveStatus(schedule.status) ? 'DEACTIVATED' : 'ACTIVE'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onClick={handleView}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
          disabled={actionLoading[`detail-${schedule.scheduleId}`]}
        >
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
          disabled={actionLoading[`edit-${schedule.scheduleId}`]}
        >
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleUpdateStatus(nextStatus)}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
          disabled={actionLoading[`status-${schedule.scheduleId}`]}
        >
          {isActiveStatus(schedule.status) ? 'Vô hiệu hóa lịch' : 'Kích hoạt lịch'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

ScheduleActionMenu.displayName = 'ScheduleActionMenu'

export default ScheduleActionMenu
