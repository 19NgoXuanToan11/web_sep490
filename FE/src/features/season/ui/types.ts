import type { ScheduleListItem, ScheduleStatusString } from '@/shared/api/scheduleService'

export interface BackendScheduleListProps {
  showCreate?: boolean
  onShowCreateChange?: (v: boolean) => void
  filteredItems?: ScheduleListItem[] | null
  onFilteredItemsChange?: (items: ScheduleListItem[] | null) => void
}

export interface ActivityOption {
  id: number
  name: string
}

export interface ScheduleActionMenuProps {
  schedule: ScheduleListItem
  onView: (schedule: ScheduleListItem) => void
  onEdit: (schedule: ScheduleListItem) => void
  onAssignStaff: (schedule: ScheduleListItem) => void
  onUpdateStatus: (schedule: ScheduleListItem, nextStatus: ScheduleStatusString) => void
  onViewLogs?: (schedule: ScheduleListItem) => void
  onAddLog?: (schedule: ScheduleListItem) => void
  actionLoading: { [key: string]: boolean }
}

export type SortOption = 'newest' | 'startDate' | 'cropName' | 'farmName'

export type {
  PaginatedSchedules,
  CreateScheduleRequest,
  ScheduleDetail,
  ScheduleListItem,
  ScheduleStatusString,
} from '@/shared/api/scheduleService'

export type { ScheduleLogItem } from '@/shared/api/scheduleLogService'

export type { FarmActivity } from '@/shared/api/farmActivityService'
