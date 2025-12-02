interface BlynkData {
  v0: string
  v1: string
  v2: string
  v3: string
  v4: string
  v5: string
  v6: string
  v7: string
  v8?: string
  v9?: string
  v10?: string
  v11?: string
  v12?: string
  v13?: string
  v14?: string
}

interface SensorData {
  temperature: number
  humidity: number
  rainLevel: number
  soilMoisture: number
  light: number
  servoAngle: number
  pumpState: boolean
  lightState?: boolean
  dataQuality: 'good' | 'poor' | 'error'
  lastUpdated: Date
  connectionStrength: number
}

interface BlynkLogEntry {
  iotLogId?: number
  devicesId: number
  variableId: string
  sensorName: string
  value: number
  timestamp: string
}

class BlynkService {
  private baseUrl = 'https://iotfarm.onrender.com/api/blynk'

  async getBlynkData(): Promise<SensorData> {
    try {
      const response = await fetch(`${this.baseUrl}/get-blynk-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: BlynkData = await response.json()

      const temperature = this.validateSensorValue(parseFloat(data.v0), 0, 60)
      const humidity = this.validateSensorValue(parseFloat(data.v1), 0, 100)
      const soilMoisture = this.validateSensorValue(parseFloat(data.v2), 0, 100)
      const rainLevel = this.validateSensorValue(parseFloat(data.v3), 0, 100)
      const light = this.validateSensorValue(parseFloat(data.v4), 0, 1200)
      const servoAngle = this.validateSensorValue(parseFloat(data.v6), 0, 180)

      const dataQuality = this.calculateDataQuality({
        temperature,
        humidity,
        rainLevel,
        soilMoisture,
        light,
        servoAngle,
      })

      return {
        temperature,
        humidity,
        rainLevel,
        soilMoisture,
        light,
        servoAngle,
        pumpState: data.v5 === '1', // V5 = Pump control, V7 = Manual mode
        lightState: data.v12 === '1', // V12 = LED Light status (0/1)
        dataQuality,
        lastUpdated: new Date(),
        connectionStrength: this.calculateConnectionStrength(data),
      }
    } catch (error) {
      throw error
    }
  }

  async getRawBlynkData(): Promise<BlynkData> {
    try {
      const response = await fetch(`${this.baseUrl}/get-blynk-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: BlynkData = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }

  async getLogs(): Promise<BlynkLogEntry[]> {
    const response = await fetch(`${this.baseUrl}/logs`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const payload = await response.json()

    if (Array.isArray(payload)) {
      return payload
    }

    if (Array.isArray(payload?.data?.items)) {
      return payload.data.items
    }

    if (Array.isArray(payload?.data)) {
      return payload.data
    }

    return []
  }

  async exportLogs(): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.blob()
  }

  private validateSensorValue(value: number, min: number, max: number): number {
    if (isNaN(value)) return 0
    return Math.max(min, Math.min(max, value))
  }

  private calculateDataQuality(sensors: {
    temperature: number
    humidity: number
    rainLevel: number
    soilMoisture: number
    light: number
    servoAngle: number
  }): 'good' | 'poor' | 'error' {
    const { temperature, humidity, light } = sensors

    if (temperature === 0 && humidity === 0 && light === 0) {
      return 'error'
    }

    if (temperature < 5 || temperature > 50) return 'poor'
    if (humidity < 10 || humidity > 95) return 'poor'

    return 'good'
  }

  private calculateConnectionStrength(data: BlynkData): number {
    let strength = 100

    Object.values(data).forEach(value => {
      if (!value || value === '0' || value === '') {
        strength -= 10
      }
    })

    return Math.max(0, Math.min(100, strength))
  }

  async sendControlCommand(pin: string, value: string | number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/send-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin, value }),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  async controlPump(state: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/pump?state=${state}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message:
          data.message || `Pump has been ${state ? 'turned ON' : 'turned OFF'} successfully.`,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send pump command to Blynk Cloud.',
      }
    }
  }

  async controlManualMode(state: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/manual-mode?state=${state}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message:
          data.message || `Manual mode has been ${state ? 'enabled' : 'disabled'} successfully.`,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send manual mode command to Blynk Cloud.',
      }
    }
  }

  async controlServo(angle: number): Promise<{ success: boolean; message: string }> {
    try {
      if (angle < 0 || angle > 180) {
        return {
          success: false,
          message: 'Servo angle must be between 0 and 180 degrees.',
        }
      }

      const response = await fetch(`${this.baseUrl}/servo?angle=${angle}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message: data.message || `Servo angle has been set to ${angle} degrees successfully.`,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send servo command to Blynk Cloud.',
      }
    }
  }

  async setSoilLowThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      if (value < 0 || value > 100) {
        return {
          success: false,
          message: 'Ngưỡng phải từ 0-100%',
        }
      }

      const response = await fetch(`${this.baseUrl}/threshold/soil-low?value=${value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message: data.message || `Ngưỡng BẬT bơm đã đặt ≤ ${value}%`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi gửi lệnh đến thiết bị',
      }
    }
  }

  async setSoilHighThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      if (value < 0 || value > 100) {
        return {
          success: false,
          message: 'Ngưỡng phải từ 0-100%',
        }
      }

      const response = await fetch(`${this.baseUrl}/threshold/soil-high?value=${value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message: data.message || `Ngưỡng TẮT bơm đã đặt ≥ ${value}%`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi gửi lệnh đến thiết bị',
      }
    }
  }

  async setLdrLowThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      if (value < 0 || value > 1023) {
        return {
          success: false,
          message: 'Ngưỡng LDR phải từ 0-1023',
        }
      }

      const response = await fetch(`${this.baseUrl}/threshold/ldr-low?value=${value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message: data.message || `Ngưỡng ánh sáng THẤP đã đặt: ${value}`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi gửi lệnh đến thiết bị',
      }
    }
  }

  async setLdrHighThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      if (value < 0 || value > 1023) {
        return {
          success: false,
          message: 'Ngưỡng LDR phải từ 0-1023',
        }
      }

      const response = await fetch(`${this.baseUrl}/threshold/ldr-high?value=${value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success || true,
        message: data.message || `Ngưỡng ánh sáng CAO đã đặt: ${value}`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi gửi lệnh đến thiết bị',
      }
    }
  }

  async controlLight(state: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/light?state=${state}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success !== false,
        message: data.message || `Đèn LED đã được ${state ? 'bật' : 'tắt'} thành công.`,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Không thể gửi lệnh điều khiển đèn đến Blynk Cloud.',
      }
    }
  }

  async setLightOnThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      if (value < 0 || value > 1023) {
        return {
          success: false,
          message: 'Ngưỡng phải từ 0-1023',
        }
      }

      const response = await fetch(`${this.baseUrl}/threshold/light-on?value=${value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success !== false,
        message: data.message || `Ngưỡng bật đèn đã đặt: ${value}`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi gửi lệnh đến thiết bị',
      }
    }
  }

  async setLightOffThreshold(value: number): Promise<{ success: boolean; message: string }> {
    try {
      if (value < 0 || value > 1023) {
        return {
          success: false,
          message: 'Ngưỡng phải từ 0-1023',
        }
      }

      const response = await fetch(`${this.baseUrl}/threshold/light-off?value=${value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.success !== false,
        message: data.message || `Ngưỡng tắt đèn đã đặt: ${value}`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Lỗi gửi lệnh đến thiết bị',
      }
    }
  }
}

export const blynkService = new BlynkService()
export type { SensorData, BlynkData, BlynkLogEntry }
