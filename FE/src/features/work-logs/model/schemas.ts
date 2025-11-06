import { z } from 'zod'

export const workLogSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  task: z.string().min(1, 'Task is required'),
  zone: z.string().min(1, 'Zone is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['completed', 'in-progress', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  weather: z
    .object({
      temperature: z.number().optional(),
      humidity: z.number().optional(),
      conditions: z.string().optional(),
    })
    .optional(),
})

export const workLogFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(['all', 'completed', 'in-progress', 'cancelled']).optional(),
  priority: z.enum(['all', 'low', 'medium', 'high', 'urgent']).optional(),
  zone: z.string().optional(),
  assignedTo: z.string().optional(),
  task: z.string().optional(),
})

export type WorkLogData = z.infer<typeof workLogSchema>
export type WorkLogFilterData = z.infer<typeof workLogFilterSchema>

export const taskCategories = [
  'Quản lý tưới tiêu',
  'Giám sát cây trồng',
  'Kiểm soát sâu bệnh',
  'Bón phân',
  'Thu hoạch',
  'Bảo trì thiết bị',
  'Kiểm tra đất',
  'Trồng/Gieo hạt',
  'Tỉa cành',
  'Điều trị bệnh',
  'Theo dõi thời tiết',
  'Kiểm kê tồn kho',
  'Kiểm soát chất lượng',
  'Khác',
]

export const zoneOptions = [
  'Zone A - Greenhouse 1',
  'Zone B - Outdoor Field',
  'Zone C - Nursery',
  'Zone D - Research Area',
  'Zone E - Field Extension',
  'Zone F - Hydroponic Greenhouse',
  'Zone G - Cold Storage',
  'Zone H - Seedling Area',
]

export const validateWorkLog = (data: unknown) => workLogSchema.safeParse(data)
export const validateWorkLogFilter = (data: unknown) => workLogFilterSchema.safeParse(data)

export const defaultWorkLogValues: WorkLogData = {
  date: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '17:00',
  task: taskCategories[0],
  zone: zoneOptions[0],
  description: '',
  status: 'in-progress',
  priority: 'medium',
  notes: '',
  equipment: [],
  photos: [],
}

export const priorityConfig = {
  low: {
    label: 'Thấp',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Có thể thực hiện khi có thời gian',
  },
  medium: {
    label: 'Trung bình',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Nên hoàn thành sớm',
  },
  high: {
    label: 'Cao',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Quan trọng, cần chú ý',
  },
  urgent: {
    label: 'Khẩn cấp',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Cấp bách, cần hành động ngay lập tức',
  },
}

export const statusConfig = {
  'in-progress': {
    label: 'Đang thực hiện',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'clock',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'check',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'x',
  },
}

export const equipmentOptions = [
  'Hệ thống tưới tiêu',
  'Máy kéo',
  'Máy phun thuốc',
  'Máy thu hoạch',
  'Máy xới đất',
  'Máy gieo hạt',
  'Máy rải phân',
  'Dụng cụ tỉa cành',
  'Máy kiểm tra đất',
  'Trạm thời tiết',
  'Máy bay không người lái',
  'Dụng cụ cầm tay',
  'Thiết bị an toàn',
]

export const workLogSortOptions = [
  { value: 'date', label: 'Ngày' },
  { value: 'priority', label: 'Độ ưu tiên' },
  { value: 'status', label: 'Trạng thái' },
  { value: 'task', label: 'Nhiệm vụ' },
  { value: 'zone', label: 'Khu vực' },
  { value: 'assignedTo', label: 'Người thực hiện' },
]

export const timeSlots = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
]
