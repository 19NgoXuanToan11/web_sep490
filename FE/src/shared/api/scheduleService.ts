import { http } from '@/shared/api/client'

export interface ScheduleListItem {
  scheduleId?: number
  farmId?: number
  cropId?: number
  staffId?: number
  farmActivitiesId?: number
  startDate: string
  endDate: string
  plantingDate?: string
  harvestDate?: string
  quantity: number
  status: number | ScheduleStatusString
  pesticideUsed: boolean
  diseaseStatus?: number
  createdAt: string
  updatedAt?: string
  managerName?: string
  staffName?: string
  farmView?: {
    farmId: number
    farmName?: string
    location?: string
    createdAt?: string
    updatedAt?: string
  }
  cropView?: {
    cropId: number
    cropName?: string
    description?: string
    status?: string
    origin?: string
    plantingDate?: string
    harvestDate?: string
    plantStage?: string
  }
  farmActivityView?: {
    farmActivitiesId: number
    activityType?: string
    startDate?: string
    endDate?: string
    status?: string
  }
  staff?: {
    accountId: number
    fullname?: string
    phone?: string
    createdAt?: string
    updatedAt?: string
    email?: string
    accountProfile?: {
      fullname?: string
      phoneNumber?: string
    }
  }
}

export interface ScheduleDetail extends ScheduleListItem {
  scheduleId: number
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
  plantingDate: string
  harvestDate: string
  quantity: number
  status: number
  pesticideUsed: boolean
  diseaseStatus?: number | null
  farmActivitiesId: number
}

export interface BasicResponse<T = unknown> {
  status: number
  message: string
  data: T
}

export type ScheduleStatusString = 'ACTIVE' | 'DEACTIVATED'

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

  async getScheduleById(scheduleId: number): Promise<BasicResponse<ScheduleDetail>> {
    const res = await http.get<BasicResponse<ScheduleDetail>>(
      `/v1/Schedule/schedule-byId?id=${scheduleId}`
    )
    return res.data
  },

  async updateSchedule(scheduleId: number, payload: CreateScheduleRequest): Promise<BasicResponse> {
    const res = await http.put<BasicResponse>(
      `/v1/Schedule/schedule-update?scheduleId=${scheduleId}`,
      payload
    )
    return res.data
  },

  async assignStaff(scheduleId: number, staffId: number): Promise<BasicResponse> {
    const res = await http.put<BasicResponse>(
      `/v1/Schedule/schedule-assign-staff?scheduleId=${scheduleId}`,
      staffId
    )
    return res.data
  },

  async updateScheduleStatus(
    scheduleId: number,
    status: ScheduleStatusString
  ): Promise<BasicResponse> {
    const res = await http.put<BasicResponse>(
      `/v1/Schedule/schedule-update-status?scheduleId=${scheduleId}`,
      status
    )
    return res.data
  },

  async getSchedulesByStaff(): Promise<BasicResponse<ScheduleListItem[]>> {
    const res = await http.get<BasicResponse<ScheduleListItem[]>>(`/v1/Schedule/schedule-by-staff`)
    return res.data
  },
}
