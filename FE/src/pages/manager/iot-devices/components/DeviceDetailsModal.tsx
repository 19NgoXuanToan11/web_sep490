import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { type IoTDevice } from '@/shared/api/iotDeviceService'

interface DeviceDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    device: IoTDevice | null
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
    isOpen,
    onClose,
    device,
}) => {
    if (!device) return null

    const getStatusBadge = (status: number | string) => {
        // Xử lý cả string và number
        const normalizedStatus = typeof status === 'string'
            ? status.toUpperCase()
            : String(status)

        if (normalizedStatus === 'ACTIVE' || normalizedStatus === '1') {
            return <Badge variant="default">Hoạt động</Badge>
        }
        if (normalizedStatus === 'DEACTIVATED' || normalizedStatus === '0') {
            return <Badge variant="secondary">Tạm dừng</Badge>
        }
        return <Badge variant="secondary">Không xác định</Badge>
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            })
        } catch {
            return dateString
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Cleanup body overflow immediately
            document.body.style.overflow = ''
            // Call onClose after a small delay to ensure cleanup
            setTimeout(() => {
                onClose()
            }, 0)
        }
    }

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            // Always cleanup on unmount
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            document.body.style.overflow = ''
            // Remove any lingering pointer-events blocks
            document.body.style.pointerEvents = ''
        }
    }, [])

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
                onEscapeKeyDown={(e) => {
                    // Allow Escape to close
                    e.preventDefault()
                    onClose()
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Chi tiết Thiết bị IoT
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Tên thiết bị</p>
                                    <p className="text-base font-semibold">{device.deviceName || 'N/A'}</p>
                                </div>
                                <div className="border-t border-gray-200" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Loại thiết bị</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-base">{device.deviceType || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Mã PIN</p>
                                    <p className="text-base">{device.pinCode || 'N/A'}</p>
                                </div>
                                <div className="border-t border-gray-200" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái</p>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(device.status)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Thông tin thời gian</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-gray-500">Cập nhật cuối</p>
                                    </div>
                                    <p className="text-base">{formatDate(device.lastUpdate)}</p>
                                </div>
                                {device.expiryDate && (
                                    <>
                                        <div className="border-t border-gray-200" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium text-gray-500">Ngày hết hạn</p>
                                            </div>
                                            <p className="text-base">{formatDate(device.expiryDate)}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {device.farmDetailsId && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Thông tin nông trại</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">ID Nông trại</p>
                                    <p className="text-base font-mono">{device.farmDetailsId}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}


