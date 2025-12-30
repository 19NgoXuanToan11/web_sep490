import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { RefreshCw, MoreHorizontal, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { useToast } from '@/shared/ui/use-toast'
import { iotDeviceService, type IoTDevice } from '@/shared/api/iotDeviceService'
import { CreateDeviceModal } from './components/CreateDeviceModal'
import { DeviceDetailsModal } from './components/DeviceDetailsModal'
import { UpdateDeviceModal } from './components/UpdateDeviceModal'
import { ManagementPageHeader, StaffFilterBar, StaffDataTable, type StaffDataTableColumn } from '@/shared/ui'

interface DeviceActionMenuProps {
  device: IoTDevice
  isActive: boolean
  isUpdatingStatus: boolean
  onViewDetails: (device: IoTDevice) => void
  onEdit: (device: IoTDevice) => void
  onToggleStatus: (device: IoTDevice) => void
}

const DeviceActionMenu: React.FC<DeviceActionMenuProps> = React.memo(({
  device,
  isActive,
  isUpdatingStatus,
  onViewDetails,
  onEdit,
  onToggleStatus,
}) => {
  const [open, setOpen] = useState(false)

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onViewDetails(device)
    }, 0)
  }, [device, onViewDetails])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onEdit(device)
    }, 0)
  }, [device, onEdit])

  const handleToggleStatus = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    setTimeout(() => {
      onToggleStatus(device)
    }, 0)
  }, [device, onToggleStatus])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        sideOffset={5}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          onClick={handleViewDetails}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
        >
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleToggleStatus}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
          disabled={isUpdatingStatus}
        >
          {isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleEdit}
          className="cursor-pointer focus:bg-gray-100"
          onSelect={(e) => e.preventDefault()}
        >
          Chỉnh sửa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

DeviceActionMenu.displayName = 'DeviceActionMenu'

const ManagerIoTDevicesPage: React.FC = () => {
  const { toast } = useToast()
  const [devices, setDevices] = useState<IoTDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null)
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    error: 0,
  })

  const isActiveStatus = (status: number | string | undefined): boolean => {
    if (status === undefined) return false
    const normalizedStatus = typeof status === 'string'
      ? status.toUpperCase()
      : String(status)
    return normalizedStatus === 'ACTIVE' || normalizedStatus === '1'
  }

  const computedStats = useMemo(() => {
    const apiTotal = statistics.total || 0
    const apiActive = statistics.active || 0
    const apiInactive = statistics.inactive || 0
    const apiMaintenance = statistics.maintenance || 0
    const apiError = statistics.error || 0

    if (apiTotal > 0) {
      return {
        total: apiTotal,
        active: apiActive,
        inactive: apiInactive,
        maintenance: apiMaintenance,
        error: apiError,
      }
    }

    const total = devices.length
    const active = devices.filter(d => isActiveStatus(d.status)).length
    const inactive = total - active

    return {
      total,
      active,
      inactive,
      maintenance: 0,
      error: 0,
    }
  }, [devices, statistics])

  useEffect(() => {
    fetchDevices()
    fetchStatistics()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await iotDeviceService.getAllDevices(1, 100)
      setDevices(response.items)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách thiết bị IoT',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const stats = await iotDeviceService.getDeviceStatistics()
      setStatistics(stats)
    } catch (error) {
    }
  }

  const handleRefresh = () => {
    fetchDevices()
    fetchStatistics()
    toast({
      title: 'Đã làm mới',
      description: 'Dữ liệu thiết bị đã được cập nhật',
    })
  }

  const handleCreateSuccess = () => {
    fetchDevices()
    fetchStatistics()
  }

  const handleViewDetails = useCallback((device: IoTDevice) => {
    setSelectedDevice(device)
    setDetailsModalOpen(true)
  }, [])

  const handleUpdateSuccess = useCallback(() => {
    fetchDevices()
    fetchStatistics()
  }, [])

  const handleEditDevice = useCallback((device: IoTDevice) => {
    setSelectedDevice(device)
    setUpdateModalOpen(true)
  }, [])

  const handleToggleDeviceStatus = async (device: IoTDevice) => {
    const deviceId = device.ioTdevicesId ?? device.devicesId
    if (deviceId === undefined || deviceId === null) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thiết bị để cập nhật trạng thái',
        variant: 'destructive',
      })
      return
    }

    const normalizedId = Number(deviceId)
    const nextStatus = isActiveStatus(device.status) ? 0 : 1

    try {
      setStatusUpdatingId(normalizedId)
      await iotDeviceService.updateDeviceStatus(normalizedId, nextStatus)

      setDevices(prev => prev.map(d => {
        const currentId = Number(d.ioTdevicesId ?? d.devicesId)
        if (currentId === normalizedId) {
          return { ...d, status: nextStatus }
        }
        return d
      }))

      fetchStatistics()
      toast({
        title: 'Thành công',
        description: nextStatus === 1 ? 'Đã kích hoạt thiết bị' : 'Đã vô hiệu hóa thiết bị',
      })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái thiết bị',
        variant: 'destructive',
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const getStatusBadge = (status: number | string | undefined) => {
    if (status === undefined) {
      return <Badge variant="outline">Không xác định</Badge>
    }
    const normalizedStatus = typeof status === 'string'
      ? status.toUpperCase()
      : String(status)

    if (normalizedStatus === 'ACTIVE' || normalizedStatus === '1') {
      return <Badge variant="success">Hoạt động</Badge>
    }
    if (normalizedStatus === 'DEACTIVATED' || normalizedStatus === '0') {
      return <Badge variant="destructive">Vô hiệu hóa</Badge>
    }
    return <Badge variant="outline">Không xác định</Badge>
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceType?.toLowerCase().includes(searchQuery.toLowerCase())

    const selectedStatus =
      statusFilter === 'all' ? null : Number.isNaN(Number(statusFilter)) ? null : Number(statusFilter)

    const matchesStatus =
      selectedStatus === null ||
      (selectedStatus === 1 && isActiveStatus(device.status)) ||
      (selectedStatus === 0 && !isActiveStatus(device.status))

    const matchesType = typeFilter === 'all' || device.deviceType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const deviceTypes = [...new Set(devices.map(device => device.deviceType).filter((type): type is string => Boolean(type)))]

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          <ManagementPageHeader
            title="Quản lý thiết bị IoT"
            description="Giám sát và điều khiển các thiết bị IoT trong nông trại"
            actions={
              <Button onClick={handleRefresh} variant="outline">
                Làm mới
              </Button>
            }
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng thiết bị</p>
                    <p className="text-2xl font-semibold mt-1">{computedStats.total}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tổng số thiết bị IoT đã cấu hình trong hệ thống
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Đang hoạt động</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">
                      {computedStats.active}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Thiết bị đang gửi dữ liệu hoặc online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Không hoạt động</p>
                    <p className="text-2xl font-semibold mt-1 text-gray-700">
                      {computedStats.inactive}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Thiết bị chưa cấu hình hoặc đang tạm dừng
                </p>
              </CardContent>
            </Card>
          </div>

          <StaffFilterBar>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm thiết bị..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="1">Hoạt động</SelectItem>
                  <SelectItem value="0">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {deviceTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setCreateModalOpen(true)}>
                Tạo
              </Button>
            </div>
          </StaffFilterBar>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
                </div>
              ) : (
                <StaffDataTable<IoTDevice>
                  className="px-4 sm:px-6 pb-6"
                  data={filteredDevices}
                  getRowKey={(device, index) => device.ioTdevicesId ?? device.devicesId ?? `device-${index}`}
                  currentPage={1}
                  pageSize={filteredDevices.length || 10}
                  totalPages={1}
                  emptyTitle="Không tìm thấy thiết bị nào"
                  emptyDescription="Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm"
                  columns={[
                    {
                      id: 'device',
                      header: 'Thiết bị',
                      render: (device) => (
                        <div className="font-medium">{device.deviceName}</div>
                      ),
                    },
                    {
                      id: 'type',
                      header: 'Loại',
                      render: (device) => device.deviceType || '-',
                    },
                    {
                      id: 'pinCode',
                      header: 'Mã PIN',
                      render: (device) => device.pinCode || '-',
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      render: (device) => getStatusBadge(device.status),
                    },
                    {
                      id: 'lastUpdate',
                      header: 'Cập nhật lần cuối',
                      render: (device) => {
                        if (!device.lastUpdate) return '-'
                        try {
                          const date = new Date(device.lastUpdate)
                          return date.toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        } catch {
                          return device.lastUpdate
                        }
                      },
                    },
                    {
                      id: 'expiryDate',
                      header: 'Ngày hết hạn',
                      render: (device) => {
                        if (!device.expiryDate) return '-'
                        try {
                          const date = new Date(device.expiryDate)
                          return date.toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        } catch {
                          return device.expiryDate
                        }
                      },
                    },
                    {
                      id: 'actions',
                      header: '',
                      render: (device) => (
                        <DeviceActionMenu
                          device={device}
                          isActive={isActiveStatus(device.status)}
                          isUpdatingStatus={statusUpdatingId === Number(device.ioTdevicesId ?? device.devicesId)}
                          onViewDetails={handleViewDetails}
                          onEdit={handleEditDevice}
                          onToggleStatus={handleToggleDeviceStatus}
                        />
                      ),
                    },
                  ] satisfies StaffDataTableColumn<IoTDevice>[]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateDeviceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <DeviceDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDevice(null)
        }}
        device={selectedDevice}
      />
      <UpdateDeviceModal
        isOpen={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false)
          setSelectedDevice(null)
        }}
        onSuccess={handleUpdateSuccess}
        device={selectedDevice}
      />
    </ManagerLayout>
  )
}

export default ManagerIoTDevicesPage
