import { useState, useCallback } from 'react'
import {
  scheduleService,
  type CreateScheduleRequest,
  type ScheduleDetail,
  type ScheduleListItem,
  type ScheduleStatusString,
} from '@/shared/api/scheduleService'
import { farmActivityService } from '@/shared/api/farmActivityService'
import { handleCreateError, normalizeError, mapErrorToVietnamese } from '@/shared/lib/error-handler'
import { toastManager, showErrorToast } from '@/shared/lib/toast-manager'
import { validateSchedulePayload } from '../utils/form'

export function useScheduleActions(
  allSchedules: ScheduleListItem[],
  load: () => Promise<void>,
  loadAllSchedules: () => Promise<ScheduleListItem[]>
) {
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  const ensureScheduleValidity = useCallback(
    (payload: CreateScheduleRequest, currentScheduleId?: number) => {
      const result = validateSchedulePayload(payload, allSchedules, currentScheduleId)
      if (!result.valid) {
        toastManager.error(result.errors.map(err => `• ${err}`).join('\n'))
        return false
      }
      return true
    },
    [allSchedules]
  )

  const handleViewDetail = useCallback(
    async (schedule: ScheduleListItem, onSuccess?: (detail: ScheduleDetail) => void) => {
      if (!schedule.scheduleId) return
      setActionLoading({ [`detail-${schedule.scheduleId}`]: true })
      try {
        const res = await scheduleService.getScheduleById(schedule.scheduleId)
        const normalized = { ...(res.data || {}), diseaseStatus: (res.data as any)?.diseaseStatus }
        onSuccess?.(normalized)
      } catch (e) {
        const normalized = normalizeError(e)
        const display = normalized.backendMessage ?? mapErrorToVietnamese(e).vietnamese
        toastManager.error(display || 'Không thể tải chi tiết thời vụ')
      } finally {
        setActionLoading({ [`detail-${schedule.scheduleId}`]: false })
      }
    },
    []
  )

  const handleCreateSchedule = useCallback(
    async (payload: CreateScheduleRequest, onSuccess?: () => void) => {
      if (!ensureScheduleValidity(payload)) return

      setActionLoading({ create: true })
      try {
        await scheduleService.createSchedule(payload)
        toastManager.success('Tạo thời vụ thành công')
        await load()
        await loadAllSchedules()
        onSuccess?.()
      } catch (e) {
        handleCreateError(e, toastManager, 'thời vụ')
      } finally {
        setActionLoading({ create: false })
      }
    },
    [ensureScheduleValidity, load, loadAllSchedules]
  )

  const handleUpdateSchedule = useCallback(
    async (scheduleId: number, payload: CreateScheduleRequest, onSuccess?: () => void) => {
      if (!ensureScheduleValidity(payload, scheduleId)) return

      setActionLoading({ [`update-${scheduleId}`]: true })
      try {
        const response = await scheduleService.updateSchedule(scheduleId, payload)
        if (response?.message) {
          toastManager.success(response.message)
        }
        await load()
        await loadAllSchedules()
        onSuccess?.()
      } catch (e: any) {
        if (e?.message) {
          showErrorToast(e)
        }
      } finally {
        setActionLoading({ [`update-${scheduleId}`]: false })
      }
    },
    [ensureScheduleValidity, load, loadAllSchedules]
  )

  const handleAssignStaff = useCallback(
    async (scheduleId: number, staffId: number, onSuccess?: () => void) => {
      setActionLoading({ [`assign-${scheduleId}`]: true })
      try {
        const response = await scheduleService.assignStaff(scheduleId, staffId)
        if (response?.message) {
          toastManager.success(response.message)
        }
        await load()
        await loadAllSchedules()
        onSuccess?.()
      } catch (e: any) {
        if (e?.message) {
          showErrorToast(e)
        }
      } finally {
        setActionLoading({ [`assign-${scheduleId}`]: false })
      }
    },
    [load, loadAllSchedules]
  )

  const handleUpdateStatus = useCallback(
    async (
      schedule: ScheduleListItem,
      nextStatus: ScheduleStatusString,
      onSuccess?: () => void
    ) => {
      if (!schedule.scheduleId) return
      setActionLoading({ [`status-${schedule.scheduleId}`]: true })
      try {
        const response = await scheduleService.updateScheduleStatus(schedule.scheduleId, nextStatus)
        if (response?.message) {
          toastManager.success(response.message)
        }
        await load()
        await loadAllSchedules()
        onSuccess?.()
      } catch (e: any) {
        if (e?.message) {
          showErrorToast(e)
        }
      } finally {
        setActionLoading({ [`status-${schedule.scheduleId}`]: false })
      }
    },
    [load, loadAllSchedules]
  )

  const handleUpdateToday = useCallback(
    async (scheduleId: number, customDate?: string, onSuccess?: () => void) => {
      setActionLoading({ [`update-today-${scheduleId}`]: true })
      try {
        await scheduleService.updateToday(scheduleId, customDate)
        toastManager.success('Cập nhật giai đoạn theo ngày thành công')
        onSuccess?.()
      } catch (e) {
        const normalized = normalizeError(e)
        const display = normalized.backendMessage ?? mapErrorToVietnamese(e).vietnamese
        toastManager.error(display || 'Cập nhật giai đoạn thất bại')
      } finally {
        setActionLoading({ [`update-today-${scheduleId}`]: false })
      }
    },
    []
  )

  const handleCreateActivity = useCallback(
    async (
      payload: {
        startDate: string
        endDate: string
        scheduleId: number
        staffId?: number
        activityType: string
      },
      onSuccess?: () => void
    ) => {
      if (!payload.activityType) {
        toastManager.error('Vui lòng chọn loại hoạt động')
        return
      }

      if (!payload.startDate || !payload.endDate) {
        toastManager.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
        return
      }

      const activityPayload: any = {
        startDate: payload.startDate,
        endDate: payload.endDate,
        scheduleId: payload.scheduleId,
      }
      if (payload.staffId && Number(payload.staffId) > 0)
        activityPayload.staffId = Number(payload.staffId)

      try {
        const response = await farmActivityService.createFarmActivity(
          activityPayload,
          payload.activityType
        )
        if (response?.status === 1) {
          if (response?.message) toastManager.success(response.message)
          await load()
          await loadAllSchedules()
          onSuccess?.()
        } else {
          const msg = response?.message
          if (msg) throw new Error(msg)
        }
      } catch (err) {
        const normalized = normalizeError(err)
        const display = normalized.backendMessage ?? mapErrorToVietnamese(err).vietnamese
        toastManager.error(display || (err as any)?.message || 'Tạo hoạt động thất bại')
      }
    },
    [load, loadAllSchedules]
  )

  return {
    actionLoading,
    ensureScheduleValidity,
    handleViewDetail,
    handleCreateSchedule,
    handleUpdateSchedule,
    handleAssignStaff,
    handleUpdateStatus,
    handleUpdateToday,
    handleCreateActivity,
  }
}
