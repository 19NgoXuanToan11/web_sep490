import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  Battery,
  Activity,
  Users,
  Cpu,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Select } from '@/shared/ui/select'
import { DeviceGridView } from '@/features/staff-operations/ui/DeviceGridView'
import { DeviceActionModal } from '@/features/staff-operations/ui/DeviceActionModal'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useStaffOperationsStore } from '@/features/staff-operations/store/staffOperationsStore'
import { useToast } from '@/shared/ui/use-toast'
import type { DeviceActionData } from '@/features/staff-operations/model/schemas'

const StaffOperationsPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
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
    exportDevicesCSV,
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
    setSelectedDeviceId(deviceId)
    setPendingAction({ deviceId, action })
    setActionModalOpen(true)
  }

  const handleActionConfirm = async (data: DeviceActionData) => {
    try {
      await executeDeviceAction(data)
      toast({
        title: 'Action Successful',
        description: `Device action "${data.type}" executed successfully.`,
        variant: 'default',
      })
      setActionModalOpen(false)
      setPendingAction(null)
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'Failed to execute device action',
        variant: 'destructive',
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshDeviceStatus()
      toast({
        title: 'Refreshed',
        description: 'Device status updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh device status.',
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
                  Device Operations
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Monitor and control IoT devices across all farm zones
                </p>
              </div>

              {/* Header Actions */}
              <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Activity className="h-4 w-4 mr-1" />
                  Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    onClick={exportDevicesCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
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
                    <p className="text-sm font-medium text-gray-500">Total Devices</p>
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
                    <p className="text-sm font-medium text-gray-500">Active Devices</p>
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
                    <p className="text-sm font-medium text-gray-500">Need Maintenance</p>
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
                    <p className="text-sm font-medium text-gray-500">Low Battery</p>
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
                  placeholder="Search devices by name, zone, or status..."
                  value={searchState.query}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by:
                </span>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={value => setFilters({ status: value as any })}
                  >
                    <option value="all">All Status</option>
                    <option value="Idle">Idle</option>
                    <option value="Running">Running</option>
                    <option value="Paused">Paused</option>
                    <option value="Maintenance">Maintenance</option>
                  </Select>

                  <Select
                    value={filters.zone || ''}
                    onValueChange={value => setFilters({ zone: value })}
                  >
                    <option value="">All Zones</option>
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
                    <option value="all">All Battery</option>
                    <option value="low">Low (≤25%)</option>
                    <option value="medium">Medium (26-75%)</option>
                    <option value="high">High (&gt;75%)</option>
                  </Select>

                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected Count */}
            {selectedDeviceIds.length > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-700">
                  {selectedDeviceIds.length} device{selectedDeviceIds.length === 1 ? '' : 's'}{' '}
                  selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Bulk Actions
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Device Grid */}
          <Card className="p-6">
            <DeviceGridView
              onDeviceAction={handleDeviceAction}
              onDeviceSelect={setSelectedDeviceId}
            />
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
      </div>
    </StaffLayout>
  )
}

export default StaffOperationsPage
