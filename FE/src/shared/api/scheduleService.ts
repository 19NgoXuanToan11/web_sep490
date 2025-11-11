import { http } from '@/shared/api/client'

export interface ScheduleListItem {
  startDate: string
  endDate: string
  quantity: number
  status: number
  pesticideUsed: boolean
  plantingDate?: string
  harvestDate?: string
  diseaseStatus?: number
  createdAt: string
  updatedAt?: string
}

export interface PaginatedSchedules {
  status: number
  message: string
  data: {
    totalItemCount: number
    pageSize: number
    totalPagesCount: number
    pageIndex: number
    next: boolean
    previous: boolean
    items: ScheduleListItem[]
  }
}

export interface CreateScheduleRequest {
  farmId: number
  cropId: number
  staffId: number
  startDate: string
  endDate: string
  quantity: number
  status: number
  pesticideUsed: boolean
  diseaseStatus: number
  farmActivitiesId: number
}

export interface BasicResponse<T = unknown> {
  status: number
  message: string
  data: T
}

export const scheduleService = {
  async getScheduleList(pageIndex = 1, pageSize = 10): Promise<PaginatedSchedules> {
    const res = await http.get<PaginatedSchedules>(
      `/v1/Schedule/schedule-list?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    return res.data
  },

  async createSchedule(payload: CreateScheduleRequest): Promise<BasicResponse> {
    const res = await http.post<BasicResponse>('/v1/Schedule/schedule-create', payload)
    return res.data
  },
}
