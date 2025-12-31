import { http } from '@/shared/api/client'

export interface ScheduleLogItem {
  id: number
  notes: string
  createdAt?: string
  createdBy?: number
  updatedAt?: string
  updatedBy?: number
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
      items: (data.items || []).map((it: any) => ({
        id: it.cropLogId ?? it.id,
        notes: it.notes ?? '',
        createdAt: it.createdAt ?? it.created_at ?? null,
        createdBy: it.createdBy ?? it.created_by ?? null,
        updatedAt: it.updatedAt ?? it.updated_at ?? null,
        updatedBy: it.updatedBy ?? it.updated_by ?? null,
      })),
    }
    return mapped
  },

  async createLog(payload: { scheduleId: number; notes: string; timestamp?: string }) {
    const body: any = { scheduleId: payload.scheduleId, notes: payload.notes }
    if (payload.timestamp) body.createdAt = payload.timestamp
    const res = await http.post('/v1/schedule-log/create-log', body)
    return res.data
  },

  async updateLog(payload: { id: number; notes: string }) {
    const body = { cropLogId: payload.id, notes: payload.notes }
    const res = await http.put('/v1/schedule-log/update-log', body)
    return res.data
  },
}
