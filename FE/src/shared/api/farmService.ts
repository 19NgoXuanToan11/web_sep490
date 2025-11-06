import { http } from './client'

export interface FarmDto {
  farmId: number
  farmName: string
  location: string
  createdAt?: string
  updatedAt?: string
}

export const farmService = {

  getAllFarms: async (): Promise<FarmDto[]> => {
    const res = await http.get<FarmDto[]>('/v1/farm/get-all')
    return res.data
  },
}
