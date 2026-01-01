import { z } from 'zod'

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

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>
