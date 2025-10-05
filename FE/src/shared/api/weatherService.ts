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
    const response = await http.get<WeatherResponse>(`/v1/Weather/${city}`)
    return response.data
  },
}
