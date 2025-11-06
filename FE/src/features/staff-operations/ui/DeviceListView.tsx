import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Zap,
  MoreHorizontal,
  Battery,
  AlertTriangle,
  Activity,
  MapPin,
  Square,
  Wrench,
} from 'lucide-react'
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
import { useStaffOperationsStore } from '../store/staffOperationsStore'
import { Loader2 } from 'lucide-react'

interface DeviceListViewProps {
  onDeviceAction?: (deviceId: string, action: string) => void
  onDeviceSelect?: (deviceId: string) => void
}

export const DeviceListView: React.FC<DeviceListViewProps> = ({
  onDeviceAction,
  onDeviceSelect,
}) => {
  const {
    selectedDeviceIds,
    loadingStates,
    getPaginatedDevices,
    getTotalCount,
    toggleDeviceSelection,
  } = useStaffOperationsStore()

  const devices = getPaginatedDevices()
  const totalCount = getTotalCount()
  const isLoading = loadingStates['refresh-all-devices']?.isLoading

  const handleDeviceAction = (deviceId: string, action: string) => {
    onDeviceAction?.(deviceId, action)
  }

  const handleDeviceSelect = (deviceId: string) => {
    toggleDeviceSelection(deviceId)
    onDeviceSelect?.(deviceId)
  }

  const getDeviceLoadingState = (deviceId: string) => {
    return Object.keys(loadingStates).some(
      key => key.includes(deviceId) && loadingStates[key]?.isLoading
    )
  }

  const getBatteryConfig = (batteryLevel?: number) => {
    if (!batteryLevel) return null
    if (batteryLevel <= 25) return batteryLevelConfig.low
    if (batteryLevel <= 75) return batteryLevelConfig.medium
    return batteryLevelConfig.high
  }

  const getQuickActions = (device: StaffDevice) => {
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

  if (isLoading && devices.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải danh sách thiết bị...</p>
        </div>
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Activity className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy thiết bị</h3>
        <p className="text-gray-600">Không có thiết bị nào phù hợp với bộ lọc hiện tại.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {}
      {isLoading && devices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-blue-700 font-medium">
            Đang làm mới trạng thái thiết bị...
          </span>
        </motion.div>
      )}

      {}
      <div className="hidden md:block px-4 py-2">
        <div className="grid grid-cols-12 gap-6 items-center text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="col-span-1">
            <Checkbox
              checked={devices.length > 0 && selectedDeviceIds.length === devices.length}
              onCheckedChange={checked => {
                if (checked) {
                  devices.forEach(device => {
                    if (!selectedDeviceIds.includes(device.id)) {
                      toggleDeviceSelection(device.id)
                    }
                  })
                } else {
                  devices.forEach(device => {
                    if (selectedDeviceIds.includes(device.id)) {
                      toggleDeviceSelection(device.id)
                    }
                  })
                }
              }}
            />
          </div>
          <div className="col-span-4">Thiết bị</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2">Hoạt động</div>
          <div className="col-span-2">Lịch trình</div>
          <div className="col-span-1">Thao tác</div>
        </div>
      </div>

      {}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {devices.map(device => {
            const statusConfig = deviceStatusConfig[device.status]
            const batteryConfig = getBatteryConfig(device.batteryLevel)
            const quickActions = getQuickActions(device)
            const isSelected = selectedDeviceIds.includes(device.id)
            const isDeviceLoading = getDeviceLoadingState(device.id)

            return (
              <motion.div
                key={device.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`relative bg-white border-0 rounded-xl hover:shadow-lg transition-all duration-300 ${
                  isSelected
                    ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50'
                    : 'shadow-sm hover:shadow-md'
                } ${isDeviceLoading ? 'opacity-75' : ''}`}
                onClick={e => e.stopPropagation()}
              >
                {}
                <div className="hidden md:grid grid-cols-12 gap-6 items-center px-6 py-5">
                  {}
                  <div className="col-span-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleDeviceSelect(device.id)}
                    />
                  </div>

                  {}
                  <div className="col-span-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-8 rounded-full ${statusConfig.bgColor}`}></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{device.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {device.zone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {device.uptimePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <Badge
                        className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs px-2 py-1`}
                      >
                        {statusConfig.label}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs">
                        {device.batteryLevel && batteryConfig && (
                          <span className="flex items-center gap-1">
                            <Battery className={`h-3 w-3 ${batteryConfig.color}`} />
                            <span className={batteryConfig.color}>{device.batteryLevel}%</span>
                          </span>
                        )}
                        {device.needsMaintenance && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            Bảo trì
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="col-span-2">
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Kết nối tốt</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            device.uptimePct >= 95
                              ? 'bg-green-500'
                              : device.uptimePct >= 85
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        ></div>
                        <span>
                          {device.uptimePct >= 95
                            ? 'Xuất sắc'
                            : device.uptimePct >= 85
                              ? 'Tốt'
                              : 'Cần cải thiện'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="col-span-2">
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>
                        Cuối:{' '}
                        <span className="text-gray-900">
                          {device.lastAction ? formatTime(device.lastAction) : '--'}
                        </span>
                      </div>
                      {device.nextSchedule && (
                        <div>
                          Tiếp:{' '}
                          <span className="text-blue-600">{formatTime(device.nextSchedule)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {}
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          disabled={isDeviceLoading}
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48"
                        onCloseAutoFocus={e => e.preventDefault()}
                      >
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleDeviceAction(device.id, 'view-details')
                          }}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        {quickActions.map(action => {
                          const IconComponent = action.icon
                          return (
                            <DropdownMenuItem
                              key={action.key}
                              onClick={e => {
                                e.stopPropagation()
                                handleDeviceAction(device.id, action.key)
                              }}
                            >
                              <IconComponent className={`h-4 w-4 mr-2 ${action.color}`} />
                              {action.label}
                            </DropdownMenuItem>
                          )
                        })}
                        {device.status !== 'Maintenance' && (
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation()
                              handleDeviceAction(device.id, 'maintenance')
                            }}
                          >
                            <Wrench className="h-4 w-4 mr-2 text-orange-600" />
                            Bảo trì
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {}
                <div className="md:hidden px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleDeviceSelect(device.id)}
                      />
                      <div className={`w-1 h-6 rounded-full ${statusConfig.bgColor}`}></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{device.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.zone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs px-2 py-1`}
                      >
                        {statusConfig.label}
                      </Badge>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                            disabled={isDeviceLoading}
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48"
                          onCloseAutoFocus={e => e.preventDefault()}
                        >
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation()
                              handleDeviceAction(device.id, 'view-details')
                            }}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {quickActions.map(action => {
                            const IconComponent = action.icon
                            return (
                              <DropdownMenuItem
                                key={action.key}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleDeviceAction(device.id, action.key)
                                }}
                              >
                                <IconComponent className={`h-4 w-4 mr-2 ${action.color}`} />
                                {action.label}
                              </DropdownMenuItem>
                            )
                          })}
                          {device.status !== 'Maintenance' && (
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation()
                                handleDeviceAction(device.id, 'maintenance')
                              }}
                            >
                              <Wrench className="h-4 w-4 mr-2 text-orange-600" />
                              Bảo trì
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>Hoạt động: {device.uptimePct}%</span>
                      <span>Cuối: {device.lastAction ? formatTime(device.lastAction) : '--'}</span>
                      {device.batteryLevel && batteryConfig && (
                        <span className="flex items-center gap-1">
                          <Battery className={`h-3 w-3 ${batteryConfig.color}`} />
                          <span className={batteryConfig.color}>{device.batteryLevel}%</span>
                        </span>
                      )}
                    </div>
                    {device.needsMaintenance && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">Bảo trì</span>
                      </span>
                    )}
                  </div>
                </div>

                {}
                {isDeviceLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">Đang xử lý...</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {}
      <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
        <span>
          Hiển thị {devices.length} trong tổng số {totalCount} thiết bị
        </span>
        {selectedDeviceIds.length > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-blue-600 font-medium"
          >
            {selectedDeviceIds.length} đã chọn
          </motion.span>
        )}
      </div>
    </div>
  )
}
