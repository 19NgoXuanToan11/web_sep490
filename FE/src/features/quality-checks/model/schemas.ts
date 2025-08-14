import { z } from 'zod'

// Quality check entry schema
export const qualityCheckSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  zone: z.string().min(1, 'Zone is required'),
  cropType: z.string().min(1, 'Crop type is required'),
  checkType: z.enum(['routine', 'disease', 'pest', 'growth', 'harvest-ready']),
  status: z.enum(['pass', 'fail', 'warning', 'pending']),
  inspector: z.string().min(1, 'Inspector is required'),

  // Quality metrics
  overallHealth: z.number().min(1).max(10),
  growthStage: z.enum(['seedling', 'vegetative', 'flowering', 'fruiting', 'mature']),

  // Specific checks
  diseasePresent: z.boolean(),
  pestPresent: z.boolean(),
  nutrientDeficiency: z.boolean(),

  // Measurements
  plantHeight: z.number().optional(),
  leafColor: z.enum(['healthy-green', 'light-green', 'yellow', 'brown', 'other']).optional(),
  fruitCount: z.number().optional(),

  // Environmental factors
  soilMoisture: z.number().min(0).max(100).optional(),
  temperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),

  // Issues and actions
  issues: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  notes: z.string().optional(),

  // Photos
  photos: z.array(z.string()).optional(),

  // Follow-up
  requiresFollowUp: z.boolean(),
  followUpDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
})

// Quality check filter schema
export const qualityCheckFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  zone: z.string().optional(),
  cropType: z.string().optional(),
  checkType: z.enum(['all', 'routine', 'disease', 'pest', 'growth', 'harvest-ready']).optional(),
  status: z.enum(['all', 'pass', 'fail', 'warning', 'pending']).optional(),
  inspector: z.string().optional(),
  priority: z.enum(['all', 'low', 'medium', 'high', 'critical']).optional(),
  requiresFollowUp: z.boolean().optional(),
})

// Type exports
export type QualityCheckData = z.infer<typeof qualityCheckSchema>
export type QualityCheckFilterData = z.infer<typeof qualityCheckFilterSchema>

// Validation helpers
export const validateQualityCheck = (data: unknown) => qualityCheckSchema.safeParse(data)
export const validateQualityCheckFilter = (data: unknown) =>
  qualityCheckFilterSchema.safeParse(data)

// Default form values
export const defaultQualityCheckValues: QualityCheckData = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  zone: '',
  cropType: '',
  checkType: 'routine',
  status: 'pending',
  inspector: '',
  overallHealth: 7,
  growthStage: 'vegetative',
  diseasePresent: false,
  pestPresent: false,
  nutrientDeficiency: false,
  leafColor: 'healthy-green',
  issues: [],
  recommendedActions: [],
  notes: '',
  photos: [],
  requiresFollowUp: false,
  priority: 'medium',
}

// Check type configurations
export const checkTypeConfig = {
  routine: {
    label: 'Routine Check',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'calendar',
    description: 'Regular scheduled inspection',
  },
  disease: {
    label: 'Disease Check',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'alert-triangle',
    description: 'Disease detection and monitoring',
  },
  pest: {
    label: 'Pest Check',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'bug',
    description: 'Pest infestation assessment',
  },
  growth: {
    label: 'Growth Check',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'trending-up',
    description: 'Growth progress evaluation',
  },
  'harvest-ready': {
    label: 'Harvest Ready',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'harvest',
    description: 'Harvest readiness assessment',
  },
}

// Status configurations
export const statusConfig = {
  pass: {
    label: 'Pass',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'check-circle',
    description: 'Quality standards met',
  },
  fail: {
    label: 'Fail',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'x-circle',
    description: 'Quality standards not met',
  },
  warning: {
    label: 'Warning',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'alert-triangle',
    description: 'Issues detected, monitoring required',
  },
  pending: {
    label: 'Pending',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'clock',
    description: 'Assessment in progress',
  },
}

// Priority configurations
export const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'Monitor during next routine check',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Address within a few days',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Requires prompt attention',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Immediate action required',
  },
}

// Growth stage configurations
export const growthStageConfig = {
  seedling: { label: 'Seedling', color: 'text-green-400' },
  vegetative: { label: 'Vegetative', color: 'text-green-600' },
  flowering: { label: 'Flowering', color: 'text-pink-600' },
  fruiting: { label: 'Fruiting', color: 'text-orange-600' },
  mature: { label: 'Mature', color: 'text-purple-600' },
}

// Leaf color options
export const leafColorOptions = [
  { value: 'healthy-green', label: 'Healthy Green', color: 'bg-green-500' },
  { value: 'light-green', label: 'Light Green', color: 'bg-green-300' },
  { value: 'yellow', label: 'Yellow', color: 'bg-yellow-400' },
  { value: 'brown', label: 'Brown', color: 'bg-yellow-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-400' },
]

// Crop types
export const cropTypes = [
  'Tomatoes',
  'Cucumbers',
  'Peppers',
  'Lettuce',
  'Spinach',
  'Herbs',
  'Strawberries',
  'Eggplant',
  'Beans',
  'Peas',
  'Carrots',
  'Radishes',
  'Other',
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

// Common issues
export const commonIssues = [
  'Leaf yellowing',
  'Stunted growth',
  'Pest infestation',
  'Disease symptoms',
  'Nutrient deficiency',
  'Overwatering',
  'Underwatering',
  'Temperature stress',
  'Poor fruit development',
  'Wilting',
  'Discoloration',
  'Abnormal growth pattern',
]

// Recommended actions
export const recommendedActions = [
  'Increase watering frequency',
  'Reduce watering frequency',
  'Apply fertilizer',
  'Apply pest treatment',
  'Apply disease treatment',
  'Adjust temperature',
  'Improve ventilation',
  'Prune affected areas',
  'Harvest immediately',
  'Monitor closely',
  'Isolate affected plants',
  'Consult specialist',
]

// Sort options for quality checks
export const qualityCheckSortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'overallHealth', label: 'Overall Health' },
  { value: 'zone', label: 'Zone' },
  { value: 'cropType', label: 'Crop Type' },
  { value: 'inspector', label: 'Inspector' },
]
