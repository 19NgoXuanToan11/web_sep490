import { http } from './client'
import type { PlantStage } from './cropRequirementService'

export interface FarmActivity {
  farmActivitiesId: number
  activityType: string
  startDate: string
  endDate: string
  status: string
  plantStage?: PlantStage | null
}

export interface FarmActivityRequest {
  startDate: string
  endDate: string
}

export interface FarmActivityUpdate {
  startDate: string
  endDate: string
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
    scheduleId: number = 0,
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<PaginationData<FarmActivity>> => {
    const queryParams = new URLSearchParams()
    queryParams.append('pageIndex', pageIndex.toString())
    queryParams.append('pageSize', pageSize.toString())
    const url = `/v1/farm-activity/get-active?scheduleId=${scheduleId}&${queryParams.toString()}`
    const response = await http.get<ApiResponse<PaginationData<FarmActivity>>>(url)
    return response.data.data
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

  completeFarmActivity: async (id: number, location?: string): Promise<FarmActivityResponse> => {
    const queryParams = new URLSearchParams()
    if (location) queryParams.append('location', location)
    const url = `/v1/farm-activity/complete/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await http.put<FarmActivityResponse>(url)
    return response.data
  },

  deleteFarmActivity: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.delete<FarmActivityResponse>(`/v1/farm-activity/delete/${id}`)
    return response.data
  },
}
