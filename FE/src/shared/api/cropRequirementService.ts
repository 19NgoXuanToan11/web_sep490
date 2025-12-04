import { http } from './client'

// Backend enum: Domain.Enum.PlantStage
// public enum PlantStage
// {
//   Germination,   // 0–7 days
//   Seedling,      // 8–18 days
//   Vegetative,    // 19–35 days
//   Harvest        // 36–37 days
// }
export type PlantStage = 'Germination' | 'Seedling' | 'Vegetative' | 'Harvest'

export interface CropRequirementPayload {
  estimatedDate?: number | null
  moisture?: number | null
  temperature?: number | null
  fertilizer?: string | null
  lightRequirement?: number | null
  wateringFrequency?: string | null
  notes?: string | null
}

export interface CropRequirementView {
  cropRequirementId: number
  cropId: number
  cropName?: string | null
  plantStage?: string | null
  estimatedDate?: number | null
  moisture?: number | null
  temperature?: number | null
  fertilizer?: string | null
  lightRequirement?: number | null
  wateringFrequency?: string | null
  notes?: string | null
  isActive: boolean
  createdDate: string
  updatedDate?: string | null
}

export interface CropRequirementApiResponse<T> {
  status: number
  message?: string
  data?: T
}

const BASE_URL = '/v1/crop-requirement'

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const cropRequirementService = {
  async getAll() {
    const response = await http.get<CropRequirementApiResponse<CropRequirementView[]>>(
      `${BASE_URL}/get-all`
    )
    return response.data
  },

  async getByCropId(cropId: number) {
    const response = await http.get<CropRequirementApiResponse<CropRequirementView[]>>(
      `${BASE_URL}/get-by-crop-id${buildQuery({ cropId })}`
    )
    return response.data
  },

  async getById(cropRequirementId: number) {
    const response = await http.get<CropRequirementApiResponse<CropRequirementView>>(
      `${BASE_URL}/get-by-id/${cropRequirementId}`
    )
    return response.data
  },

  async create(cropId: number, payload: CropRequirementPayload, plantStage: PlantStage) {
    const response = await http.post<CropRequirementApiResponse<CropRequirementView>>(
      // Backend expects: long cropId (from query) + PlantStage plantStage (from query)
      `${BASE_URL}/create${buildQuery({ cropId, plantStage })}`,
      payload
    )
    return response.data
  },

  async update(cropRequirementId: number, payload: CropRequirementPayload, plantStage: PlantStage) {
    const response = await http.put<CropRequirementApiResponse<CropRequirementView>>(
      `${BASE_URL}/update/${cropRequirementId}${buildQuery({ plantStage })}`,
      payload
    )
    return response.data
  },

  async updateStatus(cropRequirementId: number) {
    const response = await http.put<CropRequirementApiResponse<CropRequirementView>>(
      `${BASE_URL}/update-status/${cropRequirementId}`
    )
    return response.data
  },

  async updatePlantStage(cropRequirementId: number, plantStage: PlantStage) {
    const response = await http.put<CropRequirementApiResponse<CropRequirementView>>(
      `${BASE_URL}/update-plant-stage/${cropRequirementId}${buildQuery({ plantStage })}`
    )
    return response.data
  },

  async duplicate(cropRequirementId: number, cropId: number, plantStage: PlantStage) {
    const response = await http.post<CropRequirementApiResponse<CropRequirementView>>(
      `${BASE_URL}/duplicate/${cropRequirementId}${buildQuery({ cropId, plantStage })}`
    )
    return response.data
  },

  async remove(cropRequirementId: number) {
    const response = await http.delete<CropRequirementApiResponse<CropRequirementView>>(
      `${BASE_URL}/delete/${cropRequirementId}`
    )
    return response.data
  },
}
