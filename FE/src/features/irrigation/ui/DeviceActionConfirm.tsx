import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { AlertTriangle, Play, Square, Pause, Zap } from 'lucide-react'
import type { Device } from '@/shared/lib/localData'

interface DeviceActionConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
  action?: 'start' | 'stop' | 'pause' | 'run-now'
  onConfirm: () => void
}

export function DeviceActionConfirm({
  open,
  onOpenChange,
  device,
  action,
  onConfirm,
}: DeviceActionConfirmProps) {
  if (!device || !action) return null

  const actionConfig = {
    start: {
      icon: <Play className="h-5 w-5" />,
      title: 'Start Device',
      description: `Are you sure you want to start ${device.name}? This will begin the irrigation cycle according to the configured schedule.`,
      confirmText: 'Start Device',
      confirmVariant: 'default' as const,
    },
    stop: {
      icon: <Square className="h-5 w-5" />,
      title: 'Stop Device',
      description: `Are you sure you want to stop ${device.name}? This will immediately halt any active irrigation.`,
      confirmText: 'Stop Device',
      confirmVariant: 'destructive' as const,
    },
    pause: {
      icon: <Pause className="h-5 w-5" />,
      title: 'Pause Device',
      description: `Are you sure you want to pause ${device.name}? The irrigation cycle can be resumed later.`,
      confirmText: 'Pause Device',
      confirmVariant: 'outline' as const,
    },
    'run-now': {
      icon: <Zap className="h-5 w-5" />,
      title: 'Run Device Now',
      description: `Are you sure you want to run ${device.name} immediately? This will start an unscheduled irrigation cycle.`,
      confirmText: 'Run Now',
      confirmVariant: 'secondary' as const,
    },
  }

  const config = actionConfig[action]
  const isDestructive = action === 'stop'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isDestructive ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {config.icon}
              </div>
            )}
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{device.zone}</span>
                <Badge variant="outline" className="text-xs">
                  {device.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="py-4">{config.description}</DialogDescription>

        {action === 'run-now' && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <strong>Note:</strong> This will override any existing schedule and begin irrigation
            immediately. The device will return to its normal schedule after completion.
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button variant={config.confirmVariant} onClick={onConfirm} className="w-full sm:w-auto">
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
