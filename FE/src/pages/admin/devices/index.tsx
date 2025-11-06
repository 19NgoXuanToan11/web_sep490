import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Settings,
  Eye,
  Wifi,
  WifiOff,
  Battery,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { useToast } from '@/shared/ui/use-toast'

interface IoTDevice {
  id: string
  name: string
  type: string
  farmName: string
  zone: string
  status: 'online' | 'offline' | 'warning' | 'error'
  lastSeen: string
  batteryLevel?: number
  temperature?: number
  humidity?: number
  soilMoisture?: number
  firmwareVersion: string
  installDate: string
}

const AdminDevicesPage: React.FC = () => {
  const { toast } = useToast()
  const [devices, setDevices] = useState<IoTDevice[]>([
    {
      id: 'dev-001',
      name: 'Temperature Sensor A1',
      type: 'Temperature Sensor',
      farmName: 'Trang trại Green Valley',
      zone: 'Nhà kính A',
      status: 'online',
      lastSeen: '2024-01-15T10:30:00Z',
      batteryLevel: 85,
      temperature: 24.5,
      humidity: 65,
      firmwareVersion: '1.2.3',
      installDate: '2023-06-15',
    },
    {
      id: 'dev-002',
      name: 'Soil Moisture B2',
      type: 'Soil Moisture Sensor',
      farmName: 'Trang trại Eco Farm',
      zone: 'Cánh đồng B',
      status: 'warning',
      lastSeen: '2024-01-15T10:25:00Z',
      batteryLevel: 25,
      soilMoisture: 45,
      firmwareVersion: '1.1.8',
      installDate: '2023-08-20',
    },
    {
      id: 'dev-003',
      name: 'Irrigation Controller C1',
      type: 'Irrigation Controller',
      farmName: 'Trang trại Smart Farm',
      zone: 'Khu C',
      status: 'offline',
      lastSeen: '2024-01-15T08:45:00Z',
      firmwareVersion: '2.0.1',
      installDate: '2023-04-10',
    },
    {
      id: 'dev-004',
      name: 'Weather Station D1',
      type: 'Weather Station',
      farmName: 'Trang trại Green Valley',
      zone: 'Trung tâm',
      status: 'online',
      lastSeen: '2024-01-15T10:31:00Z',
      batteryLevel: 92,
      temperature: 26.8,
      humidity: 58,
      firmwareVersion: '1.5.2',
      installDate: '2023-03-05',
    },
    {
      id: 'dev-005',
      name: 'Humidity Sensor E1',
      type: 'Humidity Sensor',
      farmName: 'Trang trại Organic Plus',
      zone: 'Nhà kính E',
      status: 'error',
      lastSeen: '2024-01-15T09:15:00Z',
      batteryLevel: 0,
      humidity: 0,
      firmwareVersion: '1.0.5',
      installDate: '2023-09-12',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {

    const interval = setInterval(() => {

      setDevices(prev =>
        prev.map(device => ({
          ...device,
          lastSeen: new Date().toISOString(),
          batteryLevel: device.batteryLevel
            ? Math.max(0, device.batteryLevel - Math.random() * 2)
            : undefined,
        }))
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.zone.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesType = typeFilter === 'all' || device.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const deviceStats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    warning: devices.filter(d => d.status === 'warning').length,
    error: devices.filter(d => d.status === 'error').length,
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast({
      title: 'Dữ liệu đã được cập nhật',
      description: 'Tất cả thiết bị đã được làm mới.',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Cpu className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      online: 'default',
      offline: 'secondary',
      warning: 'secondary',
      error: 'destructive',
    }

    const labels: Record<string, string> = {
      online: 'Trực tuyến',
      offline: 'Ngoại tuyến',
      warning: 'Cảnh báo',
      error: 'Lỗi',
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    )
  }

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`
    return `${Math.floor(diffMins / 1440)} ngày trước`
  }

  const deviceTypes = Array.from(new Set(devices.map(d => d.type)))

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý thiết bị IoT</h1>
            <p className="text-gray-600">Giám sát và quản lý tất cả thiết bị IoT trong hệ thống</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng thiết bị</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deviceStats.total}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trực tuyến</CardTitle>
                <Wifi className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{deviceStats.online}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ngoại tuyến</CardTitle>
                <WifiOff className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{deviceStats.offline}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cảnh báo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{deviceStats.warning}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lỗi</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{deviceStats.error}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc và tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên thiết bị, trang trại, hoặc khu vực..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Trạng thái: {statusFilter === 'all' ? 'Tất cả' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>Tất cả</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('online')}>
                    Trực tuyến
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('offline')}>
                    Ngoại tuyến
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('warning')}>
                    Cảnh báo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('error')}>Lỗi</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Loại: {typeFilter === 'all' ? 'Tất cả' : typeFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setTypeFilter('all')}>Tất cả</DropdownMenuItem>
                  {deviceTypes.map(type => (
                    <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                      {type}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Danh sách thiết bị ({filteredDevices.length})
            </CardTitle>
            <CardDescription>Tất cả thiết bị IoT trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thiết bị</TableHead>
                    <TableHead>Trang trại</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Dữ liệu cảm biến</TableHead>
                    <TableHead>Pin</TableHead>
                    <TableHead>Lần cuối</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map(device => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.type}</div>
                          <div className="text-xs text-gray-400">v{device.firmwareVersion}</div>
                        </div>
                      </TableCell>
                      <TableCell>{device.farmName}</TableCell>
                      <TableCell>{device.zone}</TableCell>
                      <TableCell>{getStatusBadge(device.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {device.temperature !== undefined && (
                            <div className="text-xs">🌡️ {device.temperature}°C</div>
                          )}
                          {device.humidity !== undefined && (
                            <div className="text-xs">💧 {device.humidity}%</div>
                          )}
                          {device.soilMoisture !== undefined && (
                            <div className="text-xs">🌱 {device.soilMoisture}%</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.batteryLevel !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Battery
                              className={`h-4 w-4 ${device.batteryLevel > 50
                                  ? 'text-green-500'
                                  : device.batteryLevel > 20
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                                }`}
                            />
                            <span className="text-sm">{Math.round(device.batteryLevel)}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatLastSeen(device.lastSeen)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminDevicesPage
