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

  getAllCrops: async (pageIndex: number = 1, pageSize: number = 10): Promise<PaginatedCrops> => {
    const response = await http.get<PaginatedCrops>(
      `/v1/crop/get-all?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    return response.data
  },

  getAllCropsActive: async (): Promise<Crop[]> => {
    const response = await http.get<Crop[]>('/v1/crop/get-all-active')
    return response.data
  },

  createCrop: async (cropData: CropRequest): Promise<CropResponse> => {
    const response = await http.post<CropResponse>('/v1/crop/create', cropData)
    return response.data
  },

  changeStatus: async (cropId: number): Promise<CropResponse> => {
    const response = await http.put<CropResponse>(`/v1/crop/chang-status?cropId=${cropId}`)
    return response.data
  },

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

  updateCrop: async (cropId: number, cropData: CropUpdate): Promise<CropResponse> => {
    const response = await http.put<CropResponse>(`/v1/crop/update/${cropId}`, cropData)
    return response.data
  },
}
