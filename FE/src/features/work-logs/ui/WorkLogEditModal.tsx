import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Wrench,
  Thermometer,
  Droplets,
  Cloud,
  Save,
  X,
} from 'lucide-react'
import {
  taskCategories,
  zoneOptions,
  equipmentOptions,
  timeSlots,
  priorityConfig,
  statusConfig,
  defaultWorkLogValues,
} from '../model/schemas'
import type { WorkLogData } from '../model/schemas'

interface WorkLogEditModalProps {
  isOpen: boolean
  onClose: () => void
  workLog: WorkLogData | null
  onSave: (workLog: WorkLogData) => void
  isLoading?: boolean
}

export const WorkLogEditModal: React.FC<WorkLogEditModalProps> = ({
  isOpen,
  onClose,
  workLog,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<WorkLogData>(defaultWorkLogValues)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])

  useEffect(() => {
    if (workLog) {
      setFormData({
        ...workLog,
        weather: workLog.weather || { conditions: 'default' },
      })
      setSelectedEquipment(workLog.equipment || [])
    } else {
      setFormData({
        ...defaultWorkLogValues,
        weather: { conditions: 'default' },
      })
      setSelectedEquipment([])
    }
  }, [workLog])

  const handleInputChange = (field: keyof WorkLogData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWeatherChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      weather: {
        ...prev.weather,
        [field]: value,
      },
    }))
  }

  const handleEquipmentToggle = (equipment: string) => {
    const newSelection = selectedEquipment.includes(equipment)
      ? selectedEquipment.filter(eq => eq !== equipment)
      : [...selectedEquipment, equipment]

    setSelectedEquipment(newSelection)
    setFormData(prev => ({ ...prev, equipment: newSelection }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const statusConf = statusConfig[formData.status as keyof typeof statusConfig]
  const priorityConf = priorityConfig[formData.priority as keyof typeof priorityConfig]

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {workLog ? 'Chỉnh sửa nhật ký' : 'Tạo nhật ký mới'}
              </h2>
              <p className="text-sm text-gray-600">
                {workLog ? 'Cập nhật thông tin nhật ký công việc' : 'Thêm nhật ký công việc mới'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ngày thực hiện <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={e => handleInputChange('date', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Khu vực <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                      value={formData.zone}
                      onValueChange={value => handleInputChange('zone', value)}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Chọn khu vực" />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneOptions.map(zone => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                      value={formData.startTime}
                      onValueChange={value => handleInputChange('startTime', value)}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Chọn giờ bắt đầu" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Select
                      value={formData.endTime}
                      onValueChange={value => handleInputChange('endTime', value)}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Chọn giờ kết thúc" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nhiệm vụ <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.task}
                  onValueChange={value => handleInputChange('task', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhiệm vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskCategories.map(task => (
                      <SelectItem key={task} value={task}>
                        {task}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết công việc thực hiện..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge className={`${statusConf.bgColor} ${statusConf.color} border-0 w-fit`}>
                    {statusConf.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Độ ưu tiên</label>
                  <Select
                    value={formData.priority}
                    onValueChange={value => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge className={`${priorityConf.bgColor} ${priorityConf.color} border-0 w-fit`}>
                    {priorityConf.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Người thực hiện</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={formData.assignedTo || ''}
                      onChange={e => handleInputChange('assignedTo', e.target.value)}
                      placeholder="Tên người thực hiện"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Thiết bị sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {equipmentOptions.map((equipment, index) => (
                  <div
                    key={index}
                    onClick={() => handleEquipmentToggle(index.toString())}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedEquipment.includes(index.toString())
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">{equipment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Điều kiện thời tiết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nhiệt độ (°C)</label>
                  <div className="relative">
                    <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={formData.weather?.temperature || ''}
                      onChange={e =>
                        handleWeatherChange(
                          'temperature',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="25"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Độ ẩm (%)</label>
                  <div className="relative">
                    <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={formData.weather?.humidity || ''}
                      onChange={e =>
                        handleWeatherChange(
                          'humidity',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="60"
                      className="pl-10"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Điều kiện</label>
                  <Select
                    value={formData.weather?.conditions || 'default'}
                    onValueChange={value =>
                      handleWeatherChange('conditions', value === 'default' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn điều kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Chọn điều kiện</SelectItem>
                      {['Nắng', 'Có mây', 'Mưa nhẹ', 'Mưa to', 'Sương mù', 'Gió lớn'].map(o => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ghi chú bổ sung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ''}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder="Ghi chú thêm về công việc, vấn đề gặp phải, đề xuất cải thiện..."
                rows={4}
              />
            </CardContent>
          </Card>

          {}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Đang lưu...' : workLog ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
