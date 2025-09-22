import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { iotDeviceService, type IoTDeviceRequest } from '@/shared/api/iotDeviceService'

interface CreateDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const deviceTypes = [
  'Temperature Sensor',
  'Humidity Sensor',
  'Soil Moisture Sensor',
  'pH Sensor',
  'Light Sensor',
  'Water Level Sensor',
  'Irrigation Controller',
  'Weather Station',
  'Camera',
  'Other',
]

const units = [
  '°C', // Temperature
  '%', // Humidity, Soil Moisture
  'pH', // pH levels
  'lux', // Light
  'cm', // Water level
  'ppm', // Parts per million
  'V', // Voltage
  'A', // Current
  'none', // No unit
]

export const CreateDeviceModal: React.FC<CreateDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<IoTDeviceRequest>({
    deviceName: '',
    deviceType: '',
    sensorValue: '',
    unit: '',
    expiryDate: '',
    farmDetailsId: 1, // Default farm ID - should be dynamic in real app
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
      // Convert 'none' unit to empty string for API
      const submissionData = {
        ...formData,
        unit: formData.unit === 'none' ? '' : formData.unit,
      }
      await iotDeviceService.createDevice(submissionData)

      toast({
        title: 'Thành công',
        description: 'Đã tạo thiết bị IoT mới',
      })

      // Reset form
      setFormData({
        deviceName: '',
        deviceType: '',
        sensorValue: '',
        unit: '',
        expiryDate: '',
        farmDetailsId: 1,
      })

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo thiết bị IoT',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof IoTDeviceRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Thêm Thiết bị IoT</CardTitle>
              <CardDescription>Tạo thiết bị IoT mới cho nông trại</CardDescription>
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
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo thiết bị
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
