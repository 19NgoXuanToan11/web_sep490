import { http } from './client'

export interface FarmActivity {
  farmActivitiesId: number
  activityType: string
  startDate: string
  endDate: string
  status: string
}

export interface FarmActivityRequest {
  activityType: string
  startDate: string
  endDate: string
  status: string
}

export interface FarmActivityUpdate {
  activityType: string
  startDate: string
  endDate: string
  status: string
}

export interface FarmActivityResponse {
  status: number
  message: string
  data?: any
}

export const farmActivityService = {

  getAllFarmActivities: async (): Promise<FarmActivity[]> => {
    const response = await http.get<FarmActivity[]>('/v1/farm-activity/get-all')
    return response.data
  },

  createFarmActivity: async (activityData: FarmActivityRequest): Promise<FarmActivityResponse> => {
    const response = await http.post<FarmActivityResponse>('/v1/farm-activity/create', activityData)
    return response.data
  },

  updateFarmActivity: async (
    id: number,
    activityData: FarmActivityUpdate
  ): Promise<FarmActivityResponse> => {
    const response = await http.put<FarmActivityResponse>(
      `/v1/farm-activity/update/${id}`,
      activityData
    )
    return response.data
  },

  changeStatus: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.put<FarmActivityResponse>(`/v1/farm-activity/change-status/${id}`)
    return response.data
  },

  deleteFarmActivity: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.delete<FarmActivityResponse>(`/v1/farm-activity/delete/${id}`)
    return response.data
  },
}
