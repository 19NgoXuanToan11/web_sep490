import { http } from '@/shared/api/client'

export interface FarmEquipment {
  farmEquipmentId?: number
  deviceName?: string
  farmName?: string
  assignDate?: string
  note?: string
  status?: number | string
}

export interface FarmEquipmentResponse {
  status: number
  message?: string
  data?: any
}

const mapApiToFarmEquipment = (api: any): FarmEquipment => {
  return {
    farmEquipmentId: api.farmEquipmentId || api.FarmEquipmentId,
    deviceName: api.deviceName || api.DeviceName,
    farmName: api.farmName || api.FarmName,
    assignDate: api.assignDate || api.AssignDate,
    note: api.note || api.Note,
    status: api.status || api.Status,
  }
}

export const farmEquipmentService = {
  getAll: async (): Promise<FarmEquipment[]> => {
    const response = await http.get<FarmEquipmentResponse>('/v1/FarmEquipment/GetAll')
    const raw = response as any
    const apiData = raw?.data?.data ?? raw?.data?.Data ?? raw?.data
    if (!apiData) return []
    return (apiData || []).map(mapApiToFarmEquipment)
  },

  getByDeviceName: async (name: string): Promise<FarmEquipment[]> => {
    const response = await http.get<FarmEquipmentResponse>(`/v1/FarmEquipment/GetFarmEquipmentByDevicesName?name=${encodeURIComponent(name)}`)
    const raw = response as any
    const apiData = raw?.data?.data ?? raw?.data?.Data ?? raw?.data
    if (!apiData) return []
    return (apiData || []).map(mapApiToFarmEquipment)
  },

  getActiveList: async (): Promise<FarmEquipment[]> => {
    const response = await http.get<FarmEquipmentResponse>('/v1/FarmEquipment/GetListFarmEquipmentActive')
    const raw = response as any
    const apiData = raw?.data?.data ?? raw?.data?.Data ?? raw?.data
    if (!apiData) return []
    return (apiData || []).map(mapApiToFarmEquipment)
  },

  createFarmEquipment: async (payload: any): Promise<FarmEquipment | null> => {
    const response = await http.post<FarmEquipmentResponse>('/v1/FarmEquipment/CreateFarmEquipment', payload)
    const raw = response as any
    const apiData = raw?.data?.data ?? raw?.data?.Data ?? raw?.data
    if (!apiData) return null
    return mapApiToFarmEquipment(apiData)
  },

  removeFarmEquipment: async (id: number): Promise<boolean> => {
    const response = await http.put<FarmEquipmentResponse>(`/v1/FarmEquipment/RemmoveFarmEquipment?id=${id}`)
    return response.status === 200
  },

  updateFarmEquipment: async (farmEquipmentId: number, payload: any): Promise<FarmEquipment | null> => {
    const response = await http.put<FarmEquipmentResponse>(`/v1/FarmEquipment/update-farm-equipment?farmEquipmentId=${farmEquipmentId}`, payload)
    const raw = response as any
    const apiData = raw?.data?.data ?? raw?.data?.Data ?? raw?.data
    if (!apiData) return null
    return mapApiToFarmEquipment(apiData)
  },
}