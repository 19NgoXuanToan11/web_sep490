import React, { useEffect, useState } from 'react'
import {
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  Thermometer,
  Droplets,
  Gauge,
  Clock,
} from 'lucide-react'
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

const ManagerIoTDevicesPage: React.FC = () => {
  const { toast } = useToast()
  const [devices, setDevices] = useState<IoTDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [_statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    error: 0,
  })

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

  const handleUpdateStatus = async (deviceId: number, newStatus: string) => {
    try {
      await iotDeviceService.updateDeviceStatus(deviceId, newStatus)
      await fetchDevices()
      await fetchStatistics()
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái thiết bị',
      })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái thiết bị',
        variant: 'destructive',
      })
    }
  }

  const handleCreateSuccess = () => {
    fetchDevices()
    fetchStatistics()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Hoạt động</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Không hoạt động</Badge>
      case 'MAINTENANCE':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Bảo trì</Badge>
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Lỗi</Badge>
      default:
        return <Badge variant="secondary">Không xác định</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'MAINTENANCE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getDeviceTypeIcon = (deviceType: string) => {
    const type = deviceType?.toLowerCase() || ''
    if (type.includes('temperature') || type.includes('nhiệt độ')) {
      return <Thermometer className="h-4 w-4" />
    }
    if (type.includes('humidity') || type.includes('độ ẩm')) {
      return <Droplets className="h-4 w-4" />
    }
    if (type.includes('soil') || type.includes('đất')) {
      return <Gauge className="h-4 w-4" />
    }
    return <Cpu className="h-4 w-4" />
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.deviceType?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesType = typeFilter === 'all' || device.deviceType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const deviceTypes = [...new Set(devices.map(device => device.deviceType).filter(Boolean))]

  return (
    <ManagerLayout>
      <div className="p-6">
        <div className="space-y-8">
          { }
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Thiết bị IoT</h1>
            <p className="text-gray-600 mt-2">
              Giám sát và điều khiển các thiết bị IoT trong nông trại
            </p>
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
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                      <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                      <SelectItem value="ERROR">Lỗi</SelectItem>
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
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Giá trị cảm biến</TableHead>
                  <TableHead>Cập nhật cuối</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Không tìm thấy thiết bị nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map(device => (
                    <TableRow key={device.ioTdevicesId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getDeviceTypeIcon(device.deviceType)}
                          <div>
                            <div className="font-medium">{device.deviceName}</div>
                            <div className="text-sm text-gray-500">
                              ID: {device.ioTdevicesId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceTypeIcon(device.deviceType)}
                          {device.deviceType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(device.status)}
                          {getStatusBadge(device.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.sensorValue ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{device.sensorValue}</span>
                            {device.unit && (
                              <span className="text-sm text-gray-500">{device.unit}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {device.lastUpdate ? (
                            new Date(device.lastUpdate).toLocaleString('vi-VN')
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(device.ioTdevicesId!, 'ACTIVE')}
                              disabled={device.status === 'ACTIVE'}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Kích hoạt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(device.ioTdevicesId!, 'INACTIVE')
                              }
                              disabled={device.status === 'INACTIVE'}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Tạm dừng
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(device.ioTdevicesId!, 'MAINTENANCE')
                              }
                              disabled={device.status === 'MAINTENANCE'}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Bảo trì
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      { }
      <CreateDeviceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </ManagerLayout>
  )
}

export default ManagerIoTDevicesPage
