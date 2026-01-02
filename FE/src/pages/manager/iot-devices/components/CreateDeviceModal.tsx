import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { iotDeviceService, type IoTDeviceRequest } from '@/shared/api/iotDeviceService'
import { showErrorToast, toastManager } from '@/shared/lib/toast-manager'

interface CreateDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateDeviceFormState {
  deviceName: string
  pinCode: string
  deviceType: string
  unit: string
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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateDeviceFormState>({
    deviceName: '',
    pinCode: '',
    deviceType: '',
    unit: '',
    expiryDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.deviceName || !formData.deviceType) {
      return
    }

    try {
      setLoading(true)

      let formattedExpiryDate: string | undefined = undefined
      if (formData.expiryDate) {
        const date = new Date(formData.expiryDate)
        if (!isNaN(date.getTime())) {
          formattedExpiryDate = date.toISOString().split('T')[0]
        }
      }

      const payload: IoTDeviceRequest = {
        deviceName: formData.deviceName,
        pinCode: formData.pinCode || undefined,
        deviceType: formData.deviceType,
        expiryDate: formattedExpiryDate,
      }

      await iotDeviceService.createDevice(payload)
      toastManager.success('Tạo thiết bị thành công')

      setFormData({
        deviceName: '',
        pinCode: '',
        deviceType: '',
        unit: '',
        expiryDate: '',
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating IoT device:', error)
      console.error('Error creating IoT device:', error)
      showErrorToast(error)
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
