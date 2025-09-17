import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Zap,
  MoreHorizontal,
  Battery,
  AlertTriangle,
  Clock,
  Wifi,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { deviceStatusConfig, batteryLevelConfig } from '../model/schemas'
import type { StaffDevice } from '@/shared/lib/localData'
import { formatTime } from '@/shared/lib/localData/storage'

interface DeviceCardProps {
  device: StaffDevice
  isSelected?: boolean
  onSelect?: (deviceId: string) => void
  onAction?: (deviceId: string, action: string) => void
  isLoading?: boolean
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isSelected = false,
  onSelect,
  onAction,
  isLoading = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const statusConfig = deviceStatusConfig[device.status]

  const getBatteryConfig = () => {
    if (!device.batteryLevel) return null

    if (device.batteryLevel <= 25) return batteryLevelConfig.low
    if (device.batteryLevel <= 75) return batteryLevelConfig.medium
    return batteryLevelConfig.high
  }

  const batteryConfig = getBatteryConfig()

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`relative transition-all duration-200 ${
          isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''
        } ${isHovered ? 'shadow-lg' : 'shadow-md'} ${isLoading ? 'opacity-50' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(device.id)}
                  className="mt-1"
                />
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{device.name}</h3>
                <p className="text-xs text-gray-600 mt-1 truncate">{device.zone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Status Badge */}
              <Badge
                variant="outline"
                className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}
              >
                {statusConfig.label}
              </Badge>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAction?.(device.id, 'view-details')}>
                    <Activity className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Device Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Uptime */}
            <div className="flex items-center gap-2">
              <Wifi className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">Thời gian hoạt động:</span>
              <span className="font-medium">{device.uptimePct}%</span>
            </div>

            {/* Battery Level (if available) */}
            {device.batteryLevel !== undefined && batteryConfig && (
              <div className="flex items-center gap-2">
                <Battery className={`h-3 w-3 ${batteryConfig.color}`} />
                <span className="text-gray-600">Pin:</span>
                <span className={`font-medium ${batteryConfig.color}`}>{device.batteryLevel}%</span>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-gray-600">Thao tác cuối:</span>
              <span className="font-medium">
                {device.lastAction ? formatTime(device.lastAction) : '--'}
              </span>
            </div>

            {device.nextSchedule && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-600" />
                <span className="text-gray-600">Chạy tiếp theo:</span>
                <span className="font-medium">{formatTime(device.nextSchedule)}</span>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {device.needsMaintenance && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                <span className="text-xs text-red-700 font-medium">Cần bảo trì</span>
              </div>
            )}

            {device.batteryLevel !== undefined && device.batteryLevel <= 25 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Battery className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                <span className="text-xs text-yellow-700 font-medium">
                  Pin yếu ({device.batteryLevel}%)
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions - Show only main actions based on status */}
          <div className="flex gap-2 pt-2 border-t">
            {device.status === 'Idle' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.(device.id, 'start')}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                <Play className="h-3 w-3 mr-1 text-green-600" />
                Khởi động
              </Button>
            )}
            {device.status === 'Running' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.(device.id, 'pause')}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                <Pause className="h-3 w-3 mr-1 text-yellow-600" />
                Tạm dừng
              </Button>
            )}
            {device.status === 'Paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.(device.id, 'start')}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                <Play className="h-3 w-3 mr-1 text-green-600" />
                Khởi động
              </Button>
            )}
            {(device.status === 'Idle' || device.status === 'Paused') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction?.(device.id, 'run-now')}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                <Zap className="h-3 w-3 mr-1 text-blue-600" />
                Chạy ngay
              </Button>
            )}
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
