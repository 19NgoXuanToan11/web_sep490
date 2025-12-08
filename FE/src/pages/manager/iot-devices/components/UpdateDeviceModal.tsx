import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { iotDeviceService, type IoTDeviceRequest, type IoTDevice } from '@/shared/api/iotDeviceService'

interface UpdateDeviceModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    device: IoTDevice | null
}

interface UpdateDeviceFormState {
    deviceName: string
    deviceType: string
    expiryDate?: string
    farmDetailsId: number
}

const deviceTypes = [
    'Cảm biến nhiệt độ',
    'Cảm biến độ ẩm',
    'Cảm biến độ ẩm đất',
    'Cảm biến pH',
    'Cảm biến ánh sáng',
    'Cảm biến mực nước',
    'Bộ điều khiển tưới tiêu',
    'Trạm thời tiết',
    'Camera',
    'Khác',
]

export const UpdateDeviceModal: React.FC<UpdateDeviceModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    device,
}) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<UpdateDeviceFormState>({
        deviceName: '',
        deviceType: '',
        expiryDate: '',
        farmDetailsId: 1,
    })

    useEffect(() => {
        if (device && isOpen) {
            // Format expiry date for input (YYYY-MM-DD)
            let formattedExpiryDate = ''
            if (device.expiryDate) {
                try {
                    const date = new Date(device.expiryDate)
                    if (!isNaN(date.getTime())) {
                        formattedExpiryDate = date.toISOString().split('T')[0]
                    }
                } catch (error) {
                    // If date parsing fails, leave it empty
                    formattedExpiryDate = ''
                }
            }

            setFormData({
                deviceName: device.deviceName || '',
                deviceType: device.deviceType || '',
                expiryDate: formattedExpiryDate,
                farmDetailsId: device.farmDetailsId || 1,
            })
        }
    }, [device, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!device?.ioTdevicesId) {
            toast({
                title: 'Lỗi',
                description: 'Không tìm thấy thiết bị để cập nhật',
                variant: 'destructive',
            })
            return
        }

        if (!formData.deviceName || !formData.deviceType) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                variant: 'destructive',
            })
            return
        }

        try {
            setLoading(true)

            const payload: IoTDeviceRequest = {
                deviceName: formData.deviceName,
                deviceType: formData.deviceType,
                expiryDate: formData.expiryDate,
                farmDetailsId: formData.farmDetailsId,
            }

            await iotDeviceService.updateDevice(device.ioTdevicesId, payload)

            toast({
                title: 'Thành công',
                description: 'Đã cập nhật thiết bị IoT',
            })

            onSuccess()
            onClose()
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật thiết bị IoT',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: keyof UpdateDeviceFormState, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    if (!isOpen) return null

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div>
                            <CardTitle className="text-lg font-semibold">Chỉnh sửa thiết bị IoT</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="update-deviceName">Tên thiết bị *</Label>
                                <Input
                                    id="update-deviceName"
                                    placeholder="Nhập tên thiết bị"
                                    value={formData.deviceName}
                                    onChange={e => handleInputChange('deviceName', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="update-deviceType">Loại thiết bị *</Label>
                                <Select
                                    value={formData.deviceType}
                                    onValueChange={value => handleInputChange('deviceType', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại thiết bị" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deviceTypes.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="update-expiryDate">Ngày hết hạn</Label>
                                <Input
                                    id="update-expiryDate"
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={e => handleInputChange('expiryDate', e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang cập nhật...
                                        </>
                                    ) : (
                                        <>
                                            Cập nhật
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}

