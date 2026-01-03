import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X } from 'lucide-react'
import { Button } from '@/shared/ui'
import { http } from '@/shared/api/client'
const POLL_INTERVAL = 15 * 60 * 1000
const DROPDOWN_WIDTH = 384

export default function NotificationBell(): React.ReactElement {
    const [unread, setUnread] = useState<number>(0)
    const [open, setOpen] = useState<boolean>(false)
    const [lastResult, setLastResult] = useState<any>(null)
    const timerRef = useRef<number | null>(null)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const dropdownRef = useRef<HTMLDivElement | null>(null)
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
    const currentTempRaw = lastResult?.CurrentTemperature
    const currentTemp = (typeof currentTempRaw !== 'undefined' && currentTempRaw !== null && !Number.isNaN(Number(currentTempRaw)))
        ? Number(currentTempRaw)
        : undefined

    const checkAlerts = async () => {
        try {
            const res = await http.post<any>('/v1/crop/check-alerts')
            const data = res.data
            const alertsSent = Number(data?.AlertsSent || 0)
            setUnread(alertsSent)
            setLastResult(data)
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
        setOpen(v => !v)
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
                    {lastResult ? (
                        <div className="space-y-2">
                            <div className="text-sm text-gray-700">
                                Lần kiểm tra: <span className="font-medium">{new Date(lastResult?.Timestamp || Date.now()).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-700">
                                Lịch hoạt động: <span className="font-medium">{lastResult?.ActiveSchedules ?? 0}</span>
                            </div>
                            <div className="text-sm text-gray-700">
                                Cảnh báo gửi: <span className="font-medium">{lastResult?.AlertsSent ?? 0}</span>
                            </div>
                            {typeof currentTemp !== 'undefined' && (
                                <div className="text-sm text-gray-700">
                                    Nhiệt độ hiện tại: <span className="font-medium">{currentTemp.toFixed(1)}°C</span>
                                </div>
                            )}
                            {lastResult?.Message && (
                                <div className="text-sm text-gray-600">{String(lastResult.Message)}</div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">Đang kiểm tra...</div>
                    )}
                </div>

                <div className="p-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => { checkAlerts(); }}>
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


