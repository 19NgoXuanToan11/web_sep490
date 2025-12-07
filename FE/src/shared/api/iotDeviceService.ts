import { http } from './client'

export interface IoTDevice {
  ioTdevicesId?: number
  devicesId?: number // Backend returns this field
  deviceName: string
  pinCode?: string
  deviceType: string
  status: number | string
  lastUpdate?: string
  expiryDate?: string
  farmDetailsId: number
}

export interface IoTDeviceRequest {
  deviceName: string
  pinCode?: string
  deviceType: string
  expiryDate?: string
  farmDetailsId: number
}

export interface IoTDeviceResponse {
  status: number
  message: string
  data: any
}

export interface PaginatedIoTDevices {
  totalItemCount: number
  pageSize: number
  totalPagesCount?: number
  pageIndex: number
  next?: boolean
  previous?: boolean
  items: IoTDevice[]
}

export const iotDeviceService = {
  getAllDevices: async (
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedIoTDevices> => {
    const response = await http.get<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-list?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    return response.data.data
  },

  getDeviceById: async (deviceId: number): Promise<IoTDevice> => {
    const response = await http.get<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-byId?id=${deviceId}`
    )
    return response.data.data
  },

  createDevice: async (deviceData: IoTDeviceRequest): Promise<IoTDevice> => {
    const response = await http.post<IoTDeviceResponse>(
      '/v1/iotDevices/iotDevices-create',
      deviceData
    )
    return response.data.data
  },

  updateDeviceStatus: async (
    deviceId: number | string,
    status: number | string
  ): Promise<IoTDevice> => {
    const response = await http.put<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-update-status?iotDevicesId=${Number(deviceId)}`,
      String(Number(status))
    )
    return response.data.data
  },

  updateDevice: async (deviceId: number, deviceData: IoTDeviceRequest): Promise<IoTDevice> => {
    const response = await http.patch<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-update?iotDevicesId=${deviceId}`,
      deviceData
    )
    return response.data.data
  },

  getDeviceStatistics: async (): Promise<{
    total: number
    active: number
    inactive: number
    maintenance: number
    error: number
  }> => {
    try {
      const response = await iotDeviceService.getAllDevices(1, 1000)
      const devices = response.items

      const isActiveStatus = (status: number | string): boolean => {
        const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : String(status)
        return normalizedStatus === 'ACTIVE' || normalizedStatus === '1'
      }

      return {
        total: devices.length,
        active: devices.filter(d => isActiveStatus(d.status)).length,
        inactive: devices.filter(d => !isActiveStatus(d.status)).length,
        maintenance: 0,
        error: 0,
      }
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, maintenance: 0, error: 0 }
    }
  },
}
