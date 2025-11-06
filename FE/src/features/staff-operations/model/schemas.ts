import { z } from 'zod'
import type { StaffDeviceStatus } from '@/shared/lib/localData'

export const deviceActionSchema = z.object({
  type: z.enum(['start', 'stop', 'pause', 'run-now', 'maintenance']),
  deviceId: z.string().min(1, 'Device ID is required'),
  notes: z.string().optional(),
  duration: z.number().min(1).max(480).optional(),
})

export const bulkDeviceActionSchema = z.object({
  type: z.enum(['start', 'stop', 'pause', 'maintenance']),
  deviceIds: z.array(z.string()).min(1, 'At least one device must be selected'),
  notes: z.string().optional(),
})

export const deviceFilterSchema = z.object({
  status: z.enum(['all', 'Idle', 'Running', 'Paused', 'Maintenance']).optional(),
  zone: z.string().optional(),
  needsMaintenance: z.boolean().optional(),
  batteryLevel: z.enum(['all', 'low', 'medium', 'high']).optional(),
})

export type DeviceActionData = z.infer<typeof deviceActionSchema>
export type BulkDeviceActionData = z.infer<typeof bulkDeviceActionSchema>
export type DeviceFilterData = z.infer<typeof deviceFilterSchema>

export const validateDeviceAction = (data: unknown) => deviceActionSchema.safeParse(data)
export const validateBulkDeviceAction = (data: unknown) => bulkDeviceActionSchema.safeParse(data)
export const validateDeviceFilter = (data: unknown) => deviceFilterSchema.safeParse(data)

export const defaultDeviceActionValues: DeviceActionData = {
  type: 'start',
  deviceId: '',
  notes: '',
}

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
    label: 'Nghỉ',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'pause',
    description: 'Thiết bị sẵn sàng nhưng chưa hoạt động',
  },
  Running: {
    label: 'Đang chạy',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'play',
    description: 'Thiết bị đang hoạt động',
  },
  Paused: {
    label: 'Tạm dừng',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'pause',
    description: 'Thiết bị tạm dừng hoạt động',
  },
  Maintenance: {
    label: 'Bảo trì',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'wrench',
    description: 'Thiết bị đang được bảo trì',
  },
}

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
    label: 'Khởi động',
    icon: 'play',
    color: 'text-green-600',
    description: 'Bắt đầu vận hành thiết bị',
    confirmRequired: false,
  },
  stop: {
    label: 'Dừng',
    icon: 'square',
    color: 'text-red-600',
    description: 'Dừng vận hành thiết bị',
    confirmRequired: true,
  },
  pause: {
    label: 'Tạm dừng',
    icon: 'pause',
    color: 'text-yellow-600',
    description: 'Tạm dừng vận hành',
    confirmRequired: false,
  },
  'run-now': {
    label: 'Chạy ngay',
    icon: 'zap',
    color: 'text-blue-600',
    description: 'Khởi động ngay lập tức',
    confirmRequired: false,
  },
  maintenance: {
    label: 'Bảo trì',
    icon: 'wrench',
    color: 'text-orange-600',
    description: 'Chế độ bảo trì',
    confirmRequired: true,
  },
}

export const batteryLevelConfig = {
  low: { min: 0, max: 25, color: 'text-red-600', bgColor: 'bg-red-100' },
  medium: { min: 26, max: 75, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { min: 76, max: 100, color: 'text-green-600', bgColor: 'bg-green-100' },
}

export const zoneOptions = [
  { value: 'Zone A - Greenhouse 1', label: 'Nhà kính 1' },
  { value: 'Zone B - Outdoor Field', label: 'Cánh đồng ngoài trời' },
  { value: 'Zone C - Nursery', label: 'Vườn ươm' },
  { value: 'Zone D - Research Area', label: 'Khu nghiên cứu' },
  { value: 'Zone E - Field Extension', label: 'Mở rộng cánh đồng' },
  { value: 'Zone F - Hydroponic Greenhouse', label: 'Nhà kính thủy canh' },
  { value: 'Zone G - Cold Storage', label: 'Kho lạnh' },
  { value: 'Zone H - Seedling Area', label: 'Khu cây giống' },
]

export const quickActionPresets = [
  {
    id: 'morning-routine',
    name: 'Khởi động buổi sáng',
    description: 'Khởi động tất cả hệ thống nhà kính cho chu kỳ buổi sáng',
    action: 'start',
    zones: ['Zone A - Greenhouse 1', 'Zone F - Hydroponic Greenhouse'],
  },
  {
    id: 'evening-shutdown',
    name: 'Tắt buổi tối',
    description: 'Tạm dừng các hệ thống không cần thiết vào buổi tối',
    action: 'pause',
    zones: ['Zone B - Outdoor Field', 'Zone E - Field Extension'],
  },
  {
    id: 'emergency-stop',
    name: 'Dừng khẩn cấp',
    description: 'Dừng tất cả thiết bị ngay lập tức',
    action: 'stop',
    zones: [],
  },
  {
    id: 'maintenance-mode',
    name: 'Chế độ bảo trì',
    description: 'Đưa các thiết bị đã chọn vào chế độ bảo trì',
    action: 'maintenance',
    zones: [],
  },
]

export type DeviceViewMode = 'table' | 'grid' | 'map'

export const deviceSortOptions = [
  { value: 'name', label: 'Tên thiết bị' },
  { value: 'zone', label: 'Khu vực' },
  { value: 'status', label: 'Trạng thái' },
  { value: 'lastAction', label: 'Thao tác cuối' },
  { value: 'uptimePct', label: 'Thời gian hoạt động' },
  { value: 'batteryLevel', label: 'Mức pin' },
]
