import { z } from 'zod'
import type { StaffDeviceStatus } from '@/shared/lib/localData'

// Device action schemas
export const deviceActionSchema = z.object({
  type: z.enum(['start', 'stop', 'pause', 'run-now', 'maintenance']),
  deviceId: z.string().min(1, 'Device ID is required'),
  notes: z.string().optional(),
  duration: z.number().min(1).max(480).optional(), // Optional duration for run-now actions (1-480 minutes)
})

export const bulkDeviceActionSchema = z.object({
  type: z.enum(['start', 'stop', 'pause', 'maintenance']),
  deviceIds: z.array(z.string()).min(1, 'At least one device must be selected'),
  notes: z.string().optional(),
})

// Device filter schemas
export const deviceFilterSchema = z.object({
  status: z.enum(['all', 'Idle', 'Running', 'Paused', 'Maintenance']).optional(),
  zone: z.string().optional(),
  needsMaintenance: z.boolean().optional(),
  batteryLevel: z.enum(['all', 'low', 'medium', 'high']).optional(),
})

// Type exports
export type DeviceActionData = z.infer<typeof deviceActionSchema>
export type BulkDeviceActionData = z.infer<typeof bulkDeviceActionSchema>
export type DeviceFilterData = z.infer<typeof deviceFilterSchema>

// Validation helpers
export const validateDeviceAction = (data: unknown) => deviceActionSchema.safeParse(data)
export const validateBulkDeviceAction = (data: unknown) => bulkDeviceActionSchema.safeParse(data)
export const validateDeviceFilter = (data: unknown) => deviceFilterSchema.safeParse(data)

// Default form values
export const defaultDeviceActionValues: DeviceActionData = {
  type: 'start',
  deviceId: '',
  notes: '',
}

// Device status configurations
export const deviceStatusConfig: Record<
  StaffDeviceStatus,
  {
    label: string
    color: string
    bgColor: string
    icon: string
    description: string
  }
> = {
  Idle: {
    label: 'Idle',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'pause',
    description: 'Device is ready but not currently active',
  },
  Running: {
    label: 'Running',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'play',
    description: 'Device is currently operating',
  },
  Paused: {
    label: 'Paused',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'pause',
    description: 'Device operation is temporarily paused',
  },
  Maintenance: {
    label: 'Maintenance',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'wrench',
    description: 'Device is under maintenance',
  },
}

// Action configurations
export const actionConfig: Record<
  string,
  {
    label: string
    icon: string
    color: string
    description: string
    confirmRequired: boolean
  }
> = {
  start: {
    label: 'Start',
    icon: 'play',
    color: 'text-green-600',
    description: 'Begin device operation',
    confirmRequired: false,
  },
  stop: {
    label: 'Stop',
    icon: 'square',
    color: 'text-red-600',
    description: 'Stop device operation',
    confirmRequired: true,
  },
  pause: {
    label: 'Pause',
    icon: 'pause',
    color: 'text-yellow-600',
    description: 'Temporarily pause operation',
    confirmRequired: false,
  },
  'run-now': {
    label: 'Run Now',
    icon: 'zap',
    color: 'text-blue-600',
    description: 'Start immediate operation',
    confirmRequired: false,
  },
  maintenance: {
    label: 'Maintenance',
    icon: 'wrench',
    color: 'text-orange-600',
    description: 'Enter maintenance mode',
    confirmRequired: true,
  },
}

// Battery level categories
export const batteryLevelConfig = {
  low: { min: 0, max: 25, color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { min: 26, max: 75, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { min: 76, max: 100, color: 'text-green-600', bgColor: 'bg-green-100' },
}

// Zone options for filtering
export const zoneOptions = [
  { value: 'Zone A - Greenhouse 1', label: 'Greenhouse 1' },
  { value: 'Zone B - Outdoor Field', label: 'Outdoor Field' },
  { value: 'Zone C - Nursery', label: 'Nursery' },
  { value: 'Zone D - Research Area', label: 'Research Area' },
  { value: 'Zone E - Field Extension', label: 'Field Extension' },
  { value: 'Zone F - Hydroponic Greenhouse', label: 'Hydroponic Greenhouse' },
  { value: 'Zone G - Cold Storage', label: 'Cold Storage' },
  { value: 'Zone H - Seedling Area', label: 'Seedling Area' },
]

// Quick action presets for common operations
export const quickActionPresets = [
  {
    id: 'morning-routine',
    name: 'Morning Startup',
    description: 'Start all greenhouse systems for morning cycle',
    action: 'start',
    zones: ['Zone A - Greenhouse 1', 'Zone F - Hydroponic Greenhouse'],
  },
  {
    id: 'evening-shutdown',
    name: 'Evening Shutdown',
    description: 'Pause non-essential systems for evening',
    action: 'pause',
    zones: ['Zone B - Outdoor Field', 'Zone E - Field Extension'],
  },
  {
    id: 'emergency-stop',
    name: 'Emergency Stop',
    description: 'Stop all devices immediately',
    action: 'stop',
    zones: [], // All zones
  },
  {
    id: 'maintenance-mode',
    name: 'Maintenance Mode',
    description: 'Put selected devices into maintenance mode',
    action: 'maintenance',
    zones: [],
  },
]

// Device view modes
export type DeviceViewMode = 'table' | 'grid' | 'map'

// Sort options for devices
export const deviceSortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'zone', label: 'Zone' },
  { value: 'status', label: 'Status' },
  { value: 'lastAction', label: 'Last Action' },
  { value: 'uptimePct', label: 'Uptime' },
  { value: 'batteryLevel', label: 'Battery Level' },
]
