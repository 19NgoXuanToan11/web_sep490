import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Play, Square, Pause, Zap, Wrench, AlertTriangle, Clock, MessageSquare } from 'lucide-react'
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
import { Textarea } from '@/shared/ui/textarea'
import { Badge } from '@/shared/ui/badge'
import { useToast } from '@/shared/ui/use-toast'
import { deviceActionSchema, actionConfig } from '../model/schemas'
import type { DeviceActionData } from '../model/schemas'
import type { StaffDevice } from '@/shared/lib/localData'

interface DeviceActionModalProps {
  isOpen: boolean
  onClose: () => void
  device: StaffDevice | null
  action: string | null
  onConfirm: (data: DeviceActionData) => Promise<void>
  isLoading?: boolean
}

export const DeviceActionModal: React.FC<DeviceActionModalProps> = ({
  isOpen,
  onClose,
  device,
  action,
  onConfirm,
}) => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeviceActionData>({
    resolver: zodResolver(deviceActionSchema),
    defaultValues: {
      type: action as any,
      deviceId: device?.id || '',
      notes: '',
      duration: undefined,
    },
  })

  React.useEffect(() => {
    if (device && action) {
      setValue('deviceId', device.id)
      setValue('type', action as any)
      setValue('notes', '')
      setValue('duration', action === 'run-now' ? 60 : undefined)
    }
  }, [device, action, setValue])

  const watchedDuration = watch('duration')

  if (!device || !action) return null

  const actionCfg = actionConfig[action]
  if (!actionCfg) return null

  const getActionIcon = () => {
    switch (action) {
      case 'start':
        return Play
      case 'stop':
        return Square
      case 'pause':
        return Pause
      case 'run-now':
        return Zap
      case 'maintenance':
        return Wrench
      default:
        return Play
    }
  }

  const ActionIcon = getActionIcon()

  const getActionDescription = () => {
    switch (action) {
      case 'start':
        return 'Thao tác này sẽ khởi động thiết bị theo lịch trình bình thường.'
      case 'stop':
        return 'Thao tác này sẽ dừng hoàn toàn thiết bị. Tất cả nhiệm vụ đã lên lịch sẽ bị hủy.'
      case 'pause':
        return 'Thao tác này sẽ tạm dừng thiết bị. Thiết bị có thể được tiếp tục sau đó.'
      case 'run-now':
        return 'Thao tác này sẽ khởi động thiết bị ngay lập tức trong thời gian quy định, ghi đè lịch trình bình thường.'
      case 'maintenance':
        return 'Thao tác này sẽ đưa thiết bị vào chế độ bảo trì. Tất cả hoạt động sẽ bị tạm dừng cho đến khi bảo trì hoàn tất.'
      default:
        return actionCfg.description
    }
  }

  const onSubmit = async (data: DeviceActionData) => {
    setIsSubmitting(true)
    try {
      await onConfirm(data)
      reset()
      onClose()
      toast({
        title: 'Thao tác hoàn thành',
        description: `Đã ${action === 'start' ? 'khởi động' : action === 'stop' ? 'dừng' : action === 'pause' ? 'tạm dừng' : action === 'run-now' ? 'chạy ngay' : 'bảo trì'} thiết bị "${device.name}" thành công.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Thao tác thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDialogTitle = () => {
    return `${actionCfg.label} Thiết bị`
  }

  const showDurationInput = action === 'run-now'
  const showNotesInput = ['stop', 'maintenance'].includes(action)
  const showWarning = ['stop', 'maintenance'].includes(action)

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ActionIcon className={`h-5 w-5 ${actionCfg.color}`} />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              Xác nhận thao tác cho thiết bị: <strong>{device.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Thiết bị:</span>
                <span className="text-sm text-gray-900">{device.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Khu vực:</span>
                <span className="text-sm text-gray-900">{device.zone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Trạng thái hiện tại:</span>
                <Badge variant="outline">{device.status}</Badge>
              </div>
            </div>

            {}
            {showWarning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Cảnh báo</p>
                  <p>{getActionDescription()}</p>
                </div>
              </motion.div>
            )}

            {}
            {!showWarning && <div className="text-sm text-gray-600">{getActionDescription()}</div>}

            {}
            {showDurationInput && (
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Thời gian (phút)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="480"
                  placeholder="60"
                  {...register('duration', { valueAsNumber: true })}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && (
                  <p className="text-sm text-red-600">{errors.duration.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Thiết bị sẽ chạy trong {watchedDuration || 60} phút và sau đó trở về trạng thái
                  nghỉ.
                </p>
              </div>
            )}

            {}
            {showNotesInput && (
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Ghi chú {action === 'maintenance' && '(Bắt buộc)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    action === 'maintenance'
                      ? 'Mô tả công việc bảo trì cần thực hiện...'
                      : 'Thêm ghi chú tùy chọn về thao tác này...'
                  }
                  {...register('notes')}
                  className={errors.notes ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`min-w-[100px] ${showWarning ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <ActionIcon className="h-4 w-4 mr-2" />
                  {actionCfg.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
