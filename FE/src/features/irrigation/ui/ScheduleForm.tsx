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

  // Update form when editing schedule changes
  React.useEffect(() => {
    if (editingSchedule) {
      form.reset({
        title: editingSchedule.title,
        deviceId: editingSchedule.deviceId,
        recurrenceType: 'daily', // Default since we don't store this separately
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
          title: 'Schedule Updated',
          description: `"${data.title}" has been updated successfully.`,
          variant: 'success',
        })
      } else {
        await createSchedule(data)
        toast({
          title: 'Schedule Created',
          description: `"${data.title}" has been created successfully.`,
          variant: 'success',
        })
      }
      handleClose()
    } catch (error) {
      toast({
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
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
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    const formattedTime = `${displayHour}:${minute} ${ampm}`

    switch (type) {
      case 'daily':
        return `Daily at ${formattedTime}`
      case 'weekly':
        return `Weekly at ${formattedTime}`
      case 'interval':
        return `Every 6 hours starting at ${formattedTime}`
      default:
        return `Custom schedule at ${formattedTime}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isEditing ? 'Edit Schedule' : 'Create Schedule'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the irrigation schedule details.'
              : 'Create a new automated irrigation schedule.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Schedule Title</Label>
              <InputWithError
                id="title"
                placeholder="e.g., Morning Greenhouse Watering"
                {...form.register('title')}
                error={form.formState.errors.title?.message}
              />
            </div>

            {/* Device Selection */}
            <div className="space-y-2">
              <Label htmlFor="device">Irrigation Device</Label>
              <Select
                value={form.watch('deviceId')}
                onValueChange={value => form.setValue('deviceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
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

            {/* Recurrence Type */}
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence Pattern</Label>
              <Select
                value={form.watch('recurrenceType')}
                onValueChange={(value: any) => form.setValue('recurrenceType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="interval">Every 6 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Start Time
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
                  End Time
                </Label>
                <InputWithError
                  id="endTime"
                  type="time"
                  {...form.register('endTime')}
                  error={form.formState.errors.endTime?.message}
                />
              </div>
            </div>

            {/* Moisture Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold" className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                Moisture Threshold (%)
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
                Irrigation will start when soil moisture falls below this percentage
              </p>
            </div>

            {/* Enabled Switch */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                {...form.register('enabled')}
              />
              <Label htmlFor="enabled" className="text-sm font-medium">
                Enable schedule immediately
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Custom Input component with error support
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
