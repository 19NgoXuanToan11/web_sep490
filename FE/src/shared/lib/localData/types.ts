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

export interface ReportKPIs {
  efficiencyIndex: number
  batches: number
  revenue: number
  orders: number
}

export interface EfficiencyDataPoint {
  date: string // ISO date string
  efficiency: number
}

export interface ProductionVsSalesDataPoint {
  period: string // e.g., "Week 1", "Jan 2024"
  production: number
  sales: number
}

export interface ReportSummary {
  kpis: ReportKPIs
  timeseries: EfficiencyDataPoint[]
  productionVsSales: ProductionVsSalesDataPoint[]
}

// Utility types for forms and UI
export interface DeviceAction {
  type: 'start' | 'stop' | 'pause' | 'run-now'
  deviceId: string
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
  type: 'set-category' | 'update-thresholds' | 'export-csv'
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

