import { z } from 'zod'

// System Settings form schemas
export const generalSettingsSchema = z.object({
  systemName: z
    .string()
    .min(1, 'System name is required')
    .min(3, 'System name must be at least 3 characters')
    .max(100, 'System name must be less than 100 characters'),
  primaryColor: z
    .string()
    .min(1, 'Primary color is required')
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format (use #RRGGBB)'),
  logoUrl: z.string().optional(),
})

export const notificationsSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  alertFrequency: z.enum(['daily', 'weekly', 'monthly']),
})

export const iotConfigSettingsSchema = z.object({
  defaultPollingInterval: z
    .number()
    .min(1, 'Polling interval must be at least 1 minute')
    .max(1440, 'Polling interval cannot exceed 24 hours'),
  sensorThresholds: z.object({
    temperature: z
      .object({
        min: z
          .number()
          .min(-50, 'Minimum temperature too low')
          .max(100, 'Minimum temperature too high'),
        max: z
          .number()
          .min(-50, 'Maximum temperature too low')
          .max(100, 'Maximum temperature too high'),
      })
      .refine(data => data.min < data.max, {
        message: 'Minimum temperature must be less than maximum temperature',
        path: ['min'],
      }),
    moisture: z
      .object({
        min: z
          .number()
          .min(0, 'Minimum moisture must be at least 0%')
          .max(100, 'Minimum moisture cannot exceed 100%'),
        max: z
          .number()
          .min(0, 'Maximum moisture must be at least 0%')
          .max(100, 'Maximum moisture cannot exceed 100%'),
      })
      .refine(data => data.min < data.max, {
        message: 'Minimum moisture must be less than maximum moisture',
        path: ['min'],
      }),
    ph: z
      .object({
        min: z
          .number()
          .min(0, 'Minimum pH must be at least 0')
          .max(14, 'Minimum pH cannot exceed 14'),
        max: z
          .number()
          .min(0, 'Maximum pH must be at least 0')
          .max(14, 'Maximum pH cannot exceed 14'),
      })
      .refine(data => data.min < data.max, {
        message: 'Minimum pH must be less than maximum pH',
        path: ['min'],
      }),
  }),
})

// Combined settings schema
export const systemSettingsSchema = z.object({
  general: generalSettingsSchema,
  notifications: notificationsSettingsSchema,
  iotConfig: iotConfigSettingsSchema,
})

// Type exports
export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>
export type NotificationsSettingsFormData = z.infer<typeof notificationsSettingsSchema>
export type IoTConfigSettingsFormData = z.infer<typeof iotConfigSettingsSchema>
export type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>

// Validation helpers
export const validateGeneralSettings = (data: unknown) => generalSettingsSchema.safeParse(data)
export const validateNotificationsSettings = (data: unknown) =>
  notificationsSettingsSchema.safeParse(data)
export const validateIoTConfigSettings = (data: unknown) => iotConfigSettingsSchema.safeParse(data)
export const validateSystemSettings = (data: unknown) => systemSettingsSchema.safeParse(data)

// Default values
export const defaultGeneralSettings: GeneralSettingsFormData = {
  systemName: 'IFMS - Integrated Farm Management System',
  primaryColor: '#16a34a', // green-600
  logoUrl: '',
}

export const defaultNotificationsSettings: NotificationsSettingsFormData = {
  emailEnabled: true,
  smsEnabled: false,
  alertFrequency: 'daily',
}

export const defaultIoTConfigSettings: IoTConfigSettingsFormData = {
  defaultPollingInterval: 15,
  sensorThresholds: {
    temperature: { min: 10, max: 35 },
    moisture: { min: 20, max: 80 },
    ph: { min: 6.0, max: 7.5 },
  },
}

// Color options for primary color selection
export const primaryColorOptions = [
  { name: 'Green (Default)', value: '#16a34a', class: 'bg-green-600' },
  { name: 'Emerald', value: '#059669', class: 'bg-emerald-600' },
  { name: 'Teal', value: '#0d9488', class: 'bg-teal-600' },
  { name: 'Blue', value: '#2563eb', class: 'bg-blue-600' },
  { name: 'Indigo', value: '#4f46e5', class: 'bg-indigo-600' },
  { name: 'Purple', value: '#9333ea', class: 'bg-purple-600' },
  { name: 'Pink', value: '#db2777', class: 'bg-pink-600' },
  { name: 'Red', value: '#dc2626', class: 'bg-red-600' },
  { name: 'Orange', value: '#ea580c', class: 'bg-orange-600' },
  { name: 'Amber', value: '#d97706', class: 'bg-amber-600' },
  { name: 'Yellow', value: '#ca8a04', class: 'bg-yellow-600' },
  { name: 'Lime', value: '#65a30d', class: 'bg-lime-600' },
]

// Alert frequency options
export const alertFrequencyOptions = [
  { value: 'daily', label: 'Daily', description: 'Receive notifications every day' },
  { value: 'weekly', label: 'Weekly', description: 'Receive notifications once per week' },
  { value: 'monthly', label: 'Monthly', description: 'Receive notifications once per month' },
] as const

// Polling interval presets (in minutes)
export const pollingIntervalPresets = [
  { value: 5, label: '5 minutes', description: 'High frequency monitoring' },
  { value: 10, label: '10 minutes', description: 'Frequent monitoring' },
  { value: 15, label: '15 minutes (Default)', description: 'Balanced monitoring' },
  { value: 30, label: '30 minutes', description: 'Standard monitoring' },
  { value: 60, label: '1 hour', description: 'Low frequency monitoring' },
  { value: 120, label: '2 hours', description: 'Minimal monitoring' },
]
