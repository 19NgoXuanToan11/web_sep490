import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Checkbox } from '@/shared/ui/checkbox'
import { Slider } from '@/shared/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Save,
  X,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Thermometer,
  Leaf,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  qualityCheckSchema,
  cropTypes,
  zoneOptions,
  checkTypeConfig,
  statusConfig,
  priorityConfig,
  growthStageConfig,
  leafColorOptions,
  commonIssues,
  recommendedActions,
  defaultQualityCheckValues,
} from '../model/schemas'
import type { QualityCheckData } from '../model/schemas'

interface QualityCheckEditModalProps {
  isOpen: boolean
  onClose: () => void
  qualityCheck: QualityCheckData | null
  onSave: (data: QualityCheckData | Omit<QualityCheckData, 'id'>) => Promise<void>
}

export const QualityCheckEditModal: React.FC<QualityCheckEditModalProps> = ({
  isOpen,
  onClose,
  qualityCheck,
  onSave,
}) => {
  const [customIssue, setCustomIssue] = useState('')
  const [customAction, setCustomAction] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = qualityCheck !== null

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<QualityCheckData>({
    resolver: zodResolver(qualityCheckSchema),
    defaultValues: qualityCheck || defaultQualityCheckValues,
  })

  useEffect(() => {
    if (qualityCheck) {
      reset(qualityCheck)
    } else {
      reset(defaultQualityCheckValues)
    }
  }, [qualityCheck, reset])

  const watchedValues = watch()

  const onSubmit = async (data: QualityCheckData) => {
    setSaving(true)
    try {
      if (isEditing && qualityCheck?.id) {
        await onSave({ ...data, id: qualityCheck.id })
      } else {
        const { id, ...createData } = data
        await onSave(createData)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save quality check:', error)
    } finally {
      setSaving(false)
    }
  }

  const addIssue = () => {
    if (!customIssue.trim()) return
    const currentIssues = getValues('issues') || []
    setValue('issues', [...currentIssues, customIssue.trim()])
    setCustomIssue('')
  }

  const removeIssue = (index: number) => {
    const currentIssues = getValues('issues') || []
    setValue(
      'issues',
      currentIssues.filter((_, i) => i !== index)
    )
  }

  const addAction = () => {
    if (!customAction.trim()) return
    const currentActions = getValues('recommendedActions') || []
    setValue('recommendedActions', [...currentActions, customAction.trim()])
    setCustomAction('')
  }

  const removeAction = (index: number) => {
    const currentActions = getValues('recommendedActions') || []
    setValue(
      'recommendedActions',
      currentActions.filter((_, i) => i !== index)
    )
  }

  const addCommonIssue = (issue: string) => {
    const currentIssues = getValues('issues') || []
    if (!currentIssues.includes(issue)) {
      setValue('issues', [...currentIssues, issue])
    }
  }

  const addCommonAction = (action: string) => {
    const currentActions = getValues('recommendedActions') || []
    if (!currentActions.includes(action)) {
      setValue('recommendedActions', [...currentActions, action])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Chỉnh sửa kiểm tra chất lượng' : 'Tạo kiểm tra chất lượng mới'}
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {isEditing
                  ? `${qualityCheck?.zone} - ${qualityCheck?.cropType}`
                  : 'Thông tin kiểm tra mới'}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật thông tin kiểm tra chất lượng'
              : 'Thêm thông tin kiểm tra chất lượng mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Ngày kiểm tra</Label>
                  <Input type="date" id="date" {...register('date')} />
                  {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Thời gian</Label>
                  <Input type="time" id="time" {...register('time')} />
                  {errors.time && <p className="text-sm text-red-600">{errors.time.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone">Khu vực</Label>
                  <Select
                    value={watchedValues.zone}
                    onValueChange={value => setValue('zone', value)}
                  >
                    <SelectTrigger>
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
                  {errors.zone && <p className="text-sm text-red-600">{errors.zone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropType">Loại cây trồng</Label>
                  <Select
                    value={watchedValues.cropType}
                    onValueChange={value => setValue('cropType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại cây trồng" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropTypes.map(crop => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.cropType && (
                    <p className="text-sm text-red-600">{errors.cropType.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkType">Loại kiểm tra</Label>
                  <Select
                    value={watchedValues.checkType}
                    onValueChange={value => setValue('checkType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại kiểm tra" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(checkTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.checkType && (
                    <p className="text-sm text-red-600">{errors.checkType.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={watchedValues.status}
                    onValueChange={value => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Select
                    value={watchedValues.priority}
                    onValueChange={value => setValue('priority', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-red-600">{errors.priority.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspector">Người kiểm tra</Label>
                <Input id="inspector" placeholder="Tên người kiểm tra" {...register('inspector')} />
                {errors.inspector && (
                  <p className="text-sm text-red-600">{errors.inspector.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Đánh giá sức khỏe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sức khỏe tổng thể: {watchedValues.overallHealth}/10</Label>
                <Slider
                  value={[watchedValues.overallHealth || 7]}
                  onValueChange={([value]: number[]) => setValue('overallHealth', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="growthStage">Giai đoạn tăng trưởng</Label>
                  <Select
                    value={watchedValues.growthStage}
                    onValueChange={value => setValue('growthStage', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giai đoạn" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(growthStageConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leafColor">Màu lá</Label>
                  <Select
                    value={watchedValues.leafColor}
                    onValueChange={value => setValue('leafColor', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn màu lá" />
                    </SelectTrigger>
                    <SelectContent>
                      {leafColorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plantHeight">Chiều cao cây (cm)</Label>
                  <Input
                    type="number"
                    id="plantHeight"
                    placeholder="0"
                    {...register('plantHeight', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fruitCount">Số lượng quả</Label>
                  <Input
                    type="number"
                    id="fruitCount"
                    placeholder="0"
                    {...register('fruitCount', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diseasePresent"
                    checked={watchedValues.diseasePresent}
                    onCheckedChange={checked => setValue('diseasePresent', checked as boolean)}
                  />
                  <Label htmlFor="diseasePresent">Có dấu hiệu bệnh tật</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pestPresent"
                    checked={watchedValues.pestPresent}
                    onCheckedChange={checked => setValue('pestPresent', checked as boolean)}
                  />
                  <Label htmlFor="pestPresent">Có sâu bệnh</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nutrientDeficiency"
                    checked={watchedValues.nutrientDeficiency}
                    onCheckedChange={checked => setValue('nutrientDeficiency', checked as boolean)}
                  />
                  <Label htmlFor="nutrientDeficiency">Thiếu dinh dưỡng</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Điều kiện môi trường
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Nhiệt độ (°C)</Label>
                  <Input
                    type="number"
                    id="temperature"
                    placeholder="25"
                    {...register('temperature', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="humidity">Độ ẩm (%)</Label>
                  <Input
                    type="number"
                    id="humidity"
                    placeholder="65"
                    min="0"
                    max="100"
                    {...register('humidity', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soilMoisture">Độ ẩm đất (%)</Label>
                  <Input
                    type="number"
                    id="soilMoisture"
                    placeholder="60"
                    min="0"
                    max="100"
                    {...register('soilMoisture', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Vấn đề & Hành động khuyến nghị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {}
                <div className="space-y-3">
                  <Label>Vấn đề phát hiện</Label>
                  <div className="space-y-2">
                    {(watchedValues.issues || []).map((issue, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                        <span className="flex-1 text-sm">{issue}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIssue(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm vấn đề..."
                      value={customIssue}
                      onChange={e => setCustomIssue(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addIssue())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addIssue}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {commonIssues.slice(0, 6).map(issue => (
                      <Button
                        key={issue}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCommonIssue(issue)}
                        className="text-xs"
                      >
                        {issue}
                      </Button>
                    ))}
                  </div>
                </div>

                {}
                <div className="space-y-3">
                  <Label>Hành động khuyến nghị</Label>
                  <div className="space-y-2">
                    {(watchedValues.recommendedActions || []).map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                      >
                        <span className="flex-1 text-sm">{action}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm hành động..."
                      value={customAction}
                      onChange={e => setCustomAction(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAction())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addAction}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recommendedActions.slice(0, 6).map(action => (
                      <Button
                        key={action}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCommonAction(action)}
                        className="text-xs"
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Theo dõi & Ghi chú
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresFollowUp"
                  checked={watchedValues.requiresFollowUp}
                  onCheckedChange={checked => setValue('requiresFollowUp', checked as boolean)}
                />
                <Label htmlFor="requiresFollowUp">Cần theo dõi tiếp</Label>
              </div>

              {watchedValues.requiresFollowUp && (
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Ngày theo dõi</Label>
                  <Input type="date" id="followUpDate" {...register('followUpDate')} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú thêm về tình trạng cây trồng..."
                  rows={4}
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          {}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving
                ? isEditing
                  ? 'Đang lưu...'
                  : 'Đang tạo...'
                : isEditing
                  ? 'Lưu thay đổi'
                  : 'Tạo kiểm tra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
