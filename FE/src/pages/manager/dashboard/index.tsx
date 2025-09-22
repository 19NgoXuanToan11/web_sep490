import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Sprout,
  Thermometer,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Wifi,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useNavigate } from 'react-router-dom'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { iotDeviceService } from '@/shared/api/iotDeviceService'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'increase',
  icon: Icon,
  description,
  color = 'green',
}) => {
  const colorClasses = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  }

  const changeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight
  const ChangeIcon = changeIcon

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[color]}`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          {change && (
            <div
              className={`flex items-center text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <ChangeIcon className="h-3 w-3 mr-1" />
              {change}
            </div>
          )}
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'info' | 'error'
  icon: React.ComponentType<{ className?: string }>
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  description,
  time,
  type,
  icon: Icon,
}) => {
  const typeClasses = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-orange-600 bg-orange-50',
    info: 'text-blue-600 bg-blue-50',
    error: 'text-red-600 bg-red-50',
  }

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`p-1.5 rounded-full ${typeClasses[type]}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  )
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const [iotDeviceStats, setIotDeviceStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    error: 0,
  })

  useEffect(() => {
    fetchIoTDeviceStats()
  }, [])

  const fetchIoTDeviceStats = async () => {
    try {
      const stats = await iotDeviceService.getDeviceStatistics()
      setIotDeviceStats(stats)
    } catch (error) {
      console.error('Failed to fetch IoT device statistics:', error)
    }
  }

  const recentActivities = [
    {
      title: 'Hệ thống tưới đã kích hoạt',
      description: 'Khu A đã hoàn tất chu kỳ tưới nước',
      time: '2 phút trước',
      type: 'success' as const,
      icon: Droplets,
    },
    {
      title: 'Cảnh báo tồn kho thấp',
      description: 'Cà chua hữu cơ dưới ngưỡng (15 đơn vị)',
      time: '5 phút trước',
      type: 'warning' as const,
      icon: Package,
    },
    {
      title: 'Đơn hàng mới',
      description: 'Đơn #1245 - Rau củ tổng hợp (50 đơn vị)',
      time: '12 phút trước',
      type: 'info' as const,
      icon: CheckCircle,
    },
    {
      title: 'Bảo trì cảm biến',
      description: 'Cảm biến nhiệt độ B2 cần hiệu chuẩn',
      time: '1 giờ trước',
      type: 'warning' as const,
      icon: Thermometer,
    },
  ]

  const quickActions = [
    {
      title: 'Bắt đầu tưới',
      description: 'Kích hoạt chu kỳ tưới nước',
      icon: Droplets,
      color: 'blue' as const,
      action: () => navigate('/manager/irrigation'),
    },
    {
      title: 'Thêm tồn kho',
      description: 'Cập nhật số lượng tồn',
      icon: Package,
      color: 'green' as const,
      action: () => navigate('/manager/inventory'),
    },
    {
      title: 'Xem báo cáo',
      description: 'Phân tích & thống kê',
      icon: TrendingUp,
      color: 'purple' as const,
      action: () => navigate('/manager/reports'),
    },
    {
      title: 'Quản lý IoT',
      description: 'Thiết bị & cảm biến',
      icon: Cpu,
      color: 'orange' as const,
      action: () => navigate('/manager/iot-devices'),
    },
  ]

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển quản lý nông trại</h1>
          <p className="mt-2 text-gray-600">Chào mừng trở lại! Đây là tình hình hôm nay.</p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Trạng thái hệ thống"
            value="Hoạt động ổn định"
            change="+99.2% thời gian hoạt động"
            icon={Activity}
            color="green"
            description="Tất cả hệ thống hoạt động trơn tru"
          />
          <MetricCard
            title="Khu vực đang tưới"
            value="3 khu"
            change="2 lịch đã đặt"
            icon={Droplets}
            color="blue"
            description="Tưới tự động đang diễn ra"
          />
          <MetricCard
            title="Mặt hàng tồn kho"
            value="1,247"
            change="5 sắp hết"
            changeType="decrease"
            icon={Package}
            color="orange"
            description="Tổng số sản phẩm trong kho"
          />
          <MetricCard
            title="Thiết bị IoT"
            value={`${iotDeviceStats.active}/${iotDeviceStats.total}`}
            change={iotDeviceStats.error > 0 ? `${iotDeviceStats.error} có lỗi` : 'Hoạt động tốt'}
            changeType={iotDeviceStats.error > 0 ? 'decrease' : 'increase'}
            icon={Cpu}
            color={iotDeviceStats.error > 0 ? 'red' : 'green'}
            description="Trạng thái thiết bị IoT"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Metrics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Tổng quan hiệu suất
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <Sprout className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Sức khỏe cây trồng</h3>
                    <p className="text-sm text-gray-600 mb-2">95% Xuất sắc</p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Sinh trưởng tối ưu
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Thermometer className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Điều kiện khí hậu</h3>
                    <p className="text-sm text-gray-600 mb-2">24°C / 65% RH</p>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Trong ngưỡng lý tưởng
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tiêu thụ năng lượng</h3>
                    <p className="text-sm text-gray-600 mb-2">127 kWh hôm nay</p>
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      Hiệu quả
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Thao tác nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      onClick={action.action}
                      className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${
                            action.color === 'blue'
                              ? 'from-blue-500 to-blue-600'
                              : action.color === 'green'
                                ? 'from-green-500 to-green-600'
                                : action.color === 'purple'
                                  ? 'from-purple-500 to-purple-600'
                                  : 'from-orange-500 to-orange-600'
                          } shadow-lg`}
                        >
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Hoạt động gần đây
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Trực tiếp
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {recentActivities.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full">
                    Xem tất cả hoạt động
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* IoT Device Monitoring */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Thiết bị IoT
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/manager/iot-devices')}
                  >
                    Xem tất cả
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {iotDeviceStats.active}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Bảo trì</span>
                    </div>
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                      {iotDeviceStats.maintenance}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-700">Có lỗi</span>
                    </div>
                    <Badge 
                      variant="default" 
                      className={iotDeviceStats.error > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}
                    >
                      {iotDeviceStats.error}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Tổng thiết bị</span>
                    </div>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {iotDeviceStats.total}
                    </Badge>
                  </div>
                </div>
                
                {iotDeviceStats.total === 0 && (
                  <div className="text-center py-4 border-t border-gray-100 mt-4">
                    <Cpu className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Chưa có thiết bị IoT nào</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/manager/iot-devices')}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                      Thêm thiết bị
                    </Button>
                  </div>
                )}

                {iotDeviceStats.total > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/manager/iot-devices')}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                      Quản lý thiết bị
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ManagerLayout>
  )
}
