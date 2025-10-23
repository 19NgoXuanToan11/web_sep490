import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  RefreshCw,
  Search,
  AlertTriangle,
  Battery,
  Activity,
  Users,
  Cpu,
  Grid3X3,
  List,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Select } from '@/shared/ui/select'
import { DeviceGridView } from '@/features/staff-operations/ui/DeviceGridView'
import { DeviceListView } from '@/features/staff-operations/ui/DeviceListView'
import { DeviceActionModal } from '@/features/staff-operations/ui/DeviceActionModal'
import { DeviceDetailsModal } from '@/features/staff-operations/ui/DeviceDetailsModal'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useStaffOperationsStore } from '@/features/staff-operations/store/staffOperationsStore'
import { useToast } from '@/shared/ui/use-toast'
import type { DeviceActionData } from '@/features/staff-operations/model/schemas'

const StaffOperationsPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list') // Default to list view
  const [pendingAction, setPendingAction] = useState<{ deviceId: string; action: string } | null>(
    null
  )

  const {
    initializeData,
    devices,
    searchState,
    selectedDeviceIds,
    autoRefresh,
    refreshInterval,
    lastUpdateTime,
    loadingStates,
    setSearch,
    setFilters,
    clearFilters,
    filters,
    executeDeviceAction,
    refreshDeviceStatus,
    clearSelection,
    getDevicesByStatus,
    getMaintenanceDevices,
    getLowBatteryDevices,
    getZonesList,
  } = useStaffOperationsStore()

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshDeviceStatus()
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshDeviceStatus])

  const deviceStatusCounts = getDevicesByStatus()
  const maintenanceDevices = getMaintenanceDevices()
  const lowBatteryDevices = getLowBatteryDevices()
  const zonesList = getZonesList()

  const handleDeviceAction = (deviceId: string, action: string) => {
    if (action === 'view-details') {
      setSelectedDeviceId(deviceId)
      setDetailsModalOpen(true)
    } else {
      setSelectedDeviceId(deviceId)
      setPendingAction({ deviceId, action })
      setActionModalOpen(true)
    }
  }

  const handleActionConfirm = async (data: DeviceActionData) => {
    try {
      await executeDeviceAction(data)
      toast({
        title: 'Thao tác thành công',
        description: `Thao tác thiết bị "${data.type}" đã được thực hiện thành công.`,
        variant: 'default',
      })
      setActionModalOpen(false)
      setPendingAction(null)
    } catch (error) {
      toast({
        title: 'Thao tác thất bại',
        description:
          error instanceof Error ? error.message : 'Không thể thực hiện thao tác thiết bị',
        variant: 'destructive',
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshDeviceStatus()
      toast({
        title: 'Đã làm mới',
        description: 'Trạng thái thiết bị đã được cập nhật thành công.',
      })
    } catch (error) {
      toast({
        title: 'Làm mới thất bại',
        description: 'Không thể cập nhật trạng thái thiết bị.',
        variant: 'destructive',
      })
    }
  }

  const isLoading = loadingStates['refresh-all-devices']?.isLoading

  return (
    <StaffLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Cpu className="h-8 w-8 mr-3 text-blue-600" />
                  Điều khiển thiết bị
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Giám sát và điều khiển thiết bị IoT trên tất cả các khu vực trang trại
                </p>
              </div>

              {/* Header Actions */}
              <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Activity className="h-4 w-4 mr-1" />
                  Cập nhật lần cuối: {new Date(lastUpdateTime).toLocaleTimeString()}
                </div>

                <div className="flex space-x-2">
                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <Button
                      onClick={() => setViewMode('list')}
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none border-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setViewMode('grid')}
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none border-0"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tổng thiết bị</p>
                    <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Thiết bị hoạt động</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deviceStatusCounts.Running || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Cần bảo trì</p>
                    <p className="text-2xl font-bold text-gray-900">{maintenanceDevices.length}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Battery className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pin yếu</p>
                    <p className="text-2xl font-bold text-gray-900">{lowBatteryDevices.length}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <Card className="p-6 mb-8">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm thiết bị theo tên, khu vực hoặc trạng thái..."
                  value={searchState.query}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Lọc theo:
                </span>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={value => setFilters({ status: value as any })}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Idle">Nghỉ</option>
                    <option value="Running">Đang chạy</option>
                    <option value="Paused">Tạm dừng</option>
                    <option value="Maintenance">Bảo trì</option>
                  </Select>

                  <Select
                    value={filters.zone || ''}
                    onValueChange={value => setFilters({ zone: value })}
                  >
                    <option value="">Tất cả khu vực</option>
                    {zonesList.map(zone => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={filters.batteryLevel || 'all'}
                    onValueChange={value => setFilters({ batteryLevel: value as any })}
                  >
                    <option value="all">Tất cả pin</option>
                    <option value="low">Thấp (≤25%)</option>
                    <option value="medium">Trung bình (26-75%)</option>
                    <option value="high">Cao (&gt;75%)</option>
                  </Select>

                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected Count */}
            {selectedDeviceIds.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-700">
                  {selectedDeviceIds.length} thiết bị đã chọn
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Xóa lựa chọn
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Thao tác hàng loạt
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Device View */}
          <Card className={viewMode === 'list' ? 'p-6' : 'p-6'}>
            {viewMode === 'list' ? (
              <DeviceListView
                onDeviceAction={handleDeviceAction}
                onDeviceSelect={setSelectedDeviceId}
              />
            ) : (
              <DeviceGridView
                onDeviceAction={handleDeviceAction}
                onDeviceSelect={setSelectedDeviceId}
              />
            )}
          </Card>
        </div>

        {/* Device Action Modal */}
        {actionModalOpen && selectedDeviceId && pendingAction && (
          <DeviceActionModal
            isOpen={actionModalOpen}
            onClose={() => {
              setActionModalOpen(false)
              setPendingAction(null)
            }}
            device={devices.find(d => d.id === selectedDeviceId) || null}
            action={pendingAction.action}
            onConfirm={handleActionConfirm}
          />
        )}

        {/* Device Details Modal */}
        {detailsModalOpen && selectedDeviceId && (
          <DeviceDetailsModal
            isOpen={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false)
              setSelectedDeviceId(null)
            }}
            device={devices.find(d => d.id === selectedDeviceId) || null}
            onAction={handleDeviceAction}
          />
        )}
      </div>
    </StaffLayout>
  )
}

export default StaffOperationsPage
