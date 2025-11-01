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
      title: 'Khởi động thiết bị',
      description: `Bạn có chắc muốn khởi động ${device.name}? Chu kỳ tưới sẽ bắt đầu theo lịch đã cấu hình.`,
      confirmText: 'Khởi động',
      confirmVariant: 'default' as const,
    },
    stop: {
      icon: <Square className="h-5 w-5" />,
      title: 'Dừng thiết bị',
      description: `Bạn có chắc muốn dừng ${device.name}? Hệ thống sẽ dừng mọi hoạt động tưới đang diễn ra.`,
      confirmText: 'Dừng',
      confirmVariant: 'destructive' as const,
    },
    pause: {
      icon: <Pause className="h-5 w-5" />,
      title: 'Tạm dừng thiết bị',
      description: `Bạn có chắc muốn tạm dừng ${device.name}? Có thể tiếp tục lại sau.`,
      confirmText: 'Tạm dừng',
      confirmVariant: 'outline' as const,
    },
    'run-now': {
      icon: <Zap className="h-5 w-5" />,
      title: 'Chạy ngay',
      description: `Bạn có chắc muốn cho ${device.name} chạy ngay? Điều này sẽ bắt đầu một chu kỳ tưới ngoài lịch.`,
      confirmText: 'Chạy ngay',
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
                  {device.status === 'Running'
                    ? 'Đang chạy'
                    : device.status === 'Idle'
                      ? 'Nhàn rỗi'
                      : device.status === 'Paused'
                        ? 'Tạm dừng'
                        : device.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="py-4">{config.description}</DialogDescription>

        {action === 'run-now' && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <strong>Lưu ý:</strong> Hành động này sẽ ghi đè lịch hiện tại và bắt đầu tưới ngay.
            Thiết bị sẽ trở về lịch bình thường sau khi hoàn tất.
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button variant={config.confirmVariant} onClick={onConfirm} className="w-full sm:w-auto">
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
