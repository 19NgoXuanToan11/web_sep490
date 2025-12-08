import { http } from './client'

// Crop requirement as returned in the GET /api/v1/crop/get-all response
export interface CropRequirement {
  cropRequirementId: number
  cropId: number
  plantStage: string
  estimatedDate: number
  moisture: number
  temperature: number
  fertilizer: string
  lightRequirement: number
  wateringFrequency: string
  notes?: string
  isActive?: boolean
  createdDate?: string
  updatedDate?: string | null
}

// View model returned from the backend crop endpoints
export interface Crop {
  cropId: number
  cropName: string
  description: string
  status: string
  origin?: string
  cropRequirement?: CropRequirement[]
}

// Payload sent inside request1 when creating or updating a crop
export interface CropRequest {
  cropName: string
  description?: string
  origin: string
  categoryId: number
}

// Product payload embedded in request2 when creating a crop
export interface CropProductRequest {
  productName: string
  price: number
  images?: string
  description?: string
}

// Combined payload sent to POST /v1/crop/create
export interface CreateCropWithProductRequest {
  request1: CropRequest
  request2: CropProductRequest
}

export interface CropResponse {
  status: number
  message: string
  data?: any
}

export interface PaginatedCrops {
  totalItemCount: number
  pageSize: number
  totalPagesCount: number
  pageIndex: number
  next: boolean
  previous: boolean
  items: Crop[]
}

export const cropService = {
  getAllCrops: async (pageIndex: number = 1, pageSize: number = 10): Promise<PaginatedCrops> => {
    const response = await http.get<PaginatedCrops>(
      `/v1/crop/get-all?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    return response.data
  },

  // Convenience helper used by selectors that just need a flat crop list
  getAllCropsList: async (pageSize: number = 1000): Promise<Crop[]> => {
    const response = await http.get<PaginatedCrops>(
      `/v1/crop/get-all?pageIndex=1&pageSize=${pageSize}`
    )
    return response.data.items ?? []
  },

  createCrop: async (payload: CreateCropWithProductRequest): Promise<CropResponse> => {
    const response = await http.post<CropResponse>('/v1/crop/create', payload)
    return response.data
  },

  changeStatus: async (cropId: number, status: number): Promise<CropResponse> => {
    const response = await http.put<CropResponse>(
      `/v1/crop/chang-status?cropId=${cropId}&status=${status}`
    )
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

  updateCrop: async (cropId: number, cropData: CropRequest): Promise<CropResponse> => {
    const response = await http.put<CropResponse>(`/v1/crop/update/${cropId}`, cropData)
    return response.data
  },
}
