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
