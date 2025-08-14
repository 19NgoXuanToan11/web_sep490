import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Square,
  Pause,
  Zap,
  Wrench,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { deviceStatusConfig, actionConfig, batteryLevelConfig } from '../model/schemas'
import type { StaffDevice } from '@/shared/lib/localData'
import { formatDateTime, formatTime } from '@/shared/lib/localData/storage'

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

  const getActionIcon = (action: string) => {
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

  const getAvailableActions = () => {
    const actions = []

    switch (device.status) {
      case 'Idle':
        actions.push('start', 'run-now')
        if (!device.needsMaintenance) actions.push('maintenance')
        break
      case 'Running':
        actions.push('pause', 'stop')
        break
      case 'Paused':
        actions.push('start', 'stop')
        break
      case 'Maintenance':
        actions.push('start')
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

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
                  {availableActions.map(action => {
                    const config = actionConfig[action]
                    const IconComponent = getActionIcon(action)

                    return (
                      <DropdownMenuItem key={action} onClick={() => onAction?.(device.id, action)}>
                        <IconComponent className={`h-4 w-4 mr-2 ${config.color}`} />
                        {config.label}
                      </DropdownMenuItem>
                    )
                  })}
                  {availableActions.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem>
                    <Activity className="h-4 w-4 mr-2" />
                    View Details
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
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium">{device.uptimePct}%</span>
            </div>

            {/* Battery Level (if available) */}
            {device.batteryLevel !== undefined && batteryConfig && (
              <div className="flex items-center gap-2">
                <Battery className={`h-3 w-3 ${batteryConfig.color}`} />
                <span className="text-gray-600">Battery:</span>
                <span className={`font-medium ${batteryConfig.color}`}>{device.batteryLevel}%</span>
              </div>
            )}
          </div>

          {/* Schedule Info */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-gray-600">Last Action:</span>
              <span className="font-medium">{formatTime(device.lastAction)}</span>
            </div>

            {device.nextSchedule && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-600" />
                <span className="text-gray-600">Next Run:</span>
                <span className="font-medium">{formatTime(device.nextSchedule)}</span>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {device.needsMaintenance && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                <span className="text-xs text-red-700 font-medium">Maintenance Required</span>
              </div>
            )}

            {device.batteryLevel !== undefined && device.batteryLevel <= 25 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Battery className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                <span className="text-xs text-yellow-700 font-medium">
                  Low Battery ({device.batteryLevel}%)
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {availableActions.length > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              {availableActions.slice(0, 2).map(action => {
                const config = actionConfig[action]
                const IconComponent = getActionIcon(action)

                return (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    onClick={() => onAction?.(device.id, action)}
                    disabled={isLoading}
                    className="flex-1 text-xs"
                  >
                    <IconComponent className={`h-3 w-3 mr-1 ${config.color}`} />
                    {config.label}
                  </Button>
                )
              })}
            </div>
          )}

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
