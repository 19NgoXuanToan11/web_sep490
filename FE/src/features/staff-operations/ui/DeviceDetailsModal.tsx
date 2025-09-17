import React from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Activity,
  Battery,
  Clock,
  MapPin,
  Wifi,
  Wrench,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
} from 'lucide-react'
import { deviceStatusConfig, batteryLevelConfig } from '../model/schemas'
import type { StaffDevice } from '@/shared/lib/localData'
import { formatDateTime, formatTime } from '@/shared/lib/localData/storage'

interface DeviceDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  device: StaffDevice | null
  onAction?: (deviceId: string, action: string) => void
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  isOpen,
  onClose,
  device,
  onAction,
}) => {
  if (!device) return null

  const statusConfig = deviceStatusConfig[device.status]

  const getBatteryConfig = () => {
    if (!device.batteryLevel) return null
    if (device.batteryLevel <= 25) return batteryLevelConfig.low
    if (device.batteryLevel <= 75) return batteryLevelConfig.medium
    return batteryLevelConfig.high
  }

  const batteryConfig = getBatteryConfig()

  const getStatusIcon = () => {
    switch (device.status) {
      case 'Running':
        return <Play className="h-4 w-4" />
      case 'Paused':
        return <Pause className="h-4 w-4" />
      case 'Maintenance':
        return <Wrench className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const getQuickActions = () => {
    const actions = []
    switch (device.status) {
      case 'Idle':
        actions.push(
          { key: 'start', label: 'Khởi động', icon: Play, color: 'text-green-600' },
          { key: 'run-now', label: 'Chạy ngay', icon: Zap, color: 'text-blue-600' }
        )
        break
      case 'Running':
        actions.push(
          { key: 'pause', label: 'Tạm dừng', icon: Pause, color: 'text-yellow-600' },
          { key: 'stop', label: 'Dừng', icon: Square, color: 'text-red-600' }
        )
        break
      case 'Paused':
        actions.push(
          { key: 'start', label: 'Tiếp tục', icon: Play, color: 'text-green-600' },
          { key: 'stop', label: 'Dừng', icon: Square, color: 'text-red-600' }
        )
        break
      case 'Maintenance':
        actions.push({
          key: 'start',
          label: 'Kết thúc bảo trì',
          icon: Play,
          color: 'text-green-600',
        })
        break
    }
    return actions
  }

  const quickActions = getQuickActions()

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <div className={statusConfig.color}>{getStatusIcon()}</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{device.name}</h2>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {device.zone}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>Chi tiết thông tin và điều khiển thiết bị IoT</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tình trạng hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Trạng thái</p>
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Thời gian hoạt động</p>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{device.uptimePct}%</span>
                  </div>
                </div>
              </div>

              {device.batteryLevel && batteryConfig && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Mức pin</p>
                  <div className="flex items-center gap-2">
                    <Battery className={`h-4 w-4 ${batteryConfig.color}`} />
                    <span className={`font-medium ${batteryConfig.color}`}>
                      {device.batteryLevel}%
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${batteryConfig.bgColor}`}
                        style={{ width: `${device.batteryLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {device.needsMaintenance && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700 font-medium">
                    Thiết bị cần được bảo trì
                  </span>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch trình
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Thao tác cuối</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">
                      {device.lastAction ? formatDateTime(device.lastAction) : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Lịch tiếp theo</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      {device.nextSchedule ? formatDateTime(device.nextSchedule) : 'Không có lịch'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Thao tác nhanh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map(action => {
                    const IconComponent = action.icon
                    return (
                      <Button
                        key={action.key}
                        variant="outline"
                        onClick={() => {
                          onAction?.(device.id, action.key)
                          onClose()
                        }}
                        className="justify-start"
                      >
                        <IconComponent className={`h-4 w-4 mr-2 ${action.color}`} />
                        {action.label}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Tình trạng hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Kết nối mạng</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Tốt</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Hiệu suất</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        device.uptimePct >= 95
                          ? 'bg-green-500'
                          : device.uptimePct >= 85
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    ></div>
                    <span
                      className={`text-sm ${
                        device.uptimePct >= 95
                          ? 'text-green-600'
                          : device.uptimePct >= 85
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {device.uptimePct >= 95
                        ? 'Xuất sắc'
                        : device.uptimePct >= 85
                          ? 'Tốt'
                          : 'Cần cải thiện'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Bảo trì</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${device.needsMaintenance ? 'bg-red-500' : 'bg-green-500'}`}
                    ></div>
                    <span
                      className={`text-sm ${device.needsMaintenance ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {device.needsMaintenance ? 'Cần bảo trì' : 'Bình thường'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
