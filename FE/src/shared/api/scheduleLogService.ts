import { http } from '@/shared/api/client'

export interface ScheduleLogItem {
  id: number
  notes: string
  createdAt?: string | null
  createdBy?: number | null
  updatedAt?: string | null
  updatedBy?: number | null
  staffNameCreate?: string | null
  staffNameUpdate?: string | null
  farmActivityId?: number | null
  farmActivityName?: string | null
}

export interface PaginatedLogs {
  totalItemCount: number
  pageSize: number
  totalPagesCount: number
  pageIndex: number
  next?: boolean
  previous?: boolean
  items: ScheduleLogItem[]
}

export const scheduleLogService = {
  async getLogsBySchedule(scheduleId: number, pageIndex = 1, pageSize = 10) {
    const res = await http.get<any>(
      `/v1/schedule-log/get-all-log-by-schedule/${scheduleId}?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    const raw = res.data
    const data = raw?.data || { totalItemCount: 0, items: [] }
    const mapped: PaginatedLogs = {
      totalItemCount: data.totalItemCount ?? 0,
      pageSize: data.pageSize ?? pageSize,
      totalPagesCount: data.totalPagesCount ?? 1,
      pageIndex: data.pageIndex ?? pageIndex,
      next: data.next ?? false,
      previous: data.previous ?? false,
      items: (data.items || []).map((it: any) => {
        const rawCreatedBy = it.createdBy ?? it.created_by ?? it.createBy ?? it.create_by ?? null
        const staffNameFromCreatedBy =
          typeof rawCreatedBy === 'string' && rawCreatedBy.trim() ? rawCreatedBy.trim() : null
        return {
          id: it.cropLogId ?? it.id,
          notes: it.notes ?? '',
          createdAt: it.createdAt ?? it.created_at ?? null,
          createdBy: it.createdBy ?? it.created_by ?? null,
          updatedAt: it.updatedAt ?? it.updated_at ?? null,
          updatedBy: it.updatedBy ?? it.updated_by ?? null,
          farmActivityId: it.farmActivityId ?? it.farm_activity_id ?? it.farm_activityId ?? null,
          farmActivityName:
            it.activityName ?? it.activity_name ?? it.activityType ?? it.activity_type ?? null,
          staffNameCreate:
            it.staffNameCreate ??
            it.staff_name_create ??
            it.createBy ??
            it.CreateBy ??
            it.create_by ??
            it.staffName ??
            staffNameFromCreatedBy ??
            null,
          staffNameUpdate:
            it.staffNameUpdate ??
            it.staff_name_update ??
            it.updateBy ??
            it.UpdateBy ??
            it.update_by ??
            null,
        }
      }),
    }
    return mapped
  },

  async createLog(payload: {
    scheduleId: number
    notes: string
    farmActivityId?: number | null
    timestamp?: string
  }) {
    const body: any = {
      scheduleId: payload.scheduleId,
      notes: payload.notes,
      farmActivityId: payload.farmActivityId ?? null,
    }
    if (payload.timestamp) body.createdAt = payload.timestamp
    const res = await http.post('/v1/schedule-log/create-log', body)
    return res.data
  },

  async updateLog(payload: { id: number; notes: string }) {
    const body = { logId: payload.id, notes: payload.notes }
    const res = await http.put('/v1/schedule-log/update-log', body)
    return res.data
  },

  async checkToday(farmActivityId: number, scheduleId: number) {
    const url = `/v1/schedule-log/check-today?farmActivityId=${farmActivityId}&scheduleId=${scheduleId}`
    const res = await http.get<any>(url)
    const raw = res.data
    const payload = raw?.data ?? raw
    const exists =
      payload?.exists ??
      payload?.Exists ??
      payload?.Data?.Exists ??
      payload?.data?.exists ??
      false
    return { exists: Boolean(exists), data: payload }
  },
}
