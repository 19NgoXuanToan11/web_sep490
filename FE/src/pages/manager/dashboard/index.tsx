import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Droplets,
  Package,
  AlertTriangle,
  CheckCircle,
  Sprout,
  Thermometer,
  Zap,
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
import { weatherService, type WeatherResponse } from '@/shared/api/weatherService'
import { Cloud, Wind, CloudRain } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: 'green' | 'green-light' | 'green-medium' | 'green-dark'
}

const MetricCard = React.memo<MetricCardProps>(
  ({ title, value, change, changeType = 'increase', icon: Icon, description, color = 'green' }) => {
    const colorClasses = {
      green: 'from-green-500 to-green-600',
      'green-light': 'from-green-400 to-green-500',
      'green-medium': 'from-green-600 to-green-700',
      'green-dark': 'from-green-700 to-green-800',
    }

    const changeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight
    const ChangeIcon = changeIcon

    return (
      <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
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
                  changeType === 'increase' ? 'text-green-600' : 'text-green-800'
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
)

interface ActivityItemProps {
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'info' | 'error'
  icon: React.ComponentType<{ className?: string }>
}

const ActivityItem = React.memo<ActivityItemProps>(
  ({ title, description, time, type, icon: Icon }) => {
    const typeClasses = {
      success: 'text-green-600 bg-green-50',
      warning: 'text-green-700 bg-green-100',
      info: 'text-green-500 bg-green-50',
      error: 'text-green-800 bg-green-200',
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
)

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const [iotDeviceStats, setIotDeviceStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    error: 0,
  })
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)

  const fetchIoTDeviceStats = useCallback(async () => {
    try {
      const stats = await iotDeviceService.getDeviceStatistics()
      setIotDeviceStats(stats)
    } catch (error) {
      console.error('Failed to fetch IoT device statistics:', error)
    }
  }, [])

  const fetchWeather = useCallback(async () => {
    setIsLoadingWeather(true)
    try {
      const weatherData = await weatherService.getWeather('Ho Chi Minh')
      setWeather(weatherData)
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
    } finally {
      setIsLoadingWeather(false)
    }
  }, [])

  useEffect(() => {
    fetchIoTDeviceStats()
    fetchWeather()
  }, [fetchIoTDeviceStats, fetchWeather])

  const recentActivities = useMemo(
    () => [
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
    ],
    []
  )

  const quickActions = useMemo(
    () => [
      {
        title: 'Bắt đầu tưới',
        description: 'Kích hoạt chu kỳ tưới nước',
        icon: Droplets,
        color: 'green-light' as const,
        action: () => navigate('/manager/irrigation'),
      },
      {
        title: 'Quản lý IoT',
        description: 'Thiết bị & cảm biến',
        icon: Cpu,
        color: 'green-dark' as const,
        action: () => navigate('/manager/iot-devices'),
      },
    ],
    [navigate]
  )

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển quản lý nông trại</h1>
          <p className="mt-2 text-gray-600">Chào mừng trở lại! Đây là tình hình hôm nay.</p>
        </div>

        {}
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
            color="green-light"
            description="Tưới tự động đang diễn ra"
          />
          <MetricCard
            title="Mặt hàng tồn kho"
            value="1,247"
            change="5 sắp hết"
            changeType="decrease"
            icon={Package}
            color="green-medium"
            description="Tổng số sản phẩm trong kho"
          />
          <MetricCard
            title="Thiết bị IoT"
            value={`${iotDeviceStats.active}/${iotDeviceStats.total}`}
            change={iotDeviceStats.error > 0 ? `${iotDeviceStats.error} có lỗi` : 'Hoạt động tốt'}
            changeType={iotDeviceStats.error > 0 ? 'decrease' : 'increase'}
            icon={Cpu}
            color={iotDeviceStats.error > 0 ? 'green-dark' : 'green'}
            description="Trạng thái thiết bị IoT"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {}
          <div className="lg:col-span-2 space-y-8">
            {}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Tổng quan hiệu suất
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
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
                    <Badge variant="default" className="bg-green-100 text-green-800 border-0">
                      Sinh trưởng tối ưu
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <Thermometer className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Điều kiện khí hậu</h3>
                    <p className="text-sm text-gray-600 mb-2">24°C / 65% RH</p>
                    <Badge variant="default" className="bg-green-50 text-green-700 border-0">
                      Trong ngưỡng lý tưởng
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tiêu thụ năng lượng</h3>
                    <p className="text-sm text-gray-600 mb-2">127 kWh hôm nay</p>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-0">
                      Hiệu quả
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Thao tác nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {quickActions.map(action => (
                    <motion.button
                      key={action.title}
                      onClick={action.action}
                      className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md hover:bg-green-50/30 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${
                            action.color === 'green-light'
                              ? 'from-green-400 to-green-500'
                              : 'from-green-700 to-green-800'
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

          {}
          <div className="space-y-6">
            {}
            <Card className="border-0 shadow-lg overflow-hidden bg-white">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-green-600" />
                    Thời tiết
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchWeather}
                    disabled={isLoadingWeather}
                    className="hover:bg-green-100"
                  >
                    {isLoadingWeather ? '...' : '🔄'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingWeather ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                  </div>
                ) : weather ? (
                  <div className="space-y-4">
                    {}
                    <div className="text-center pb-4 border-b border-gray-100">
                      <div className="flex justify-center items-center gap-3 mb-2">
                        {weather.iconUrl && (
                          <img
                            src={weather.iconUrl}
                            alt={weather.description}
                            className="w-16 h-16"
                          />
                        )}
                        <div>
                          <div className="text-4xl font-bold text-gray-900">
                            {Math.round(weather.temperatureC)}°C
                          </div>
                          <p className="text-sm text-gray-600 capitalize">{weather.description}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{weather.cityName}</p>
                    </div>

                    {}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Thermometer className="h-4 w-4" />
                          <span className="text-xs font-medium">Cảm nhận</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {Math.round(weather.feelsLikeC)}°C
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Droplets className="h-4 w-4" />
                          <span className="text-xs font-medium">Độ ẩm</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{weather.humidity}%</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Wind className="h-4 w-4" />
                          <span className="text-xs font-medium">Gió</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {weather.windSpeedMps.toFixed(1)} m/s
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Activity className="h-4 w-4" />
                          <span className="text-xs font-medium">Áp suất</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {weather.pressureHpa} hPa
                        </p>
                      </div>
                    </div>

                    {}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Nhiệt độ cao/thấp</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(weather.tempMaxC)}° / {Math.round(weather.tempMinC)}°
                        </span>
                      </div>
                      {weather.rainVolumeMm && weather.rainVolumeMm > 0 && (
                        <div className="flex justify-between items-center text-sm mt-2">
                          <div className="flex items-center gap-1 text-green-600">
                            <CloudRain className="h-4 w-4" />
                            <span>Lượng mưa</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {weather.rainVolumeMm.toFixed(1)} mm
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Không thể tải dữ liệu thời tiết</p>
                    <Button variant="outline" size="sm" onClick={fetchWeather} className="mt-3">
                      Thử lại
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Hoạt động gần đây
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                    Trực tiếp
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {recentActivities.map((activity, index) => (
                    <ActivityItem key={`activity-${activity.title}-${index}`} {...activity} />
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Xem tất cả hoạt động
                  </Button>
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Thiết bị IoT
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/manager/iot-devices')}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Xem tất cả
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-0">
                      {iotDeviceStats.active}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Bảo trì</span>
                    </div>
                    <Badge variant="default" className="bg-green-50 text-green-700 border-0">
                      {iotDeviceStats.maintenance}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-green-700" />
                      <span className="text-sm font-medium text-gray-700">Có lỗi</span>
                    </div>
                    <Badge
                      variant="default"
                      className={
                        iotDeviceStats.error > 0
                          ? 'bg-green-700 text-white border-0'
                          : 'bg-gray-100 text-gray-800 border-0'
                      }
                    >
                      {iotDeviceStats.error}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Tổng thiết bị</span>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-0">
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
                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
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
                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
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
