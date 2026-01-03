import { http } from './client'

export interface WeatherResponse {
  cityName: string
  timeStamp: string
  temperatureC: number
  feelsLikeC: number
  tempMinC: number
  tempMaxC: number
  summary: string
  description: string
  iconUrl: string
  humidity: number
  windSpeedMps: number
  pressureHpa: number
  rainVolumeMm?: number | null
}

export const weatherService = {
  getWeather: async (city: string): Promise<WeatherResponse> => {
    const { data } = await http.get<WeatherResponse>(`/v1/Weather/${encodeURIComponent(city)}`)
    return data
  },
  getHourly: async (city: string, hours = 24): Promise<any> => {
    const path = `/v1/Weather/hourly?city=${encodeURIComponent(city)}&hours=${hours}`
    const { data } = await http.get<any>(path)
    return data
  },
}
