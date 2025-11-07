interface BlynkData {
  v0: string
  v1: string
  v2: string
  v3: string
  v4: string
  v5: string
  v6: string
  v7: string
}

interface SensorData {
  temperature: number
  humidity: number
  rainLevel: number
  soilMoisture: number
  light: number
  servoAngle: number
  pumpState: boolean
  dataQuality: 'good' | 'poor' | 'error'
  lastUpdated: Date
  connectionStrength: number
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
        pumpState: data.v7 === '1',
        dataQuality,
        lastUpdated: new Date(),
        connectionStrength: this.calculateConnectionStrength(data),
      }
    } catch (error) {
      throw error
    }
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
}

export const blynkService = new BlynkService()
export type { SensorData, BlynkData }
