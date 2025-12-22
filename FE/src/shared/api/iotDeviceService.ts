import { http } from './client'

export interface IoTDevice {
  devicesId?: number
  deviceName?: string
  pinCode?: string
  deviceType?: string
  status?: number | string
  unit?: string
  lastUpdate?: string
  expiryDate?: string
  ioTdevicesId?: number
  farmDetailsId?: number
}

export interface IoTDeviceRequest {
  deviceName: string
  pinCode?: string
  deviceType: string
  expiryDate?: string
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

const mapApiDeviceToDevice = (apiDevice: any): IoTDevice => {
  return {
    devicesId:
      apiDevice.devicesId ||
      apiDevice.DevicesId ||
      apiDevice.ioTdevicesId ||
      apiDevice.IoTdevicesId,
    deviceName: apiDevice.deviceName || apiDevice.DeviceName,
    pinCode: apiDevice.pinCode || apiDevice.PinCode,
    deviceType: apiDevice.deviceType || apiDevice.DeviceType,
    status: apiDevice.status || apiDevice.Status,
    unit: apiDevice.unit || apiDevice.Unit,
    lastUpdate: apiDevice.lastUpdate || apiDevice.LastUpdate,
    expiryDate: apiDevice.expiryDate || apiDevice.ExpiryDate, 
    ioTdevicesId:
      apiDevice.devicesId ||
      apiDevice.DevicesId ||
      apiDevice.ioTdevicesId ||
      apiDevice.IoTdevicesId,
    farmDetailsId: apiDevice.farmDetailsId || apiDevice.FarmDetailsId,
  }
}

export const iotDeviceService = {
  getAllDevices: async (
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedIoTDevices> => {
    const response = await http.get<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-list?pageIndex=${pageIndex}&pageSize=${pageSize}`
    )
    const apiData = response.data.data
    if (!apiData) {
      return {
        totalItemCount: 0,
        pageSize,
        pageIndex,
        items: [],
      }
    }
    return {
      totalItemCount: apiData.totalItemCount || 0,
      pageSize: apiData.pageSize || pageSize,
      totalPagesCount: apiData.totalPagesCount,
      pageIndex: apiData.pageIndex || pageIndex,
      next: apiData.next,
      previous: apiData.previous,
      items: (apiData.items || []).map(mapApiDeviceToDevice),
    }
  },

  getDeviceById: async (deviceId: number): Promise<IoTDevice> => {
    const response = await http.get<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-byId?id=${deviceId}`
    )
    return mapApiDeviceToDevice(response.data.data)
  },

  createDevice: async (deviceData: IoTDeviceRequest): Promise<IoTDevice> => {
    const response = await http.post<IoTDeviceResponse>(
      '/v1/iotDevices/iotDevices-create',
      deviceData
    )
    return mapApiDeviceToDevice(response.data.data)
  },

  updateDeviceStatus: async (
    deviceId: number | string,
    status: number | string
  ): Promise<IoTDevice> => {
    const response = await http.put<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-update-status?iotDevicesId=${Number(deviceId)}`,
      String(Number(status))
    )
    return mapApiDeviceToDevice(response.data.data)
  },

  updateDevice: async (deviceId: number, deviceData: IoTDeviceRequest): Promise<IoTDevice> => {
    const response = await http.patch<IoTDeviceResponse>(
      `/v1/iotDevices/iotDevices-update?iotDevicesId=${deviceId}`,
      deviceData
    )
    return mapApiDeviceToDevice(response.data.data)
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

      const isActiveStatus = (status: number | string | undefined): boolean => {
        if (status === undefined) return false
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
