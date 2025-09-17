import { http } from './client'

export interface Crop {
  cropId: number
  cropName: string
  description: string
  quantity: number
  status: string
  plantingDate: string
  harvestDate: string
}

export interface CropRequest {
  cropName: string
  description: string
  quantity: number
  plantingDate: string
  harvestDate: string
}

export interface CropUpdate {
  cropName: string
  description: string
  quantity: number
  plantingDate: string
}

export interface CropResponse {
  status: number
  message: string
  data?: any
}

export interface PaginatedCrops {
  totalItemCount: number
  pageSize: number
  pageIndex: number
  items: Crop[]
}

export const cropService = {
  // Lấy tất cả crops với phân trang
  getAllCrops: async (pageIndex: number = 1, pageSize: number = 10): Promise<PaginatedCrops> => {
    const response = await http.get<PaginatedCrops>(
      `/v1/crop/get-all?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    return response.data
  },

  // Lấy tất cả crops active
  getAllCropsActive: async (): Promise<Crop[]> => {
    const response = await http.get<Crop[]>('/v1/crop/get-all-active')
    return response.data
  },

  // Tạo crop mới
  createCrop: async (cropData: CropRequest): Promise<CropResponse> => {
    const response = await http.post<CropResponse>('/v1/crop/create', cropData)
    return response.data
  },

  // Thay đổi trạng thái crop
  changeStatus: async (cropId: number): Promise<CropResponse> => {
    const response = await http.put<CropResponse>(`/v1/crop/chang-status?cropId=${cropId}`)
    return response.data
  },

  // Tìm kiếm crops
  searchCrop: async (
    cropName?: string,
    status?: string,
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<CropResponse> => {
    const params = new URLSearchParams()
    if (cropName) params.append('cropName', cropName)
    if (status) params.append('status', status)
    params.append('pageIndex', pageIndex.toString())
    params.append('pageSize', pageSize.toString())

    const response = await http.post<CropResponse>(`/v1/crop/search?${params.toString()}`)
    return response.data
  },

  // Cập nhật crop
  updateCrop: async (cropId: number, cropData: CropUpdate): Promise<CropResponse> => {
    const response = await http.put<CropResponse>(`/v1/crop/update/${cropId}`, cropData)
    return response.data
  },
}
