import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { useToast } from '@/shared/ui/use-toast'
import { Play, Square, Pause, Zap, MapPin, Clock, Activity, AlertTriangle } from 'lucide-react'
import { useIrrigationStore } from '../store/irrigationStore'
import type { Device } from '@/shared/lib/localData'
import { formatTime } from '@/shared/lib/localData/storage'
import { DeviceActionConfirm } from './DeviceActionConfirm'

interface DeviceListProps {
  className?: string
}

export function DeviceList({ className }: DeviceListProps) {
  const { devices, loadingStates, performDeviceAction } = useIrrigationStore()
  const { toast } = useToast()
  const [confirmAction, setConfirmAction] = React.useState<{
    device: Device
    action: 'start' | 'stop' | 'pause' | 'run-now'
  } | null>(null)

  const handleDeviceAction = async (
    device: Device,
    action: 'start' | 'stop' | 'pause' | 'run-now'
  ) => {
    setConfirmAction({ device, action })
  }

  const confirmDeviceAction = async () => {
    if (!confirmAction) return

    try {
      await performDeviceAction(confirmAction.device.id, confirmAction.action)

      const actionMessages = {
        start: 'đã khởi động',
        stop: 'đã dừng',
        pause: 'đã tạm dừng',
        'run-now': 'đã kích hoạt chạy ngay',
      }

      toast({
        title: 'Thao tác thiết bị thành công',
        description: `${confirmAction.device.name} ${actionMessages[confirmAction.action]}.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Thao tác thiết bị thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
    } finally {
      setConfirmAction(null)
    }
  }

  if (!devices.length) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map(device => {
          const deviceLoading = loadingStates[`device-${device.id}`]?.isLoading
          const deviceError = loadingStates[`device-${device.id}`]?.error

          return (
            <Card key={device.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {device.zone}
                    </div>
                  </div>
                  <DeviceStatusBadge status={device.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {deviceError && (
                  <div className="flex items-center gap-2 p-2 text-sm text-destructive bg-destructive/10 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    {deviceError}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Lần chạy gần nhất
                    </div>
                    <span className="font-medium">{formatTime(device.lastRun)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Lần chạy kế tiếp
                    </div>
                    <span className="font-medium">{formatTime(device.nextRun)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Thời gian hoạt động
                    </div>
                    <span className="font-medium">{device.uptimePct.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {device.status === 'Idle' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleDeviceAction(device, 'start')}
                        disabled={deviceLoading}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Khởi động
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeviceAction(device, 'run-now')}
                        disabled={deviceLoading}
                        className="flex items-center gap-1"
                      >
                        <Zap className="h-3 w-3" />
                        Chạy ngay
                      </Button>
                    </>
                  )}

                  {device.status === 'Running' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeviceAction(device, 'pause')}
                        disabled={deviceLoading}
                        className="flex items-center gap-1"
                      >
                        <Pause className="h-3 w-3" />
                        Tạm dừng
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeviceAction(device, 'stop')}
                        disabled={deviceLoading}
                        className="flex items-center gap-1"
                      >
                        <Square className="h-3 w-3" />
                        Dừng
                      </Button>
                    </>
                  )}

                  {device.status === 'Paused' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleDeviceAction(device, 'start')}
                        disabled={deviceLoading}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Tiếp tục
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeviceAction(device, 'stop')}
                        disabled={deviceLoading}
                        className="flex items-center gap-1"
                      >
                        <Square className="h-3 w-3" />
                        Dừng
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>

              {deviceLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Đang xử lý...</span>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <DeviceActionConfirm
        open={confirmAction !== null}
        onOpenChange={open => !open && setConfirmAction(null)}
        device={confirmAction?.device}
        action={confirmAction?.action}
        onConfirm={confirmDeviceAction}
      />
    </div>
  )
}

interface DeviceStatusBadgeProps {
  status: Device['status']
}

function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const statusConfig = {
    Idle: { variant: 'secondary' as const, label: 'Nhàn rỗi' },
    Running: { variant: 'success' as const, label: 'Đang chạy' },
    Paused: { variant: 'warning' as const, label: 'Tạm dừng' },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  )
}
