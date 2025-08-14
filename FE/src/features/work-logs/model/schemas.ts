import { z } from 'zod'

// Work log entry schema
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

// Work log filter schema
export const workLogFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.enum(['all', 'completed', 'in-progress', 'cancelled']).optional(),
  priority: z.enum(['all', 'low', 'medium', 'high', 'urgent']).optional(),
  zone: z.string().optional(),
  assignedTo: z.string().optional(),
  task: z.string().optional(),
})

// Type exports
export type WorkLogData = z.infer<typeof workLogSchema>
export type WorkLogFilterData = z.infer<typeof workLogFilterSchema>

// Validation helpers
export const validateWorkLog = (data: unknown) => workLogSchema.safeParse(data)
export const validateWorkLogFilter = (data: unknown) => workLogFilterSchema.safeParse(data)

// Default form values
export const defaultWorkLogValues: WorkLogData = {
  date: new Date().toISOString().split('T')[0],
  startTime: '',
  endTime: '',
  task: '',
  zone: '',
  description: '',
  status: 'in-progress',
  priority: 'medium',
  notes: '',
  equipment: [],
  photos: [],
}

// Task categories
export const taskCategories = [
  'Irrigation Management',
  'Crop Monitoring',
  'Pest Control',
  'Fertilization',
  'Harvesting',
  'Equipment Maintenance',
  'Soil Testing',
  'Planting/Seeding',
  'Pruning',
  'Disease Treatment',
  'Weather Monitoring',
  'Inventory Check',
  'Quality Control',
  'Other',
]

// Priority configurations
export const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Can be done when time permits',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Should be completed soon',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Important, needs attention',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Critical, immediate action required',
  },
}

// Status configurations
export const statusConfig = {
  'in-progress': {
    label: 'In Progress',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'clock',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'check',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'x',
  },
}

// Equipment options
export const equipmentOptions = [
  'Irrigation System',
  'Tractors',
  'Sprayers',
  'Harvesters',
  'Tillers',
  'Seeders',
  'Fertilizer Spreader',
  'Pruning Tools',
  'Soil Tester',
  'Weather Station',
  'Drones',
  'Hand Tools',
  'Safety Equipment',
]

// Zone options (matching with other features)
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

// Sort options for work logs
export const workLogSortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'task', label: 'Task' },
  { value: 'zone', label: 'Zone' },
  { value: 'assignedTo', label: 'Assigned To' },
]

// Time slots for scheduling
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
