import React, { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Plus, Eye, Pencil } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { useToast } from '@/shared/ui/use-toast'
import { iotDeviceService, type IoTDevice } from '@/shared/api/iotDeviceService'
import { CreateDeviceModal } from './components/CreateDeviceModal'
import { DeviceDetailsModal } from './components/DeviceDetailsModal'
import { UpdateDeviceModal } from './components/UpdateDeviceModal'
import { ManagementPageHeader } from '@/shared/ui/management-page-header'

const ManagerIoTDevicesPage: React.FC = () => {
  const { toast } = useToast()
  const [devices, setDevices] = useState<IoTDevice[]>([])
  const [loading, setLoading] = useState(true)
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

  const computedStats = useMemo(() => {
    // Ưu tiên số liệu từ API thống kê, fallback sang tính toán từ danh sách thiết bị nếu cần
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
    const active = devices.filter(d => Number(d.status) === 1).length
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

  const handleViewDetails = (device: IoTDevice) => {
    setSelectedDevice(device)
    setDetailsModalOpen(true)
  }

  const handleUpdateSuccess = () => {
    fetchDevices()
    fetchStatistics()
  }

  const handleEditDevice = (device: IoTDevice) => {
    setSelectedDevice(device)
    setUpdateModalOpen(true)
  }

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge variant="default">Hoạt động</Badge>
    }
    return <Badge variant="secondary">Không xác định</Badge>
  }


  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceType?.toLowerCase().includes(searchQuery.toLowerCase())

    // Convert string filter from Select into number for safe comparisons
    const selectedStatus =
      statusFilter === 'all' ? null : Number.isNaN(Number(statusFilter)) ? null : Number(statusFilter)

    // Normalize possibly-string status coming from backend
    const deviceStatus = Number(device.status)

    const matchesStatus =
      selectedStatus === null ||
      (selectedStatus === 1 && deviceStatus === 1) ||
      (selectedStatus === 0 && deviceStatus !== 1)

    const matchesType = typeFilter === 'all' || device.deviceType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const deviceTypes = [...new Set(devices.map(device => device.deviceType).filter(Boolean))]

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          { }
          <ManagementPageHeader
            title="Quản lý thiết bị IoT"
            description="Giám sát và điều khiển các thiết bị IoT trong nông trại"
          />

          { }
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Cần kiểm tra</p>
                    <p className="text-2xl font-semibold mt-1 text-orange-600">
                      {computedStats.maintenance + computedStats.error}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Gồm {computedStats.maintenance} đang bảo trì và {computedStats.error} lỗi
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Khu vực tìm kiếm và lọc */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Tìm kiếm thiết bị..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="1">Hoạt động</SelectItem>
                      <SelectItem value="0">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại</SelectItem>
                      {deviceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thiết bị
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bảng dữ liệu */}
          <div className="border rounded-lg bg-white mt-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">STT</TableHead>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Không tìm thấy thiết bị nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device, index) => (
                    <TableRow key={device.ioTdevicesId}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{device.deviceName}</div>
                      </TableCell>
                      <TableCell>
                        {device.deviceType}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(Number(device.status))}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(device)}
                            title="Xem chi tiết"
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDevice(device)}
                            title="Chỉnh sửa"
                            className="hover:bg-green-50 hover:border-green-300"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
