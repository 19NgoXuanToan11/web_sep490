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
  isLoading = false,
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

  // Update form when device or action changes
  React.useEffect(() => {
    if (device && action) {
      setValue('deviceId', device.id)
      setValue('type', action as any)
      setValue('notes', '')
      setValue('duration', action === 'run-now' ? 60 : undefined)
    }
  }, [device, action, setValue])

  const watchedType = watch('type')
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
        return 'This will start the device operation according to its normal schedule.'
      case 'stop':
        return 'This will completely stop the device operation. Any scheduled tasks will be cancelled.'
      case 'pause':
        return 'This will temporarily pause the device operation. The device can be resumed later.'
      case 'run-now':
        return 'This will start the device immediately for the specified duration, overriding the normal schedule.'
      case 'maintenance':
        return 'This will put the device into maintenance mode. All operations will be suspended until maintenance is complete.'
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
        title: 'Action completed',
        description: `Successfully ${action}${action.endsWith('e') ? 'd' : action === 'stop' ? 'ped' : 'ed'} device "${device.name}".`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDialogTitle = () => {
    return `${actionCfg.label} Device`
  }

  const showDurationInput = action === 'run-now'
  const showNotesInput = ['stop', 'maintenance'].includes(action)
  const showWarning = ['stop', 'maintenance'].includes(action)

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ActionIcon className={`h-5 w-5 ${actionCfg.color}`} />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              Confirm action for device: <strong>{device.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Device Info */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Device:</span>
                <span className="text-sm text-gray-900">{device.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Zone:</span>
                <span className="text-sm text-gray-900">{device.zone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Status:</span>
                <Badge variant="outline">{device.status}</Badge>
              </div>
            </div>

            {/* Warning for destructive actions */}
            {showWarning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
              >
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Warning</p>
                  <p>{getActionDescription()}</p>
                </div>
              </motion.div>
            )}

            {/* Action Description */}
            {!showWarning && <div className="text-sm text-gray-600">{getActionDescription()}</div>}

            {/* Duration Input for run-now */}
            {showDurationInput && (
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration (minutes)
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
                  Device will run for {watchedDuration || 60} minute
                  {(watchedDuration || 60) === 1 ? '' : 's'} and then return to idle.
                </p>
              </div>
            )}

            {/* Notes Input for certain actions */}
            {showNotesInput && (
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes {action === 'maintenance' && '(Required)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    action === 'maintenance'
                      ? 'Describe the maintenance work to be performed...'
                      : 'Add optional notes about this action...'
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
              Cancel
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
