import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Sprout,
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Cloud,
  CloudRain,
  ShoppingCart,
  DollarSign,
  Star,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { iotDeviceService } from '@/shared/api/iotDeviceService'
import { weatherService, type WeatherResponse } from '@/shared/api/weatherService'
import { cropService, type Crop } from '@/shared/api/cropService'
import { cropRequirementService, type CropRequirementView } from '@/shared/api/cropRequirementService'
import { blynkService, type SensorData } from '@/shared/api/blynkService'
import { orderService, getOrderStatusLabel, getOrderStatusVariant, type Order } from '@/shared/api/orderService'
import { feedbackService, type Feedback } from '@/shared/api/feedbackService'
import { productService } from '@/shared/api/productService'
import { calculateRevenue, normalizeDateStartOfDay, parseOrderDate } from '@/shared/lib/revenue'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  CropGrowthStagesWidget,
  EnvironmentalMetricsWidget,
  CropPlanningStatusWidget,
} from '@/shared/components/manager'

const WEATHER_DESCRIPTION_MAP: Record<string, string> = {
  'clear sky': 'Trời quang mây',
  'few clouds': 'Ít mây',
  'scattered clouds': 'Mây rải rác',
  'broken clouds': 'Mây đứt đoạn',
  'overcast clouds': 'Nhiều mây',
  'light rain': 'Mưa nhẹ',
  'moderate rain': 'Mưa vừa',
  'heavy intensity rain': 'Mưa lớn',
  'very heavy rain': 'Mưa rất to',
  'extreme rain': 'Mưa dữ dội',
  'freezing rain': 'Mưa băng giá',
  'light intensity shower rain': 'Mưa rào nhẹ',
  'shower rain': 'Mưa rào',
  'heavy intensity shower rain': 'Mưa rào nặng hạt',
  'ragged shower rain': 'Mưa rào gián đoạn',
  drizzle: 'Mưa phùn',
  thunderstorm: 'Dông',
  snow: 'Tuyết',
  mist: 'Sương mù',
  smoke: 'Khói',
  haze: 'Mù sương',
  dust: 'Bụi',
  fog: 'Sương mù',
  sand: 'Cát bay',
  ash: 'Tro bụi',
  squalls: 'Gió giật',
  tornado: 'Lốc xoáy',
}

const WEATHER_DESCRIPTION_KEYWORDS: Array<[RegExp, string]> = [
  [/thunderstorm/, 'Dông bão'],
  [/drizzle/, 'Mưa phùn'],
  [/light rain/, 'Mưa nhẹ'],
  [/moderate rain/, 'Mưa vừa'],
  [/heavy rain/, 'Mưa lớn'],
  [/rain/, 'Mưa'],
  [/snow/, 'Tuyết'],
  [/mist|fog|haze/, 'Sương mù'],
  [/cloud/, 'Nhiều mây'],
  [/clear/, 'Trời quang'],
]

const translateWeatherDescription = (description?: string) => {
  if (!description) return ''
  const normalized = description.trim().toLowerCase()

  if (WEATHER_DESCRIPTION_MAP[normalized]) {
    return WEATHER_DESCRIPTION_MAP[normalized]
  }

  for (const [pattern, value] of WEATHER_DESCRIPTION_KEYWORDS) {
    if (pattern.test(normalized)) {
      return value
    }
  }

  return description
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: 'green' | 'green-light' | 'green-medium' | 'green-dark' | 'purple' | 'blue' | 'orange'
  onClick?: () => void
}

const MetricCard = React.memo<MetricCardProps>(
  ({ title, value, change, changeType = 'increase', icon: Icon, description, color = 'green', onClick }) => {
    const colorClasses = {
      green: 'from-green-500 to-green-600',
      'green-light': 'from-green-400 to-green-500',
      'green-medium': 'from-green-600 to-green-700',
      'green-dark': 'from-green-700 to-green-800',
      purple: 'from-purple-500 to-purple-600',
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
    }

    const ChangeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={onClick ? 'cursor-pointer' : ''}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg bg-white h-full">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[color]}`} />
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
                className={`flex items-center text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'
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
  const [crops, setCrops] = useState<Crop[]>([])
  const [cropRequirements, setCropRequirements] = useState<CropRequirementView[]>([])
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

  const fetchIoTDeviceStats = useCallback(async () => {
    try {
      const stats = await iotDeviceService.getDeviceStatistics()
      setIotDeviceStats(stats)
    } catch (error) {
      // handle silently on dashboard
    }
  }, [])

  const fetchWeather = useCallback(async () => {
    setIsLoadingWeather(true)
    try {
      const weatherData = await weatherService.getWeather('Ho Chi Minh')
      setWeather({
        ...weatherData,
        description: translateWeatherDescription(weatherData.description),
      })
    } catch (error) {
      // keep previous weather state
    } finally {
      setIsLoadingWeather(false)
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingDashboard(true)
    setDashboardError(null)

    try {
      const [cropResult, cropRequirementResult, sensorResult, orderResult, feedbackResult, productResult] = await Promise.allSettled([
        cropService.getAllCropsActive(),
        cropRequirementService.getAll(),
        blynkService.getBlynkData(),
        orderService.getOrderList({ pageIndex: 1, pageSize: 1000 }),
        feedbackService.getFeedbackList({ pageIndex: 1, pageSize: 1000 }),
        productService.getProductsList({ page: 1, pageSize: 1000 }),
      ])

      const errors: string[] = []

      if (cropResult.status === 'fulfilled') {
        setCrops(cropResult.value ?? [])
      } else {
        errors.push('cây trồng')
      }

      if (cropRequirementResult.status === 'fulfilled') {
        const requirementData = cropRequirementResult.value?.data
        setCropRequirements(Array.isArray(requirementData) ? requirementData : [])
      } else {
        errors.push('yêu cầu cây trồng')
      }

      if (sensorResult.status === 'fulfilled') {
        setSensorData(sensorResult.value)
      } else {
        setSensorData(null)
        errors.push('cảm biến IoT')
      }

      if (orderResult.status === 'fulfilled') {
        const orderData = orderResult.value
        const orderItems = orderData?.items ?? []
        // Debug: Log order data structure
        if (orderItems.length > 0) {
          console.log('Sample order:', {
            orderId: orderItems[0].orderId,
            totalPrice: orderItems[0].totalPrice,
            createdAt: orderItems[0].createdAt,
            hasOrderDetails: !!orderItems[0].orderDetails,
            orderDetailsCount: orderItems[0].orderDetails?.length ?? 0,
          })
        }
        setOrders(orderItems)
        setTotalOrdersCount(orderData?.totalItemCount ?? 0)
      } else {
        errors.push('đơn hàng')
        console.error('Order fetch failed:', orderResult.reason)
      }

      if (feedbackResult.status === 'fulfilled') {
        setFeedbacks(feedbackResult.value?.items ?? [])
      } else {
        errors.push('đánh giá')
      }

      if (productResult.status === 'fulfilled') {
        setProducts(productResult.value?.products ?? [])
      } else {
        errors.push('sản phẩm')
      }

      if (errors.length > 0) {
        setDashboardError(`Không thể tải dữ liệu: ${errors.join(', ')}`)
      }
    } catch (error) {
      setDashboardError('Không thể tải dữ liệu bảng điều khiển')
    } finally {
      setIsLoadingDashboard(false)
    }
  }, [])

  useEffect(() => {
    fetchIoTDeviceStats()
    fetchWeather()
    fetchDashboardData()
  }, [fetchIoTDeviceStats, fetchWeather, fetchDashboardData])

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }, [])

  const cropStats = useMemo(() => {
    const active = crops.filter(crop => crop.status?.toLowerCase() === 'active').length
    // Note: harvestDate is not available on Crop type, so setting to 0
    // To track nearing harvest, we would need schedule data instead
    const nearingHarvest = 0

    return {
      total: crops.length,
      active,
      nearingHarvest,
    }
  }, [crops])

  const parseDate = useCallback(parseOrderDate, [])
  const normalizeDate = useCallback(normalizeDateStartOfDay, [])

  const businessStats = useMemo(() => {
    const now = new Date()
    const normalizedNow = normalizeDate(now)
    const weekAgo = new Date(normalizedNow.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(normalizedNow.getTime() - 30 * 24 * 60 * 60 * 1000)
    const cutoffDate = normalizeDate(timeRange === 'week' ? weekAgo : monthAgo)
    const periodEnd = new Date(normalizedNow.getTime() + 24 * 60 * 60 * 1000 - 1)

    const recentOrders = orders.filter(order => {
      const orderDate = parseDate(order.createdAt)
      if (!orderDate) return false
      const normalizedOrderDate = normalizeDate(orderDate)
      return normalizedOrderDate >= cutoffDate
    })

    const totalRevenue = calculateRevenue(orders, { startDate: cutoffDate, endDate: periodEnd })

    const validFeedbacks = feedbacks.filter(fb => fb.rating >= 1 && fb.rating <= 5)
    const avgRating =
      validFeedbacks.length > 0
        ? validFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / validFeedbacks.length
        : 0

    const activeProducts = products.filter(p => p.status === 'Active').length

    return {
      totalOrders: totalOrdersCount,
      recentOrders: recentOrders.length,
      totalRevenue,
      avgRating: avgRating.toFixed(1),
      totalFeedbacks: feedbacks.length,
      activeProducts,
      totalProducts: products.length,
    }
  }, [orders, feedbacks, products, timeRange, totalOrdersCount])

  const revenueData = useMemo(() => {
    const now = new Date()
    const normalizedNow = normalizeDate(now)
    const data: { name: string; revenue: number; orders: number }[] = []

    if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(normalizedNow.getTime() - i * 24 * 60 * 60 * 1000)
        const dayStart = normalizeDate(date)
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1)

        const dayOrders = orders.filter(order => {
          const orderDate = parseDate(order.createdAt)
          if (!orderDate) return false
          return orderDate >= dayStart && orderDate <= dayEnd
        })

        data.push({
          name: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
          revenue: calculateRevenue(dayOrders, { startDate: dayStart, endDate: dayEnd }),
          orders: dayOrders.length,
        })
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const weekStart = normalizeDate(new Date(normalizedNow.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000))
        const weekEnd = new Date(normalizedNow.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        const normalizedWeekEnd = normalizeDate(weekEnd)
        const weekEndFull = new Date(normalizedWeekEnd.getTime() + 24 * 60 * 60 * 1000 - 1)

        const weekOrders = orders.filter(order => {
          const orderDate = parseDate(order.createdAt)
          if (!orderDate) return false
          return orderDate >= weekStart && orderDate <= weekEndFull
        })

        data.push({
          name: `Tuần ${4 - i}`,
          revenue: calculateRevenue(weekOrders, { startDate: weekStart, endDate: weekEndFull }),
          orders: weekOrders.length,
        })
      }
    }

    return data
  }, [orders, timeRange, parseDate, normalizeDate])

  const orderStatusData = useMemo(() => {
    const statusMap: Record<number, { label: string; color: string }> = {
      1: { label: 'Đã xác nhận', color: '#4CAF50' },
      3: { label: 'Đang giao', color: '#9C27B0' },
      5: { label: 'Hoàn thành', color: '#4CAF50' },
    }

    const allowedStatuses = [1, 3, 5]

    const statusCounts = orders.reduce((acc, order) => {
      const status = order.status ?? 0
      if (allowedStatuses.includes(status)) {
        acc[status] = (acc[status] || 0) + 1
      }
      return acc
    }, {} as Record<number, number>)

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: statusMap[Number(status)]?.label || getOrderStatusLabel(Number(status)),
        value: count,
        color: statusMap[Number(status)]?.color || '#999',
      }))
      .sort((a, b) => b.value - a.value)
  }, [orders])

  const ratingData = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0]

    feedbacks.forEach(fb => {
      const rating = Math.floor(fb.rating ?? 0)
      if (rating >= 1 && rating <= 5) {
        distribution[rating - 1]++
      }
    })

    return distribution.map((count, index) => ({
      name: `${index + 1} sao`,
      count,
    }))
  }, [feedbacks])

  const recentOrdersSorted = useMemo(() => {
    return [...orders]
      .filter(order => order.createdAt)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [orders])

  const mapPaymentStatus = (status: number): 'pending' | 'paid' | 'failed' | 'refunded' => {
    switch (status) {
      case 1:
      case 5:
      case 6:
        return 'paid'
      case 0:
      case 3:
        return 'pending'
      case 2:
        return 'failed'
      case 4:
        return 'refunded'
      default:
        return 'pending'
    }
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 1:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 2:
        return <Package className="h-4 w-4 text-purple-500" />
      case 3:
        return <Truck className="h-4 w-4 text-orange-500" />
      case 4:
        return <XCircle className="h-4 w-4 text-red-500" />
      case 5:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 6:
        return <Truck className="h-4 w-4 text-blue-500" />
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: number) => {
    const variant = getOrderStatusVariant(status)
    const label = getOrderStatusLabel(status)

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    )
  }

  const getDisplayStatusBadge = (order: Order) => {
    const paymentStatus = mapPaymentStatus(order.status ?? 0)
    if (paymentStatus === 'failed' || paymentStatus === 'pending') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          {getStatusIcon(0)}
          Chưa thanh toán
        </Badge>
      )
    }
    return getStatusBadge(order.status ?? 0)
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const dashboardMetrics = useMemo(() => {
    const metrics: MetricCardProps[] = []

    // Farm Management Metrics
    metrics.push({
      title: 'Thiết bị IoT hoạt động',
      value: `${iotDeviceStats.active}/${iotDeviceStats.total}`,
      change:
        iotDeviceStats.error > 0
          ? `${iotDeviceStats.error} thiết bị lỗi`
          : `${iotDeviceStats.inactive} thiết bị chưa hoạt động`,
      changeType: iotDeviceStats.error > 0 ? 'decrease' : 'increase',
      icon: Cpu,
      color: iotDeviceStats.error > 0 ? 'green-dark' : 'green',
      description: 'Theo thống kê từ danh sách thiết bị',
    })

    metrics.push({
      title: 'Nhiệt độ môi trường',
      value: sensorData ? `${sensorData.temperature.toFixed(1)}°C` : '--',
      change: sensorData
        ? `Độ ẩm ${sensorData.humidity.toFixed(0)}%`
        : 'Chưa nhận dữ liệu cảm biến',
      changeType: sensorData ? 'increase' : 'decrease',
      icon: Thermometer,
      color: 'green-light',
      description: sensorData
        ? `Chất lượng dữ liệu: ${sensorData.dataQuality === 'good'
          ? 'Tốt'
          : sensorData.dataQuality === 'poor'
            ? 'Cần kiểm tra'
            : 'Không khả dụng'
        }`
        : 'Không có tín hiệu từ trạm IoT',
    })

    metrics.push({
      title: 'Cây trồng hoạt động',
      value: formatNumber(cropStats.active),
      change:
        cropStats.nearingHarvest > 0
          ? `${cropStats.nearingHarvest} lô sắp thu hoạch`
          : `${cropStats.total} lô đang theo dõi`,
      changeType: 'increase',
      icon: Sprout,
      color: 'green',
      description: 'Dựa trên danh sách cây trồng',
    })

    // Business Metrics
    metrics.push({
      title: 'Tổng đơn hàng',
      value: businessStats.totalOrders,
      change: `${businessStats.recentOrders} đơn mới`,
      icon: ShoppingCart,
      color: 'purple',
      description: `Trong ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`,
    })

    metrics.push({
      title: `Doanh thu (${timeRange === 'week' ? 'tuần' : 'tháng'})`,
      value: `${businessStats.totalRevenue.toLocaleString('vi-VN')} đ`,
      change: businessStats.recentOrders > 0 ? `Từ ${businessStats.recentOrders} đơn` : 'Chưa có đơn',
      changeType: businessStats.recentOrders > 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      color: 'green',
      description: `Tổng thu ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`,
    })

    metrics.push({
      title: 'Đánh giá trung bình',
      value: `${businessStats.avgRating} ⭐`,
      change: `${businessStats.totalFeedbacks} đánh giá`,
      icon: Star,
      color: 'orange',
      description: 'Mức độ hài lòng khách hàng',
    })

    metrics.push({
      title: 'Sản phẩm',
      value: `${businessStats.activeProducts}/${businessStats.totalProducts}`,
      change: 'Đang hoạt động',
      icon: Package,
      color: 'blue',
      description: 'Tổng số sản phẩm trong hệ thống',
    })

    return metrics
  }, [
    cropStats.active,
    cropStats.nearingHarvest,
    cropStats.total,
    formatNumber,
    iotDeviceStats.active,
    iotDeviceStats.error,
    iotDeviceStats.inactive,
    iotDeviceStats.total,
    sensorData,
    businessStats,
    timeRange,
  ])


  if (isLoadingDashboard && orders.length === 0 && feedbacks.length === 0) {
    return (
      <ManagerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ManagerLayout>
    )
  }

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                Bảng điều khiển quản lý nông trại
              </h1>
              <p className="mt-2 text-gray-600">
                Tổng hợp các chỉ số cốt lõi từ cây trồng, lịch tác nghiệp, thiết bị IoT và kinh doanh.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={fetchDashboardData}
                disabled={isLoadingDashboard}
              >
                {isLoadingDashboard ? 'Đang tải...' : 'Làm mới'}
              </Button>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as 'week' | 'month')}>
                <TabsList>
                  <TabsTrigger value="week">7 ngày</TabsTrigger>
                  <TabsTrigger value="month">30 ngày</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          {dashboardError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {dashboardError}
            </div>
          )}
        </div>

        {isLoadingDashboard && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-ping" />
            <span>Đang đồng bộ dữ liệu thời gian thực...</span>
          </div>
        )}

        {/* Section 1: Key Performance Indicators - Farm Operations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-green-600" />
            Hoạt động nông trại
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dashboardMetrics.slice(0, 4).map(metric => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </div>

        {/* Section 2: Crop Monitoring - Comprehensive Analysis */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sprout className="h-6 w-6 text-green-600" />
              Theo dõi cây trồng
            </h2>
            <p className="text-gray-600 mt-1">
              Phân tích chi tiết về giai đoạn tăng trưởng, chỉ số môi trường và tình trạng kế hoạch
            </p>
          </div>

          {/* First Row: Growth Stages and Planning Status */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-6">
            <CropGrowthStagesWidget requirements={cropRequirements} />
            <CropPlanningStatusWidget requirements={cropRequirements} />
          </div>

          {/* Second Row: Environmental Metrics - Full Width */}
          <div className="mb-6">
            <EnvironmentalMetricsWidget
              requirements={cropRequirements}
              sensorData={sensorData ? {
                temperature: sensorData.temperature,
                humidity: sensorData.humidity,
                light: sensorData.light,
              } : null}
            />
          </div>
        </div>

        {/* Section 3: Business Analytics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Phân tích kinh doanh
          </h2>

          {/* Business Metrics Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {dashboardMetrics.slice(4).map(metric => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          {/* Revenue and Order Analytics */}
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Doanh thu {timeRange === 'week' ? 'theo ngày' : 'theo tuần'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? `${value.toLocaleString('vi-VN')} đ` : value,
                        name === 'revenue' ? 'Doanh thu' : 'Đơn hàng',
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10B981" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Trạng thái đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name: string, props: any) => {
                          const total = orderStatusData.reduce((sum, item) => sum + item.value, 0)
                          const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                          return [`${value} đơn (${percent}%)`, props.payload.name]
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Chưa có dữ liệu đơn hàng</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 4: Customer Insights & Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-green-600" />
            Thông tin khách hàng & Hoạt động gần đây
          </h2>

          <div className="grid gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-8">

              <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-orange-500" />
                      Phân bố đánh giá
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ratingData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 5]} />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F59E0B" name="Số lượng" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        Đơn hàng gần đây
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/manager/orders')}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        Xem tất cả
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {recentOrdersSorted.length > 0 ? (
                        recentOrdersSorted.map((order) => (
                          <div
                            key={order.orderId}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate('/manager/orders')}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Đơn hàng #{String(order.orderId ?? '').slice(0, 8)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {order.createdAt
                                  ? formatDateOnly(order.createdAt)
                                  : 'Không xác định'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900">
                                {(order.totalPrice ?? 0).toLocaleString('vi-VN')} đ
                              </span>
                              {getDisplayStatusBadge(order)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>Chưa có đơn hàng nào</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
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

                      {weather.rainVolumeMm && weather.rainVolumeMm > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-1 text-green-600">
                              <CloudRain className="h-4 w-4" />
                              <span>Lượng mưa</span>
                            </div>
                            <span className="font-semibold text-green-600">
                              {weather.rainVolumeMm.toFixed(1)} mm
                            </span>
                          </div>
                        </div>
                      )}
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

              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-orange-500" />
                      Đánh giá gần đây
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {feedbacks.slice(0, 5).map((feedback) => (
                      <div
                        key={feedback.feedbackId}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {feedback.fullName}
                              </span>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < feedback.rating
                                      ? 'text-orange-500 fill-orange-500'
                                      : 'text-gray-300'
                                      }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {feedback.comment || 'Không có bình luận'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Sản phẩm: {feedback.orderDetail?.productName || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {feedback.createdAt
                              ? new Date(feedback.createdAt).toLocaleDateString('vi-VN')
                              : 'Không xác định'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {feedbacks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Star className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Chưa có đánh giá nào</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  )
}
