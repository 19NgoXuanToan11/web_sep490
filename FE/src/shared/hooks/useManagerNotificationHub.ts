import { useEffect, useRef } from 'react'
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { env } from '@/shared/config/env'

type MessageHandler = (message: string) => void

export default function useManagerNotificationHub(onMessage: MessageHandler) {
  const connRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    let mounted = true

    async function startConnection() {
      try {
        const hubBase = String(env.API_URL).replace(/\/api\/?$/, '')
        const tokenRaw = localStorage.getItem('ifms-token')
        const token = tokenRaw ? String(tokenRaw).replace(/"/g, '') : undefined

        const connection = new HubConnectionBuilder()
          .withUrl(`${hubBase}/hubs/manager-notification`, {
            accessTokenFactory: () => token ?? '',
          })
          .configureLogging(LogLevel.Warning)
          .build()

        connection.on('ReceiveNotification', (message: string) => {
          if (!mounted) return
          try {
            if (typeof message === 'string') onMessage(message)
          } catch (err) {}
        })

        connection.on('ReceiveWeatherAlert', (payload: any) => {
          if (!mounted) return
          try {
            if (typeof payload === 'string') {
              onMessage(payload)
              return
            }

            if (payload && typeof payload === 'object') {
              if (typeof payload.Message === 'string') {
                onMessage(payload.Message)
                return
              }

              const city = payload.cityName || payload.CityName || payload.city || payload.City
              const ts =
                payload.timeStamp ||
                payload.TimeStamp ||
                payload.Timestamp ||
                payload.timestamp ||
                payload.time
              const rain =
                payload.RainVolumeMm ??
                payload.rainVolume ??
                payload.RainVolume ??
                payload.rainVolumeMm
              const desc =
                payload.description || payload.Description || payload.status || payload.Status

              if (city || ts || typeof rain !== 'undefined' || desc) {
                const date = ts ? new Date(ts) : new Date()
                const hh = String(date.getHours()).padStart(2, '0')
                const mm = String(date.getMinutes()).padStart(2, '0')
                const dd = String(date.getDate()).padStart(2, '0')
                const MM = String(date.getMonth() + 1).padStart(2, '0')
                const yyyy = String(date.getFullYear())
                const rainText =
                  typeof rain !== 'undefined' && rain !== null
                    ? `${Number(rain).toFixed(1)}`
                    : 'N/A'
                const built =
                  `⚠️ Cảnh báo mưa tại ${city ?? 'nơi này'}\n` +
                  `Thời gian: ${hh}:${mm} - ${dd}/${MM}/${yyyy}\n` +
                  `Lượng mưa: ~${rainText} mm\n` +
                  `Trạng thái: ${desc ?? 'Không rõ'}`
                onMessage(built)
                return
              }
            }

            onMessage(String(payload))
          } catch (err) {}
        })

        await connection.start()
        connRef.current = connection
      } catch (err) {}
    }

    startConnection()

    return () => {
      mounted = false
      if (connRef.current) {
        connRef.current.stop().catch(() => {})
        connRef.current = null
      }
    }
  }, [onMessage])
}
