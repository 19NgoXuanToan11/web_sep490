import { http } from './client'

export interface IoTDevice {
  ioTdevicesId?: number
  deviceName: string
  deviceType: string
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR'
  sensorValue?: string
  unit?: string
  lastUpdate?: string
  expiryDate?: string
  farmDetailsId: number
}

export interface IoTDeviceRequest {
  deviceName: string
  deviceType: string
  sensorValue?: string
  unit?: string
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
  pageIndex: number
  items: IoTDevice[]
}

export const iotDeviceService = {
  // Lấy tất cả thiết bị IoT với phân trang
  getAllDevices: async (
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedIoTDevices> => {
    const response = await http.get<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-list?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    return response.data.data
  },

  // Lấy thiết bị IoT theo ID
  getDeviceById: async (deviceId: number): Promise<IoTDevice> => {
    const response = await http.get<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-byId?id=${deviceId}`
    )
    return response.data.data
  },

  // Tạo thiết bị IoT mới
  createDevice: async (deviceData: IoTDeviceRequest): Promise<IoTDevice> => {
    const response = await http.post<IoTDeviceResponse>(
      '/v1/iotDevices/iotDevices-create',
      deviceData
    )
    return response.data.data
  },

  // Cập nhật trạng thái thiết bị IoT
  updateDeviceStatus: async (deviceId: number, status: string): Promise<IoTDevice> => {
    const response = await http.put<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-update-status?iotDevicesId=${deviceId}`,
      status
    )
    return response.data.data
  },

  // Cập nhật thiết bị IoT
  updateDevice: async (deviceId: number, deviceData: IoTDeviceRequest): Promise<IoTDevice> => {
    const response = await http.patch<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-update?iotDevicesId=${deviceId}`,
      deviceData
    )
    return response.data.data
  },

  // Lấy số lượng thiết bị theo trạng thái
  getDeviceStatistics: async (): Promise<{
    total: number
    active: number
    inactive: number
    maintenance: number
    error: number
  }> => {
    try {
      const response = await iotDeviceService.getAllDevices(1, 1000) // Get all devices for statistics
      const devices = response.items

      return {
        total: devices.length,
        active: devices.filter(d => d.status === 'ACTIVE').length,
        inactive: devices.filter(d => d.status === 'INACTIVE').length,
        maintenance: devices.filter(d => d.status === 'MAINTENANCE').length,
        error: devices.filter(d => d.status === 'ERROR').length,
      }
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, maintenance: 0, error: 0 }
    }
  },
}
