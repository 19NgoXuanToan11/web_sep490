import { z } from 'zod'

// Schedule form validation schema
export const scheduleFormSchema = z
  .object({
    title: z.string().min(1, 'Tên lịch là bắt buộc').max(100, 'Tên lịch phải ít hơn 100 ký tự'),
    deviceId: z.string().min(1, 'Việc chọn thiết bị là bắt buộc'),
    recurrenceType: z.enum(['daily', 'weekly', 'interval'], {
      required_error: 'Kiểu lặp là bắt buộc',
    }),
    startTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ (HH:MM)'),
    endTime: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ (HH:MM)'),
    moistureThresholdPct: z
      .number()
      .min(0, 'Ngưỡng độ ẩm phải ít nhất 0%')
      .max(100, 'Ngưỡng độ ẩm không thể vượt quá 100%'),
    enabled: z.boolean().default(true),
  })
  .refine(
    data => {
      // Validate that end time is after start time
      const [startHour, startMin] = data.startTime.split(':').map(Number)
      const [endHour, endMin] = data.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      return endMinutes > startMinutes
    },
    {
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endTime'],
    }
  )

// Rule form validation schema
export const ruleFormSchema = z.object({
  name: z.string().min(1, 'Tên quy tắc là bắt buộc').max(100, 'Tên phải ít hơn 100 ký tự'),
  conditionText: z
    .string()
    .min(10, 'Mô tả điều kiện phải ít nhất 10 ký tự')
    .max(500, 'Mô tả điều kiện phải ít hơn 500 ký tự'),
  enabled: z.boolean().default(true),
})

// Device action schema
export const deviceActionSchema = z.object({
  type: z.enum(['start', 'stop', 'pause', 'run-now'], {
    required_error: 'Loại hành động là bắt buộc',
  }),
  deviceId: z.string().min(1, 'ID thiết bị là bắt buộc'),
})

// Form data types (inferred from schemas)
export type ScheduleFormData = z.infer<typeof scheduleFormSchema>
export type RuleFormData = z.infer<typeof ruleFormSchema>
export type DeviceActionData = z.infer<typeof deviceActionSchema>
