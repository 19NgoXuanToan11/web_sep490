import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import {
    Thermometer,
    Droplets,
    Gauge,
    Cpu,
    CheckCircle,
    Activity,
    Clock,
    Calendar,
} from 'lucide-react'
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

    const getDeviceTypeIcon = (deviceType: string) => {
        const type = deviceType?.toLowerCase() || ''
        if (type.includes('temperature') || type.includes('nhiệt độ')) {
            return <Thermometer className="h-5 w-5 text-orange-500" />
        }
        if (type.includes('humidity') || type.includes('độ ẩm')) {
            return <Droplets className="h-5 w-5 text-blue-500" />
        }
        if (type.includes('soil') || type.includes('đất')) {
            return <Gauge className="h-5 w-5 text-green-500" />
        }
        return <Cpu className="h-5 w-5 text-gray-500" />
    }

    const getStatusBadge = (status: number) => {
        if (status === 1) {
            return <Badge variant="default">Hoạt động</Badge>
        }
        return <Badge variant="secondary">Không xác định</Badge>
    }

    const getStatusIcon = (status: number) => {
        if (status === 1) {
            return <CheckCircle className="h-4 w-4 text-green-500" />
        }
        return <Activity className="h-4 w-4 text-gray-400" />
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
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
                        {getDeviceTypeIcon(device.deviceType)}
                        Chi tiết Thiết bị IoT
                    </DialogTitle>
                    <DialogDescription>Thông tin chi tiết về thiết bị IoT trong nông trại</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Tên thiết bị</p>
                                    <p className="text-base font-semibold">{device.deviceName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Loại thiết bị</p>
                                    <div className="flex items-center gap-2">
                                        {getDeviceTypeIcon(device.deviceType)}
                                        <p className="text-base">{device.deviceType || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200" />

                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái</p>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(Number(device.status))}
                                    {getStatusBadge(Number(device.status))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Thông tin thời gian</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <p className="text-sm font-medium text-gray-500">Cập nhật cuối</p>
                                    </div>
                                    <p className="text-base">{formatDate(device.lastUpdate)}</p>
                                </div>
                                {device.expiryDate && (
                                    <>
                                        <div className="border-t border-gray-200" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <p className="text-sm font-medium text-gray-500">Ngày hết hạn</p>
                                            </div>
                                            <p className="text-base">{formatDate(device.expiryDate)}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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


