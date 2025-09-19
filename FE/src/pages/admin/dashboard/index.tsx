import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Building2,
  Cpu,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Activity,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { AdminLayout } from '@/shared/layouts/AdminLayout'

// Simple Progress component implementation
const Progress: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalFarms: number
  activeFarms: number
  totalDevices: number
  onlineDevices: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  lowStockItems: number
  systemHealth: number
  alerts: Alert[]
}

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  timestamp: string
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 156,
    activeUsers: 89,
    totalFarms: 23,
    activeFarms: 18,
    totalDevices: 142,
    onlineDevices: 128,
    totalOrders: 1247,
    pendingOrders: 23,
    totalProducts: 89,
    lowStockItems: 12,
    systemHealth: 94,
    alerts: [
      {
        id: '1',
        type: 'warning',
        title: 'High Temperature Alert',
        description: 'Zone A greenhouse temperature exceeds threshold',
        timestamp: '2 minutes ago',
      },
      {
        id: '2',
        type: 'error',
        title: 'Device Offline',
        description: 'Irrigation system B2 is not responding',
        timestamp: '15 minutes ago',
      },
      {
        id: '3',
        type: 'info',
        title: 'Low Stock Alert',
        description: '12 products below minimum stock level',
        timestamp: '1 hour ago',
      },
    ],
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Initialize dashboard data
    const interval = setInterval(() => {
      // Simulate real-time data updates
      setMetrics(prev => ({
        ...prev,
        onlineDevices: prev.totalDevices - Math.floor(Math.random() * 5),
        systemHealth: 90 + Math.floor(Math.random() * 10),
      }))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600'
    if (health >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBgColor = (health: number) => {
    if (health >= 90) return 'bg-green-500'
    if (health >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bảng điều khiển Admin</h1>
            <p className="text-gray-600">Tổng quan hệ thống và giám sát toàn bộ hoạt động</p>
          </div>

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

        {/* System Health Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tình trạng hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-3xl font-bold ${getHealthColor(metrics.systemHealth)}`}>
                    {metrics.systemHealth}%
                  </div>
                  <p className="text-sm text-gray-500">Hoạt động bình thường</p>
                </div>
                <div className="w-48">
                  <Progress
                    value={metrics.systemHealth}
                    className={`h-3 ${getHealthBgColor(metrics.systemHealth)}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{metrics.activeUsers} hoạt động</span>
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
                <CardTitle className="text-sm font-medium">Trang trại</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalFarms}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{metrics.activeFarms} hoạt động</span>
                </p>
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
                <CardTitle className="text-sm font-medium">Thiết bị IoT</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalDevices}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{metrics.onlineDevices} trực tuyến</span>
                </p>
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
                <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-yellow-600">{metrics.pendingOrders} đang xử lý</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alerts Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Cảnh báo hệ thống
                </CardTitle>
                <CardDescription>Các cảnh báo và thông báo quan trọng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge
                            variant={
                              alert.type === 'error'
                                ? 'destructive'
                                : alert.type === 'warning'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {alert.type === 'error'
                              ? 'Lỗi'
                              : alert.type === 'warning'
                                ? 'Cảnh báo'
                                : 'Thông tin'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <p className="text-xs text-gray-400">{alert.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Thao tác nhanh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Quản lý người dùng
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="h-4 w-4 mr-2" />
                    Giám sát trang trại
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Cpu className="h-4 w-4 mr-2" />
                    Thiết bị IoT
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Quản lý đơn hàng
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Kho & Sản phẩm
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Báo cáo & Phân tích
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Trạng thái chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sản phẩm tồn kho thấp</span>
                    <Badge variant="secondary">{metrics.lowStockItems}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Thiết bị offline</span>
                    <Badge variant="destructive">
                      {metrics.totalDevices - metrics.onlineDevices}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Đơn hàng chờ xử lý</span>
                    <Badge variant="secondary">{metrics.pendingOrders}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
