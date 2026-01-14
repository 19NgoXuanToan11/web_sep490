import { http } from './client'
import type { PlantStage } from './cropRequirementService'

export interface FarmActivity {
  farmActivitiesId: number
  activityType: string
  startDate: string
  endDate: string
  status: string
  plantStage?: PlantStage | null
  staffId?: number | null
  staffEmail?: string | null
  staffFullName?: string | null
  staffPhone?: string | null
}

export interface FarmActivityRequest {
  startDate: string
  endDate: string
  staffId?: number
  scheduleId?: number
}

export interface FarmActivityUpdate {
  startDate: string
  endDate: string
  staffId?: number
  scheduleId?: number
}

export interface FarmActivityResponse {
  status: number
  message: string
  data?: any
}

export interface PaginationData<T> {
  totalItemCount: number
  pageSize: number
  totalPagesCount: number
  pageIndex: number
  next: boolean
  previous: boolean
  items: T[]
}

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface GetAllFarmActivitiesParams {
  type?: string
  status?: string
  month?: number
  pageIndex?: number
  pageSize?: number
}

export const farmActivityService = {
  getAllFarmActivities: async (
    params?: GetAllFarmActivitiesParams
  ): Promise<PaginationData<FarmActivity>> => {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.month) queryParams.append('month', params.month.toString())
    if (params?.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())

    const queryString = queryParams.toString()
    const url = `/v1/farm-activity/get-all${queryString ? `?${queryString}` : ''}`
    const response = await http.get<ApiResponse<PaginationData<FarmActivity>>>(url)
    return response.data.data
  },

  getActiveFarmActivities: async (
    params: { scheduleId?: number; pageIndex?: number; pageSize?: number } = {}
  ): Promise<PaginationData<FarmActivity>> => {
    const queryParams = new URLSearchParams()
    if (params.scheduleId !== undefined)
      queryParams.append('scheduleId', params.scheduleId.toString())
    if (params.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())

    const url = `/v1/farm-activity/get-active${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await http.get<ApiResponse<PaginationData<FarmActivity>>>(url)
    const payload = response?.data?.data
    if (payload && typeof payload === 'object' && Array.isArray((payload as any).items)) {
      return payload
    }

    return {
      totalItemCount: 0,
      pageSize: 0,
      totalPagesCount: 0,
      pageIndex: 0,
      next: false,
      previous: false,
      items: [],
    }
  },

  getFarmActivityById: async (id: number): Promise<FarmActivity> => {
    const response = await http.get<ApiResponse<FarmActivity>>(`/v1/farm-activity/get-by-id/${id}`)
    return response.data.data
  },

  createFarmActivity: async (
    activityData: FarmActivityRequest,
    activityType: string
  ): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    queryParams.append('activityType', activityType)
    const url = `/v1/farm-activity/create?${queryParams.toString()}`
    const response = await http.post<FarmActivityResponse>(url, activityData)
    return response.data
  },

  updateFarmActivity: async (
    id: number,
    activityData: FarmActivityUpdate,
    activityType: string,
    status: string
  ): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    queryParams.append('activityType', activityType)
    queryParams.append('farmActivityStatus', status)
    const url = `/v1/farm-activity/update/${id}?${queryParams.toString()}`
    const response = await http.put<FarmActivityResponse>(url, activityData)
    return response.data
  },

  changeStatus: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.put<FarmActivityResponse>(`/v1/farm-activity/change-status/${id}`)
    return response.data
  },

  setStatus: async (
    id: number,
    status: string,
    activityType?: string,
    payload?: Partial<FarmActivityUpdate>
  ): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    if (activityType) queryParams.append('activityType', activityType)
    queryParams.append('farmActivityStatus', status)
    const url = `/v1/farm-activity/update/${id}?${queryParams.toString()}`
    const response = await http.put<FarmActivityResponse>(url, payload ?? {})
    return response.data
  },

  completeFarmActivity: async (id: number, location?: string): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    if (location) queryParams.append('location', location)
    const url = `/v1/farm-activity/complete/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await http.put<FarmActivityResponse>(url)
    return response.data
  },

  getStaffByFarmActivityId: async (farmActivityId: number): Promise<any> => {
    const url = `/v1/farm-activity/staff-activity/get-staff/${farmActivityId}`
    const response = await http.get<ApiResponse<any>>(url)
    return response.data.data
  },

  addStaffToFarmActivity: async (
    farmActivityId: number,
    staffId: number
  ): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    queryParams.append('farmActivityId', String(farmActivityId))
    queryParams.append('staffId', String(staffId))
    const url = `/v1/farm-activity/staff-activity/bind?${queryParams.toString()}`
    const response = await http.post<FarmActivityResponse>(url, {})
    return response.data
  },

  updateStaffToFarmActivity: async (
    stafFarmActivityId: number | string,
    staffId: number
  ): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    queryParams.append('Staf_farmActivityId', String(stafFarmActivityId))
    queryParams.append('staffId', String(staffId))
    const url = `/v1/farm-activity/update-staf-activity?${queryParams.toString()}`
    const response = await http.put<FarmActivityResponse>(url, {})
    return response.data
  },

  deleteFarmActivity: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.delete<FarmActivityResponse>(`/v1/farm-activity/delete/${id}`)
    return response.data
  },
}
