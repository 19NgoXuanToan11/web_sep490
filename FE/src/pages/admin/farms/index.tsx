import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  MapPin,
  Users,
  Cpu,
  Activity,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sprout,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { useToast } from '@/shared/ui/use-toast'

interface Farm {
  id: string
  name: string
  owner: string
  location: string
  area: number // in hectares
  status: 'active' | 'inactive' | 'maintenance'
  createdDate: string
  lastActivity: string
  deviceCount: number
  activeDevices: number
  cropTypes: string[]
  productionCapacity: number
  currentProduction: number
  staffCount: number
  revenue: number
  alertsCount: number
}

const AdminFarmsPage: React.FC = () => {
  const { toast } = useToast()
  const [farms, setFarms] = useState<Farm[]>([
    {
      id: 'farm-001',
      name: 'Green Valley Farm',
      owner: 'Nguyễn Văn An',
      location: 'Đồng Nai',
      area: 25.5,
      status: 'active',
      createdDate: '2023-03-15',
      lastActivity: '2024-01-15T10:30:00Z',
      deviceCount: 24,
      activeDevices: 22,
      cropTypes: ['Rau xanh', 'Cà chua', 'Dưa chuột'],
      productionCapacity: 1000, // kg/month
      currentProduction: 850,
      staffCount: 8,
      revenue: 125000000, // VND
      alertsCount: 2,
    },
    {
      id: 'farm-002',
      name: 'Smart Eco Farm',
      owner: 'Trần Thị Bình',
      location: 'Long An',
      area: 18.2,
      status: 'active',
      createdDate: '2023-06-20',
      lastActivity: '2024-01-15T09:45:00Z',
      deviceCount: 18,
      activeDevices: 18,
      cropTypes: ['Rau hữu cơ', 'Thảo mộc'],
      productionCapacity: 600,
      currentProduction: 580,
      staffCount: 5,
      revenue: 89000000,
      alertsCount: 0,
    },
    {
      id: 'farm-003',
      name: 'Tech Agriculture Co.',
      owner: 'Lê Minh Cường',
      location: 'Bình Dương',
      area: 42.8,
      status: 'maintenance',
      createdDate: '2022-11-10',
      lastActivity: '2024-01-14T15:20:00Z',
      deviceCount: 35,
      activeDevices: 28,
      cropTypes: ['Lúa', 'Ngô', 'Đậu tương'],
      productionCapacity: 2500,
      currentProduction: 2100,
      staffCount: 15,
      revenue: 245000000,
      alertsCount: 8,
    },
    {
      id: 'farm-004',
      name: 'Organic Plus Farm',
      owner: 'Phạm Văn Đức',
      location: 'Tây Ninh',
      area: 31.7,
      status: 'active',
      createdDate: '2023-01-05',
      lastActivity: '2024-01-15T11:15:00Z',
      deviceCount: 28,
      activeDevices: 26,
      cropTypes: ['Cà phê', 'Tiêu', 'Bưởi'],
      productionCapacity: 1800,
      currentProduction: 1650,
      staffCount: 12,
      revenue: 198000000,
      alertsCount: 1,
    },
    {
      id: 'farm-005',
      name: 'Future Farm Lab',
      owner: 'Võ Thị Hương',
      location: 'Đắk Lắk',
      area: 15.9,
      status: 'inactive',
      createdDate: '2023-09-30',
      lastActivity: '2024-01-10T08:30:00Z',
      deviceCount: 12,
      activeDevices: 8,
      cropTypes: ['Dâu tây', 'Nho'],
      productionCapacity: 400,
      currentProduction: 0,
      staffCount: 3,
      revenue: 35000000,
      alertsCount: 5,
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    // Auto-refresh data every 60 seconds
    const interval = setInterval(() => {
      setFarms(prev =>
        prev.map(farm => ({
          ...farm,
          lastActivity: new Date().toISOString(),
          activeDevices: Math.max(0, farm.deviceCount - Math.floor(Math.random() * 3)),
        }))
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const filteredFarms = farms.filter(farm => {
    const matchesSearch =
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || farm.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const farmStats = {
    total: farms.length,
    active: farms.filter(f => f.status === 'active').length,
    inactive: farms.filter(f => f.status === 'inactive').length,
    maintenance: farms.filter(f => f.status === 'maintenance').length,
    totalArea: farms.reduce((sum, f) => sum + f.area, 0),
    totalRevenue: farms.reduce((sum, f) => sum + f.revenue, 0),
    totalAlerts: farms.reduce((sum, f) => sum + f.alertsCount, 0),
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast({
      title: 'Dữ liệu đã được cập nhật',
      description: 'Thông tin tất cả trang trại đã được làm mới.',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Building2 className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      maintenance: 'secondary',
    }

    const labels: Record<string, string> = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      maintenance: 'Bảo trì',
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    )
  }

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`
    return `${Math.floor(diffMins / 1440)} ngày trước`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý trang trại</h1>
            <p className="text-gray-600">Giám sát và quản lý tất cả trang trại trong hệ thống</p>
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số trang trại</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farmStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{farmStats.active} hoạt động</span>
                </p>
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
                <CardTitle className="text-sm font-medium">Tổng diện tích</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farmStats.totalArea.toFixed(1)} ha</div>
                <p className="text-xs text-muted-foreground">Đất nông nghiệp</p>
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
                <CardTitle className="text-sm font-medium">Doanh thu tổng</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatCurrency(farmStats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Tháng này</p>
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
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{farmStats.totalAlerts}</div>
                <p className="text-xs text-muted-foreground">Cần xử lý</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Danh sách trang trại
            </CardTitle>
            <CardDescription>Tất cả trang trại trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
                <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm theo tên, chủ sở hữu, hoặc địa điểm..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Trạng thái: {statusFilter === 'all' ? 'Tất cả' : statusFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        Tất cả
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                        Hoạt động
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                        Tạm dừng
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('maintenance')}>
                        Bảo trì
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Farms Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trang trại</TableHead>
                        <TableHead>Chủ sở hữu</TableHead>
                        <TableHead>Địa điểm</TableHead>
                        <TableHead>Diện tích</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thiết bị</TableHead>
                        <TableHead>Loại cây trồng</TableHead>
                        <TableHead>Hoạt động cuối</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFarms.map(farm => (
                        <TableRow key={farm.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{farm.name}</div>
                              <div className="text-sm text-gray-500">
                                {farm.staffCount} nhân viên
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{farm.owner}</TableCell>
                          <TableCell>{farm.location}</TableCell>
                          <TableCell>{farm.area} ha</TableCell>
                          <TableCell>{getStatusBadge(farm.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-gray-500" />
                              <span>
                                {farm.activeDevices}/{farm.deviceCount}
                              </span>
                              {farm.alertsCount > 0 && (
                                <Badge variant="destructive" className="ml-1">
                                  {farm.alertsCount}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {farm.cropTypes.slice(0, 2).map(crop => (
                                <Badge key={crop} variant="secondary" className="text-xs">
                                  {crop}
                                </Badge>
                              ))}
                              {farm.cropTypes.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{farm.cropTypes.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatLastActivity(farm.lastActivity)}</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Activity className="h-4 w-4 mr-2" />
                                  Báo cáo hiệu suất
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFarms
                    .filter(f => f.status === 'active')
                    .map(farm => (
                      <Card key={farm.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{farm.name}</CardTitle>
                          <CardDescription>{farm.location}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Sản xuất hiện tại</span>
                              <span className="font-medium">
                                {farm.currentProduction}/{farm.productionCapacity} kg
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${(farm.currentProduction / farm.productionCapacity) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span>Doanh thu tháng</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(farm.revenue)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="space-y-4">
                  {filteredFarms
                    .filter(f => f.alertsCount > 0)
                    .map(farm => (
                      <Card key={farm.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              {farm.name}
                            </span>
                            <Badge variant="destructive">{farm.alertsCount} cảnh báo</Badge>
                          </CardTitle>
                          <CardDescription>
                            Địa điểm: {farm.location} • Chủ sở hữu: {farm.owner}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Cpu className="h-4 w-4 text-gray-500" />
                              <span>
                                {farm.deviceCount - farm.activeDevices} thiết bị offline
                              </span>
                            </div>
                            {farm.status === 'maintenance' && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <span>Đang trong chế độ bảo trì</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Activity className="h-4 w-4 text-red-500" />
                              <span>Yêu cầu kiểm tra hệ thống tưới</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminFarmsPage
