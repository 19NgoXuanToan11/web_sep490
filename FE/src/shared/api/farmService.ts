import { http } from './client'

export interface FarmDto {
  farmId: number
  farmName: string
  location: string
  createdAt?: string
  updatedAt?: string
}

export const farmService = {
  // GET /api/v1/farm/get-all -> but our env.API_URL already includes /api
  // So the relative path should be /v1/farm/get-all
  getAllFarms: async (): Promise<FarmDto[]> => {
    const res = await http.get<FarmDto[]>('/v1/farm/get-all')
    return res.data
  },
}
