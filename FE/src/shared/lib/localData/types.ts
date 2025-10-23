// Core data models for the IFMS Farm Manager features

export type DeviceStatus = 'Idle' | 'Running' | 'Paused'

export interface Device {
  id: string
  zone: string
  name: string
  status: DeviceStatus
  lastRun: string // ISO string
  nextRun: string // ISO string
  uptimePct: number
}

export type ScheduleStatus = 'Scheduled' | 'Running' | 'Paused'

export interface IrrigationSchedule {
  id: string
  deviceId: string
  title: string
  recurrenceText: string // Human-readable description like "Daily at 6:00 AM"
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  moistureThresholdPct: number
  enabled: boolean
  nextRun: string // ISO string
  status: ScheduleStatus
}

export interface IrrigationRule {
  id: string
  name: string
  conditionText: string // Human-readable rule description
  enabled: boolean
  createdAt: string // ISO string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  imageUrl?: string
  updatedAt: string // ISO string
}

export interface InventoryItem {
  id: string
  productId: string
  stock: number
  minThreshold: number
  maxThreshold: number
  qualityFlags: string[] // e.g., ['Organic', 'Fresh', 'Local']
  updatedAt: string // ISO string
}

// Utility types for forms and UI - Updated to support Staff operations
export interface DeviceAction {
  type: 'start' | 'stop' | 'pause' | 'run-now' | 'maintenance'
  deviceId: string
  notes?: string
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

export interface RuleFormData {
  name: string
  conditionText: string
  enabled: boolean
}

export interface ProductFormData {
  sku: string
  name: string
  category: string
  price: number
  imageFile?: File
}

export interface BulkInventoryAction {
  type: 'set-category' | 'update-thresholds'
  productIds: string[]
  data?: Record<string, any>
}

export type TimeRange = 'last7' | 'last30' | 'last90'

export interface ReportFilters {
  timeRange: TimeRange
}

// Table density preference
export type TableDensity = 'compact' | 'comfortable'

// Common UI states
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

// Search and pagination
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

// =======================================================
// ADMIN & STAFF ROLE EXTENSIONS
// =======================================================

// User Management (Admin)
export type UserRole = 'CUSTOMER' | 'MANAGER' | 'STAFF'
export type UserStatus = 'Active' | 'Inactive'

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  status: UserStatus
  lastLogin: string | null // ISO string or null if never logged in
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

// System Settings (Admin)
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
    defaultPollingInterval: number // minutes
    sensorThresholds: {
      temperature: { min: number; max: number }
      moisture: { min: number; max: number }
      ph: { min: number; max: number }
    }
  }
  updatedAt: string // ISO string
}

// Staff Device Operations
export type StaffDeviceStatus = 'Idle' | 'Running' | 'Paused' | 'Maintenance'

export interface StaffDevice {
  id: string
  name: string
  zone: string
  status: StaffDeviceStatus
  lastAction: string // ISO string
  nextSchedule: string | null // ISO string or null
  batteryLevel?: number // 0-100, optional for battery-powered devices
  needsMaintenance: boolean
  uptimePct: number
}

// Work Logs (Staff)
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
  date: string // ISO string
  taskType: TaskType
  notes: string
  deviceId?: string // Optional device reference
  duration?: number // minutes, optional
  createdBy: string // User ID
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

// Quality Checks (Staff)
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
  checkedDate: string // ISO string
  checkedBy: string // User ID
  items: QualityCheckItem[]
  overallStatus: 'Pass' | 'Fail' | 'Pending'
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

// Form data interfaces for Admin/Staff features
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
