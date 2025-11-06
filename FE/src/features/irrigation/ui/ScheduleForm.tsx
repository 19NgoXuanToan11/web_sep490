import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/use-toast'
import { Loader2, Clock, Droplets, Settings } from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'
import type { IrrigationSchedule } from '@/shared/lib/localData'
import { scheduleFormSchema } from '../model/schemas'
import type { ScheduleFormData } from '../model/schemas'

interface ScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSchedule?: IrrigationSchedule | null
  onClose: () => void
}

export function ScheduleForm({ open, onOpenChange, editingSchedule, onClose }: ScheduleFormProps) {
  const { devices, createSchedule, updateSchedule, loadingStates } = useIrrigationStore()
  const { toast } = useToast()
  const isEditing = !!editingSchedule

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: editingSchedule?.title || '',
      deviceId: editingSchedule?.deviceId || '',
      recurrenceType: 'daily',
      startTime: editingSchedule?.startTime || '06:00',
      endTime: editingSchedule?.endTime || '06:30',
      moistureThresholdPct: editingSchedule?.moistureThresholdPct || 30,
      enabled: editingSchedule?.enabled ?? true,
    },
  })

  React.useEffect(() => {
    if (editingSchedule) {
      form.reset({
        title: editingSchedule.title,
        deviceId: editingSchedule.deviceId,
        recurrenceType: 'daily',
        startTime: editingSchedule.startTime,
        endTime: editingSchedule.endTime,
        moistureThresholdPct: editingSchedule.moistureThresholdPct,
        enabled: editingSchedule.enabled,
      })
    } else {
      form.reset({
        title: '',
        deviceId: '',
        recurrenceType: 'daily',
        startTime: '06:00',
        endTime: '06:30',
        moistureThresholdPct: 30,
        enabled: true,
      })
    }
  }, [editingSchedule, form])

  const isLoading =
    loadingStates[isEditing ? `update-schedule-${editingSchedule?.id}` : 'create-schedule']
      ?.isLoading

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (isEditing && editingSchedule) {
        await updateSchedule(editingSchedule.id, {
          title: data.title,
          deviceId: data.deviceId,
          startTime: data.startTime,
          endTime: data.endTime,
          moistureThresholdPct: data.moistureThresholdPct,
          enabled: data.enabled,
          recurrenceText: generateRecurrenceText(data.recurrenceType, data.startTime),
        })
        toast({
          title: 'Lịch đã được cập nhật',
          description: `"${data.title}" cập nhật thành công.`,
          variant: 'success',
        })
      } else {
        await createSchedule(data)
        toast({
          title: 'Tạo lịch thành công',
          description: `"${data.title}" đã được tạo.`,
          variant: 'success',
        })
      }
      handleClose()
    } catch (error) {
      toast({
        title: isEditing ? 'Cập nhật thất bại' : 'Tạo mới thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const generateRecurrenceText = (type: string, startTime: string): string => {
    const [hour, minute] = startTime.split(':')
    const hourNum = parseInt(hour)
    const formattedTime = `${hourNum.toString().padStart(2, '0')}:${minute}`

    switch (type) {
      case 'daily':
        return `Hằng ngày lúc ${formattedTime}`
      case 'weekly':
        return `Hằng tuần lúc ${formattedTime}`
      case 'interval':
        return `Mỗi 6 giờ bắt đầu từ ${formattedTime}`
      default:
        return `Tùy chỉnh lúc ${formattedTime}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isEditing ? 'Sửa lịch' : 'Tạo lịch'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Cập nhật chi tiết lịch tưới.' : 'Tạo lịch tưới tự động mới.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {}
            <div className="space-y-2">
              <Label htmlFor="title">Tên lịch</Label>
              <InputWithError
                id="title"
                placeholder="VD: Tưới buổi sáng nhà kính"
                {...form.register('title')}
                error={form.formState.errors.title?.message}
              />
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="device">Thiết bị tưới</Label>
              <Select
                value={form.watch('deviceId')}
                onValueChange={value => form.setValue('deviceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-muted-foreground">{device.zone}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.deviceId && (
                <p className="text-sm text-destructive">{form.formState.errors.deviceId.message}</p>
              )}
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="recurrence">Kiểu lặp</Label>
              <Select
                value={form.watch('recurrenceType')}
                onValueChange={(value: any) => form.setValue('recurrenceType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Hằng ngày</SelectItem>
                  <SelectItem value="weekly">Hằng tuần</SelectItem>
                  <SelectItem value="interval">Mỗi 6 giờ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Bắt đầu
                </Label>
                <InputWithError
                  id="startTime"
                  type="time"
                  {...form.register('startTime')}
                  error={form.formState.errors.startTime?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Kết thúc
                </Label>
                <InputWithError
                  id="endTime"
                  type="time"
                  {...form.register('endTime')}
                  error={form.formState.errors.endTime?.message}
                />
              </div>
            </div>

            {}
            <div className="space-y-2">
              <Label htmlFor="threshold" className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                Ngưỡng độ ẩm (%)
              </Label>
              <InputWithError
                id="threshold"
                type="number"
                min="0"
                max="100"
                placeholder="30"
                {...form.register('moistureThresholdPct', { valueAsNumber: true })}
                error={form.formState.errors.moistureThresholdPct?.message}
              />
              <p className="text-xs text-muted-foreground">
                Tưới sẽ bắt đầu khi độ ẩm đất thấp hơn giá trị này
              </p>
            </div>

            {}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                {...form.register('enabled')}
              />
              <Label htmlFor="enabled" className="text-sm font-medium">
                Kích hoạt ngay
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Cập nhật' : 'Tạo lịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface InputWithErrorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const InputWithError = React.forwardRef<HTMLInputElement, InputWithErrorProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          className={`${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)
