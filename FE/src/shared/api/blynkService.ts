interface BlynkData {
  v0: string // temperature
  v1: string // humidity
  v2: string // rain level
  v3: string // soil moisture
  v4: string // light intensity (alternative)
  v5: string // light
  v6: string // servo angle
  v7: string // device/pump state
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
  connectionStrength: number // 0-100
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

      // Transform the raw Blynk data into a more usable format
      const temperature = this.validateSensorValue(parseFloat(data.v0), 0, 60)
      const humidity = this.validateSensorValue(parseFloat(data.v1), 0, 100)
      const soilMoisture = this.validateSensorValue(parseFloat(data.v2), 0, 100)
      const rainLevel = this.validateSensorValue(parseFloat(data.v3), 0, 100)
      const light = this.validateSensorValue(parseFloat(data.v4), 0, 1200)
      const servoAngle = this.validateSensorValue(parseFloat(data.v6), 0, 180)

      // Calculate data quality based on sensor readings
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

  // Validate sensor values within expected ranges
  private validateSensorValue(value: number, min: number, max: number): number {
    if (isNaN(value)) return 0
    return Math.max(min, Math.min(max, value))
  }

  // Calculate data quality based on sensor readings
  private calculateDataQuality(sensors: {
    temperature: number
    humidity: number
    rainLevel: number
    soilMoisture: number
    light: number
    servoAngle: number
  }): 'good' | 'poor' | 'error' {
    const { temperature, humidity, light } = sensors

    // Check for error conditions
    if (temperature === 0 && humidity === 0 && light === 0) {
      return 'error'
    }

    // Check for poor data quality (unrealistic combinations)
    if (temperature < 5 || temperature > 50) return 'poor'
    if (humidity < 10 || humidity > 95) return 'poor'

    return 'good'
  }

  // Calculate connection strength based on data consistency
  private calculateConnectionStrength(data: BlynkData): number {
    let strength = 100

    // Reduce strength for missing or invalid data
    Object.values(data).forEach(value => {
      if (!value || value === '0' || value === '') {
        strength -= 10
      }
    })

    return Math.max(0, Math.min(100, strength))
  }

  // Send control commands to Blynk
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
}

export const blynkService = new BlynkService()
export type { SensorData, BlynkData }
