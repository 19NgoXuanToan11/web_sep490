import { z } from 'zod'

// Schedule form validation schema
export const scheduleFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  deviceId: z.string().min(1, 'Device selection is required'),
  recurrenceType: z.enum(['daily', 'weekly', 'interval'], {
    required_error: 'Recurrence type is required',
  }),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  moistureThresholdPct: z
    .number()
    .min(0, 'Moisture threshold must be at least 0%')
    .max(100, 'Moisture threshold cannot exceed 100%'),
  enabled: z.boolean().default(true),
}).refine((data) => {
  // Validate that end time is after start time
  const [startHour, startMin] = data.startTime.split(':').map(Number)
  const [endHour, endMin] = data.endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return endMinutes > startMinutes
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

// Rule form validation schema
export const ruleFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100, 'Name must be less than 100 characters'),
  conditionText: z
    .string()
    .min(10, 'Condition description must be at least 10 characters')
    .max(500, 'Condition description must be less than 500 characters'),
  enabled: z.boolean().default(true),
})

// Device action schema
export const deviceActionSchema = z.object({
  type: z.enum(['start', 'stop', 'pause', 'run-now'], {
    required_error: 'Action type is required',
  }),
  deviceId: z.string().min(1, 'Device ID is required'),
})

// Form data types (inferred from schemas)
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>
export type RuleFormData = z.infer<typeof ruleFormSchema>
export type DeviceActionData = z.infer<typeof deviceActionSchema>

