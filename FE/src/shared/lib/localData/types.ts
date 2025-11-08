export type ScheduleStatus = 'Scheduled' | 'Running' | 'Paused'

export interface IrrigationSchedule {
  id: string
  deviceId: string
  title: string
  recurrenceText: string
  startTime: string
  endTime: string
  moistureThresholdPct: number
  enabled: boolean
  nextRun: string
  status: ScheduleStatus
}

export interface ScheduleFormData {
  title: string
  deviceId: string
  recurrenceType: 'daily' | 'weekly' | 'interval'
  startTime: string
  endTime: string
  moistureThresholdPct: number
  enabled: boolean
}

export type TimeRange = 'last7' | 'last30' | 'last90'

export interface ReportFilters {
  timeRange: TimeRange
}

export type TableDensity = 'compact' | 'comfortable'

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface SearchState {
  query: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export type UserRole = 'CUSTOMER' | 'MANAGER' | 'STAFF'
export type UserStatus = 'Active' | 'Inactive'

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  status: UserStatus
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export interface SystemSettings {
  general: {
    systemName: string
    primaryColor: string
    logoUrl: string | null
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    alertFrequency: 'daily' | 'weekly' | 'monthly'
  }
  iotConfig: {
    defaultPollingInterval: number
    sensorThresholds: {
      temperature: { min: number; max: number }
      moisture: { min: number; max: number }
      ph: { min: number; max: number }
    }
  }
  updatedAt: string
}

export type StaffDeviceStatus = 'Idle' | 'Running' | 'Paused' | 'Maintenance'

export interface StaffDevice {
  id: string
  name: string
  zone: string
  status: StaffDeviceStatus
  lastAction: string
  nextSchedule: string | null
  batteryLevel?: number
  needsMaintenance: boolean
  uptimePct: number
}

export type TaskType =
  | 'Irrigation'
  | 'Fertilization'
  | 'Pest Control'
  | 'Harvesting'
  | 'Maintenance'
  | 'Planting'
  | 'Monitoring'

export interface WorkLog {
  id: string
  date: string
  taskType: TaskType
  notes: string
  deviceId?: string
  duration?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface QualityCheckItem {
  id: string
  name: string
  passed: boolean
  comments?: string
}

export interface QualityCheck {
  id: string
  productBatchId: string
  productName: string
  checkedDate: string
  checkedBy: string
  items: QualityCheckItem[]
  overallStatus: 'Pass' | 'Fail' | 'Pending'
  createdAt: string
  updatedAt: string
}

export interface UserFormData {
  name: string
  email: string
  roles: UserRole[]
  status: UserStatus
}

export interface WorkLogFormData {
  taskType: TaskType
  notes: string
  deviceId?: string
  duration?: number
}
