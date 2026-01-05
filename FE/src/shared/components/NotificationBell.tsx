import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X } from 'lucide-react'
import { Button } from '@/shared/ui'
import { http } from '@/shared/api/client'
import useManagerNotificationHub from '@/shared/hooks/useManagerNotificationHub'
const POLL_INTERVAL = 15 * 60 * 1000
const DROPDOWN_WIDTH = 384

export default function NotificationBell(): React.ReactElement {
    const [unread, setUnread] = useState<number>(0)
    const [open, setOpen] = useState<boolean>(false)
    const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
    const [messages, setMessages] = useState<Array<{ id: string; text: string; timestamp: number; read?: boolean }>>([])
    const timerRef = useRef<number | null>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

    const checkAlerts = async () => {
        try {
            const res = await http.post<any>('/v1/crop/check-alerts')
            const data = res.data
            setLastCheckedAt(Date.now())
            return data
        } catch (err) {
            console.error('NotificationBell.checkAlerts error', err)
        }
    }

    useEffect(() => {
        checkAlerts()
        timerRef.current = window.setInterval(checkAlerts, POLL_INTERVAL) as unknown as number
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    useManagerNotificationHub((message: string) => {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const timestamp = Date.now()
        setMessages(prev => [{ id, text: message, timestamp, read: false }, ...prev])
        setUnread(u => u + 1)
    })

    useEffect(() => {
        if (!open) return
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as Node
            if (buttonRef.current && buttonRef.current.contains(t)) return
            if (dropdownRef.current && dropdownRef.current.contains(t)) return
            setOpen(false)
        }
        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [open])

    const toggle = () => {
        if (!open && buttonRef.current) {
            setAnchorRect(buttonRef.current.getBoundingClientRect())
        }
        setOpen(prev => {
            const next = !prev
            if (!prev) {
                setMessages(ms => ms.map(m => ({ ...m, read: true })))
                setUnread(0)
            }
            return next
        })
    }



    const renderDropdown = () => {
        if (!anchorRect) return null
        const right = Math.min(window.innerWidth - 8, anchorRect.right)
        const left = Math.max(8, right - DROPDOWN_WIDTH)
        const top = anchorRect.bottom + 8

        const dropdown = (
            <div
                ref={dropdownRef}
                style={{ position: 'fixed', top: `${top}px`, left: `${left}px`, width: DROPDOWN_WIDTH, zIndex: 9999 }}
                className="origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
            >
                <div className="p-3 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <div className="text-sm font-medium text-gray-900">Thông báo</div>
                    </div>
                    <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto p-3">
                    {messages.length > 0 ? (
                        <div className="space-y-3">
                            {messages.map(m => (
                                <div key={m.id} className="text-sm text-gray-700">
                                    <div className="text-xs text-gray-400 mb-1">{new Date(m.timestamp).toLocaleString()}</div>
                                    <div style={{ whiteSpace: 'pre-line' }} className="text-sm text-gray-800">{m.text}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">
                            {lastCheckedAt ? 'Chưa có cảnh báo. Đã kiểm tra lúc: ' + new Date(lastCheckedAt).toLocaleString() : 'Đang chờ cảnh báo...'}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                            await checkAlerts()
                            if (open) {
                                setMessages(ms => ms.map(m => ({ ...m, read: true })))
                                setUnread(0)
                            }
                        }}
                    >
                        Làm mới
                    </Button>
                </div>
            </div>
        )

        return createPortal(dropdown, document.body)
    }

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={toggle}
                title="Thông báo"
                className="relative p-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center bg-emerald-600 text-white text-xs font-semibold rounded-full w-4 h-4 shadow-sm">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && renderDropdown()}
        </div>
    )
}


