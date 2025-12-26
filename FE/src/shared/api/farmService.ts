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
    const res = await http.get<any>('/v1/farm/get-all')
    const data = res?.data

    if (Array.isArray(data)) return data

    if (data && Array.isArray(data.items)) return data.items

    if (data && Array.isArray(data.data)) return data.data

    return []
  },
}
