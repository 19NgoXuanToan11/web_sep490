import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { iotDeviceService, type IoTDeviceRequest } from '@/shared/api/iotDeviceService'

interface CreateDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateDeviceFormState {
  deviceName: string
  pinCode: string
  deviceType: string
  sensorValue: string // UI-only field, not sent to backend
  unit: string // UI-only field, not sent to backend
  expiryDate?: string
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

const units = [
  '°C',
  '%',
  'pH',
  'lux',
  'cm',
  'ppm',
  'V',
  'A',
  'none',
]

export const CreateDeviceModal: React.FC<CreateDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateDeviceFormState>({
    deviceName: '',
    pinCode: '',
    deviceType: '',
    sensorValue: '',
    unit: '',
    expiryDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

      // Format expiryDate to YYYY-MM-DD format if provided
      let formattedExpiryDate: string | undefined = undefined
      if (formData.expiryDate) {
        // Ensure date is in YYYY-MM-DD format
        const date = new Date(formData.expiryDate)
        if (!isNaN(date.getTime())) {
          formattedExpiryDate = date.toISOString().split('T')[0]
        }
      }

      // Only send fields the backend expects (matching IOTRequest)
      const payload: IoTDeviceRequest = {
        deviceName: formData.deviceName,
        pinCode: formData.pinCode || undefined, // Send undefined if empty
        deviceType: formData.deviceType,
        expiryDate: formattedExpiryDate,
        // Note: farmDetailsId is not sent as backend doesn't accept it
        // Note: sensorValue and unit are UI-only fields, not sent to backend
      }

      // Call API and get response with all mapped fields
      const createdDevice = await iotDeviceService.createDevice(payload)

      toast({
        title: 'Thành công',
        description: `Đã tạo thiết bị IoT "${createdDevice.deviceName || formData.deviceName}" thành công`,
      })

      // Reset form
      setFormData({
        deviceName: '',
        pinCode: '',
        deviceType: '',
        sensorValue: '',
        unit: '',
        expiryDate: '',
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating IoT device:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tạo thiết bị IoT'
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateDeviceFormState, value: string | number) => {
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
              <CardTitle className="text-lg font-semibold">Tạo Thiết bị IoT mới</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Tên thiết bị *</Label>
                <Input
                  id="deviceName"
                  placeholder="Nhập tên thiết bị"
                  value={formData.deviceName}
                  onChange={e => handleInputChange('deviceName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinCode">Mã PIN</Label>
                <Input
                  id="pinCode"
                  placeholder="Nhập mã PIN"
                  value={formData.pinCode}
                  onChange={e => handleInputChange('pinCode', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceType">Loại thiết bị *</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sensorValue">Giá trị ban đầu</Label>
                  <Input
                    id="sensorValue"
                    placeholder="0"
                    value={formData.sensorValue}
                    onChange={e => handleInputChange('sensorValue', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Đơn vị</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={value => handleInputChange('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit === 'none' ? 'Không có' : unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                <Input
                  id="expiryDate"
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
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      Tạo
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
