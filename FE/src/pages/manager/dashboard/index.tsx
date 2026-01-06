import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { iotDeviceService } from '@/shared/api/iotDeviceService'
import { weatherService } from '@/shared/api/weatherService'
import { cropService, type Crop } from '@/shared/api/cropService'
import { cropRequirementService } from '@/shared/api/cropRequirementService'
import { blynkService, type SensorData } from '@/shared/api/blynkService'
import {
  orderService,
  getOrderStatusLabel,
  getOrderStatusVariant,
  normalizeOrderStatus,
  derivePaymentStatus,
  type Order,
} from '@/shared/api/orderService'
import { feedbackService, type Feedback } from '@/shared/api/feedbackService'
import { productService } from '@/shared/api/productService'
import { calculateRevenue, normalizeDateStartOfDay, parseOrderDate } from '@/shared/lib/revenue'
import { formatDate } from '@/shared/lib/date-utils'
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


interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  description?: string
  color?: 'green' | 'green-light' | 'green-medium' | 'green-dark' | 'purple' | 'blue' | 'orange'
  onClick?: () => void
}

const MetricCard = React.memo<MetricCardProps>(
  ({ title, value, change, changeType = 'increase', description, onClick }) => {
    const ChangeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={onClick ? 'cursor-pointer' : ''}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg bg-white h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
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
  const [hourlyPayload, setHourlyPayload] = useState<any | null>(null)
  const [selectedForecastIndex, setSelectedForecastIndex] = useState<number | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

  const fetchIoTDeviceStats = useCallback(async () => {
    try {
      const stats = await iotDeviceService.getDeviceStatistics()
      setIotDeviceStats(stats)
    } catch (error) {
    }
  }, [])


  const fetchHourlyForecast = useCallback(async () => {
    try {
      const payload = await weatherService.getHourly('Ho Chi Minh', 24)
      setHourlyPayload(payload ?? null)
    } catch (err) {
      console.error('Failed to fetch hourly forecast payload', err)
      setHourlyPayload(null)
    }
  }, [])
  const [isLoadingHourly] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingDashboard(true)
    setDashboardError(null)

    try {
      const [cropResult, cropRequirementResult, sensorResult, orderResult, feedbackResult, productResult] = await Promise.allSettled([
        cropService.getAllCropsList(),
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
        if (orderItems.length > 0) {

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
        const productData = productResult.value
        setProducts(productData?.products ?? [])
        setTotalProductsCount(productData?.totalCount ?? productData?.products?.length ?? 0)
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
    fetchHourlyForecast()
    fetchDashboardData()
  }, [fetchIoTDeviceStats, fetchHourlyForecast, fetchDashboardData])

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }, [])

  const cropStats = useMemo(() => {
    const active = crops.filter(crop => crop.status?.toLowerCase() === 'active').length
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
      totalProducts: totalProductsCount || products.length,
    }
  }, [orders, feedbacks, products, timeRange, totalOrdersCount, totalProductsCount])

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

  const getStatusBadge = (status: number, paymentStatus?: string) => {
    let label = getOrderStatusLabel(status)
    let variant = getOrderStatusVariant(status)

    if (paymentStatus === 'failed' && status === 2) {
      label = 'Thất bại'
      variant = 'destructive'
    }

    if (paymentStatus === 'pending' && ![2, 4, 5].includes(status)) {
      label = 'Chờ thanh toán'
      variant = 'secondary'
    }

    return <Badge variant={variant}>{label}</Badge>
  }

  const getDisplayStatusBadge = (order: Order) => {
    const normalizedStatus = normalizeOrderStatus(order.status)
    const paymentStatus = derivePaymentStatus({
      status: normalizedStatus,
      payments: order.payments,
    })
    return getStatusBadge(normalizedStatus, paymentStatus)
  }

  const formatDateOnly = (dateString: string) => {
    return formatDate(dateString)
  }

  const dashboardMetrics = useMemo(() => {
    const metrics: MetricCardProps[] = []

    metrics.push({
      title: 'Thiết bị IoT hoạt động',
      value: `${iotDeviceStats.active}/${iotDeviceStats.total}`,
      change:
        iotDeviceStats.error > 0
          ? `${iotDeviceStats.error} thiết bị lỗi`
          : `${iotDeviceStats.inactive} thiết bị chưa hoạt động`,
      changeType: iotDeviceStats.error > 0 ? 'decrease' : 'increase',
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
          : `${cropStats.total} lô tổng cộng`,
      changeType: 'increase',
      color: 'green',
      description: 'Dựa trên danh sách cây trồng',
    })

    metrics.push({
      title: `Doanh thu (${timeRange === 'week' ? 'tuần' : 'tháng'})`,
      value: `${businessStats.totalRevenue.toLocaleString('vi-VN')} đ`,
      change: businessStats.recentOrders > 0 ? `Từ ${businessStats.recentOrders} đơn` : 'Chưa có đơn',
      changeType: businessStats.recentOrders > 0 ? 'increase' : 'decrease',
      color: 'green',
      description: `Tổng thu ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`,
    })

    metrics.push({
      title: 'Đánh giá trung bình',
      value: `${businessStats.avgRating} ⭐`,
      change: `${businessStats.totalFeedbacks} đánh giá`,
      color: 'orange',
      description: 'Mức độ hài lòng khách hàng',
    })

    metrics.push({
      title: 'Sản phẩm',
      value: `${businessStats.activeProducts}/${businessStats.totalProducts}`,
      change: 'Đang hoạt động',
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

  const previewItem =
    selectedForecastIndex != null && hourlyPayload && Array.isArray(hourlyPayload.data)
      ? hourlyPayload.data[selectedForecastIndex]
      : null


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

        <div className="mb-8">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg overflow-hidden bg-white">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Thời tiết
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingHourly && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    </div>
                  )}
                  {!isLoadingHourly && hourlyPayload && Array.isArray(hourlyPayload.data) && (
                    <>
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-48">
                          <div className="text-4xl font-bold text-gray-900 leading-none">
                            {hourlyPayload.data[0] && typeof hourlyPayload.data[0].temperatureC === 'number'
                              ? `${Math.round(hourlyPayload.data[0].temperatureC)}°C`
                              : ''}
                          </div>
                          <div className="mt-2 text-sm text-gray-600">{String(hourlyPayload.city || '')}</div>
                          <div className="mt-1 text-xs text-gray-400">{String(hourlyPayload.current_time_vn || '')}</div>
                        </div>

                        <div className="flex-1">
                          <div className="w-full py-2">
                            <div className="flex flex-wrap gap-3 items-stretch justify-between">
                              {(() => {
                                const parseDateOnly = (ts: any) => {
                                  if (!ts) return ''
                                  if (typeof ts === 'string') {
                                    const m = ts.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
                                    if (m) return m[1]
                                    const m2 = ts.match(/(\d{1,2}:\d{2}),\s*(\d{1,2}\/\d{1,2}\/\d{4})/)
                                    if (m2) return m2[2]
                                    return ''
                                  }
                                  try {
                                    const d = new Date(ts)
                                    return d.toLocaleDateString('vi-VN')
                                  } catch {
                                    return String(ts)
                                  }
                                }

                                const firstItemDateOnly = hourlyPayload.data && hourlyPayload.data[0]
                                  ? parseDateOnly(hourlyPayload.data[0].timeStamp)
                                  : ''

                                return hourlyPayload.data.map((item: any, idx: number) => {
                                  const timeVN = (() => {
                                    const ts = item?.timeStamp
                                    if (!ts) return ''
                                    if (typeof ts === 'string') {
                                      const m = ts.match(/(\d{1,2}:\d{2})/)
                                      return m ? m[1] : ts
                                    }
                                    try {
                                      const d = new Date(ts)
                                      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
                                    } catch {
                                      return String(ts)
                                    }
                                  })()

                                  const itemDateOnly = parseDateOnly(item?.timeStamp)
                                  const prevDateOnly = idx > 0 ? parseDateOnly(hourlyPayload.data[idx - 1]?.timeStamp) : firstItemDateOnly
                                  const showDateLabel = idx > 0 && itemDateOnly && itemDateOnly !== prevDateOnly

                                  const isTomorrowRelativeToFirst = (() => {
                                    if (!firstItemDateOnly || !itemDateOnly) return false
                                    try {
                                      const [fd, fm, fy] = firstItemDateOnly.split('/').map(Number)
                                      const [id, im, iy] = itemDateOnly.split('/').map(Number)
                                      const firstDate = new Date(fy, fm - 1, fd)
                                      const itemDate = new Date(iy, im - 1, id)
                                      const diffDays = Math.round((itemDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000))
                                      return diffDays === 1
                                    } catch {
                                      return false
                                    }
                                  })()

                                  return (
                                    <React.Fragment key={idx}>
                                      {showDateLabel && (
                                        <div className="w-full text-sm text-gray-500 text-left px-2 py-1">
                                          {isTomorrowRelativeToFirst ? `Ngày mai — ${itemDateOnly}` : itemDateOnly}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => setSelectedForecastIndex(idx === selectedForecastIndex ? null : idx)}
                                        className="flex-1 min-w-[7rem] max-w-[9rem] p-2 bg-white border border-gray-100 rounded-lg text-center hover:shadow-md"
                                        title={String(item?.forecastFor ?? '')}
                                      >
                                        <div className="text-xs text-gray-500">{timeVN}</div>
                                        {item?.iconUrl ? (
                                          <img src={item.iconUrl} alt={String(item?.description ?? '')} className="mx-auto my-1 w-8 h-8" />
                                        ) : (
                                          <div className="mx-auto my-1 h-8 w-8 bg-gray-200 rounded-full" />
                                        )}
                                        <div className="text-sm font-medium text-gray-900">
                                          {typeof item?.temperatureC === 'number' ? `${Math.round(item.temperatureC)}°C` : String(item?.temperatureC ?? '')}
                                        </div>
                                      </button>
                                    </React.Fragment>
                                  )
                                })
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {previewItem && (
                        <div className="mt-4 w-full">
                          <div className="text-sm text-gray-500 mb-2">Chi tiết</div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="text-xs text-gray-700 space-y-2 text-left">
                              <div><strong>Thành phố:</strong> {String(previewItem.cityName ?? '')}</div>
                              <div><strong>Thời gian:</strong> {String(previewItem.timeStamp ?? '')}</div>
                              <div><strong>Dự báo cho:</strong> {String(previewItem.forecastFor ?? '')}</div>
                              <div>
                                <strong>Nhiệt độ:</strong>{' '}
                                {typeof previewItem.temperatureC === 'number'
                                  ? `${previewItem.temperatureC.toFixed(1)}°C`
                                  : String(previewItem.temperatureC ?? '')}
                              </div>
                              <div>
                                <strong>Độ ẩm:</strong>{' '}
                                {typeof previewItem.humidity === 'number'
                                  ? `${previewItem.humidity}%`
                                  : String(previewItem.humidity ?? '')}
                              </div>
                              <div>
                                <strong>Tốc độ gió:</strong>{' '}
                                {typeof previewItem.windSpeedMps === 'number'
                                  ? `${previewItem.windSpeedMps.toFixed(1)} m/s`
                                  : String(previewItem.windSpeedMps ?? '')}
                              </div>
                              <div><strong>Mô tả:</strong> {String(previewItem.description ?? '')}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Phân tích kinh doanh
          </h2>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {dashboardMetrics.map(metric => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
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

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Thông tin khách hàng & Hoạt động gần đây
          </h2>

          <div className="grid gap-8 xl:grid-cols-5">
            <div className="xl:col-span-5 space-y-8">
              <MetricCard
                title="Tổng đơn hàng"
                value={businessStats.totalOrders}
                change={`${businessStats.recentOrders} đơn mới`}
                description={`Trong ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`}
              />

              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
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
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {recentOrdersSorted.length > 0 ? (
                      recentOrdersSorted.map((order) => (
                        <div
                          key={order.orderId}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => navigate('/manager/orders')}
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Đơn hàng #{String(order.orderId ?? '').slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {order.createdAt
                                ? formatDateOnly(order.createdAt)
                                : 'Không xác định'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
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

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
            </div>
            <div className="xl:col-span-5 space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
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
                            {formatDate(feedback.createdAt)}
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
