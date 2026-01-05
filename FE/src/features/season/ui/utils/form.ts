import type { CreateScheduleRequest, ScheduleListItem } from '../types'

export const toDateOnly = (value?: string) => {
  if (!value) return null
  const dt = new Date(`${value}T00:00:00`)
  return Number.isNaN(dt.getTime()) ? null : dt
}

export const rangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA <= endB && startB <= endA

export const buildEmptyScheduleForm = (): CreateScheduleRequest => ({
  farmId: 0,
  cropId: 0,
  staffId: 0,
  startDate: '',
  endDate: '',
  plantingDate: '',
  harvestDate: '',
  quantity: 0,
  status: 0,
  pesticideUsed: false,
  diseaseStatus: null,
  farmActivitiesId: 0,
})

export const validateSchedulePayload = (
  payload: CreateScheduleRequest,
  allSchedules: ScheduleListItem[],
  currentScheduleId?: number
) => {
  const errors: string[] = []
  const start = toDateOnly(payload.startDate)
  const end = toDateOnly(payload.endDate)
  const planting = toDateOnly(payload.plantingDate)
  const harvest = toDateOnly(payload.harvestDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!payload.farmId) errors.push('Vui lòng chọn nông trại.')
  if (!payload.cropId) errors.push('Vui lòng chọn mùa vụ.')
  if (!payload.quantity || payload.quantity <= 0) errors.push('Số lượng phải lớn hơn 0.')
  if (!start) errors.push('Ngày bắt đầu không hợp lệ.')
  if (!end) errors.push('Ngày kết thúc không hợp lệ.')

  const ensureFuture = (date: Date | null, label: string) => {
    if (date && date < today) {
      errors.push(`${label} không được nằm trong quá khứ.`)
    }
  }

  ensureFuture(start, 'Ngày bắt đầu')
  ensureFuture(end, 'Ngày kết thúc')
  if (planting) ensureFuture(planting, 'Ngày gieo trồng')
  if (harvest) ensureFuture(harvest, 'Ngày thu hoạch')

  if (start && end && start >= end) {
    errors.push('Ngày bắt đầu phải trước ngày kết thúc và không trùng nhau.')
  }

  if (planting && harvest && planting >= harvest) {
    errors.push('Ngày gieo trồng phải trước ngày thu hoạch.')
  }

  if (start && planting && planting < start) {
    errors.push('Ngày gieo trồng phải nằm trong khoảng của lịch.')
  }

  if (end && planting && planting > end) {
    errors.push('Ngày gieo trồng phải nằm trong khoảng của lịch.')
  }

  if (start && harvest && harvest < start) {
    errors.push('Ngày thu hoạch phải nằm sau ngày bắt đầu.')
  }

  if (end && harvest && harvest > end) {
    errors.push('Ngày thu hoạch phải nằm trong khoảng của lịch.')
  }

  if (start && end && payload.farmId && payload.cropId && allSchedules.length) {
    const hasOverlap = allSchedules.some(s => {
      if (!s.startDate || !s.endDate) return false
      if (currentScheduleId && s.scheduleId === currentScheduleId) return false
      if (s.farmId !== payload.farmId || s.cropId !== payload.cropId) return false
      const existingStart = toDateOnly(s.startDate)
      const existingEnd = toDateOnly(s.endDate)
      if (!existingStart || !existingEnd) return false
      return rangesOverlap(existingStart, existingEnd, start, end)
    })
    if (hasOverlap) {
      errors.push('Khoảng thời gian bị trùng với lịch khác của cùng nông trại/cây trồng.')
    }
  }

  if (planting && payload.diseaseStatus !== null && payload.diseaseStatus !== undefined) {
    const daysDiff = Math.floor((planting.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff >= 0 || (daysDiff >= -7 && daysDiff < 0)) {
      if (payload.diseaseStatus >= 0) {
        errors.push(
          'Cây mới gieo trồng (trong vòng 7 ngày gần đây hoặc trong tương lai) không thể có tình trạng bệnh. Vui lòng chọn "Không có bệnh".'
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
