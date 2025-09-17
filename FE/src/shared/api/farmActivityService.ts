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
  // Lấy tất cả farm activities
  getAllFarmActivities: async (): Promise<FarmActivity[]> => {
    const response = await http.get<FarmActivity[]>('/v1/farm-activity/get-all')
    return response.data
  },

  // Tạo farm activity mới (sẽ có sau khi backend bổ sung)
  createFarmActivity: async (activityData: FarmActivityRequest): Promise<FarmActivityResponse> => {
    const response = await http.post<FarmActivityResponse>('/v1/farm-activity/create', activityData)
    return response.data
  },

  // Cập nhật farm activity (sẽ có sau khi backend bổ sung)
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

  // Thay đổi trạng thái farm activity (sẽ có sau khi backend bổ sung)
  changeStatus: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.put<FarmActivityResponse>(`/v1/farm-activity/change-status/${id}`)
    return response.data
  },

  // Xóa farm activity (sẽ có sau khi backend bổ sung)
  deleteFarmActivity: async (id: number): Promise<FarmActivityResponse> => {
    const response = await http.delete<FarmActivityResponse>(`/v1/farm-activity/delete/${id}`)
    return response.data
  },
}
