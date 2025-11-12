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
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Wifi,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  Clock,
  Gauge,
  Cloud,
  Wind,
  CloudRain,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useNavigate } from 'react-router-dom'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { iotDeviceService } from '@/shared/api/iotDeviceService'
import { weatherService, type WeatherResponse } from '@/shared/api/weatherService'
import { farmActivityService, type FarmActivity } from '@/shared/api/farmActivityService'
import { scheduleService, type ScheduleListItem } from '@/shared/api/scheduleService'
import { orderService, type Order, getOrderStatusLabel } from '@/shared/api/orderService'
import { productService, type Product as InventoryProduct } from '@/shared/api/productService'
import { cropService, type Crop } from '@/shared/api/cropService'
import { blynkService, type SensorData } from '@/shared/api/blynkService'

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

    const ChangeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight

    return (
      <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="relative overflow-hidden border-0 shadow-lg bg-white h-full">
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

interface ModuleSnapshot {
  title: string
  summary: string
  trend: string
  link: string
  icon: React.ComponentType<{ className?: string }>
  tag: string
  tagTone: 'positive' | 'neutral' | 'alert'
}

interface ActionCenterItem {
  title: string
  description: string
  status: 'critical' | 'warning' | 'info'
  module: string
  ctaLabel: string
  onClick: () => void
}

type TimelineStatus = 'upcoming' | 'ongoing' | 'completed' | 'overdue'

interface OverviewBadge {
  label: string
  variant: 'default' | 'outline'
  className?: string
}

interface GrowthOverviewItem {
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  title: string
  value: string
  description: string
  badges?: OverviewBadge[]
}

interface ScheduleItem {
  id: number | string
  title: string
  timeRange: string
  responsible: string
  progress: number
  status: TimelineStatus
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
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [schedules, setSchedules] = useState<ScheduleListItem[]>([])
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

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
      setWeather(weatherData)
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
      const [
        scheduleResult,
        activityResult,
        orderResult,
        productResult,
        cropResult,
        sensorResult,
      ] = await Promise.allSettled([
        scheduleService.getScheduleList(1, 20),
        farmActivityService.getAllFarmActivities(),
        orderService.getOrderList({ pageSize: 20 }),
        productService.getProductsList({ pageSize: 100 }),
        cropService.getAllCropsActive(),
        blynkService.getBlynkData(),
      ])

      const errors: string[] = []

      if (scheduleResult.status === 'fulfilled') {
        setSchedules(scheduleResult.value?.data?.items ?? [])
      } else {
        errors.push('lịch tác nghiệp')
      }

      if (activityResult.status === 'fulfilled') {
        setFarmActivities(activityResult.value ?? [])
      } else {
        errors.push('hoạt động nông trại')
      }

      if (orderResult.status === 'fulfilled') {
        setOrders(orderResult.value?.items ?? [])
      } else {
        errors.push('đơn hàng')
      }

      if (productResult.status === 'fulfilled') {
        setProducts(productResult.value?.products ?? [])
      } else {
        errors.push('sản phẩm')
      }

      if (cropResult.status === 'fulfilled') {
        setCrops(cropResult.value ?? [])
      } else {
        errors.push('cây trồng')
      }

      if (sensorResult.status === 'fulfilled') {
        setSensorData(sensorResult.value)
      } else {
        setSensorData(null)
        errors.push('cảm biến IoT')
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

  const formatDateTime = useCallback((value?: string | null) => {
    if (!value) return 'Không xác định'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return 'Không xác định'
    }
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }, [])

  const formatDateRange = useCallback(
    (start?: string | null, end?: string | null) => {
      const startText = formatDateTime(start)
      const endText = formatDateTime(end)

      if (startText === 'Không xác định' && endText === 'Không xác định') {
        return 'Không xác định'
      }

      return `${startText} - ${endText}`
    },
    [formatDateTime]
  )

  const toTimestamp = useCallback((value?: string | null) => {
    if (!value) return 0
    const date = new Date(value)
    const time = date.getTime()
    return Number.isNaN(time) ? 0 : time
  }, [])

  const computeScheduleProgress = useCallback((schedule: ScheduleListItem) => {
    if (!schedule.startDate || !schedule.endDate) return 0
    const start = new Date(schedule.startDate)
    const end = new Date(schedule.endDate)
    const now = new Date()

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.getTime() === end.getTime()
    ) {
      return 0
    }

    if (now <= start) return 0
    if (now >= end) return 100

    const progress = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100
    return Math.min(100, Math.max(0, Math.round(progress)))
  }, [])

  const getScheduleTimelineStatus = useCallback(
    (schedule: ScheduleListItem): TimelineStatus => {
      const progress = computeScheduleProgress(schedule)
      const now = new Date()
      const start = schedule.startDate ? new Date(schedule.startDate) : null
      const end = schedule.endDate ? new Date(schedule.endDate) : null

      if (start && Number.isNaN(start.getTime())) {
        return 'upcoming'
      }
      if (end && Number.isNaN(end.getTime())) {
        return 'upcoming'
      }

      if (end && now > end && progress >= 100) {
        return 'completed'
      }

      if (end && now > end && progress < 100) {
        return 'overdue'
      }

      if (start && now < start) {
        return 'upcoming'
      }

      return 'ongoing'
    },
    [computeScheduleProgress]
  )

  const formatCurrency = useCallback((value?: number | string) => {
    if (value === undefined || value === null) return '0 đ'
    const numberValue = typeof value === 'string' ? Number(value) : value
    if (Number.isNaN(numberValue)) return '0 đ'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(numberValue)
  }, [])

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value)
  }, [])

  const lowStockThreshold = 10

  const scheduleStats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    let upcomingToday = 0
    let inProgress = 0
    let overdue = 0

    schedules.forEach(schedule => {
      const start = schedule.startDate ? new Date(schedule.startDate) : null
      const end = schedule.endDate ? new Date(schedule.endDate) : null

      if (start && !Number.isNaN(start.getTime())) {
        if (start >= startOfToday && start <= endOfToday) {
          upcomingToday += 1
        }
      }

      if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (now >= start && now <= end) {
          inProgress += 1
        } else if (end < now) {
          overdue += 1
        }
      }
    })

    return {
      total: schedules.length,
      upcomingToday,
      inProgress,
      overdue,
    }
  }, [schedules])

  const inventoryStats = useMemo(() => {
    const totalQuantity = products.reduce((sum, product) => {
      const quantity =
        product.quantity !== undefined
          ? product.quantity
          : (product as unknown as { stockQuantity?: number }).stockQuantity ?? 0
      return sum + quantity
    }, 0)

    const lowStock = products.filter(product => {
      const quantity =
        product.quantity !== undefined
          ? product.quantity
          : (product as unknown as { stockQuantity?: number }).stockQuantity ?? 0
      return quantity <= lowStockThreshold
    }).length

    return {
      totalProducts: products.length,
      totalQuantity,
      lowStock,
    }
  }, [products, lowStockThreshold])

  const orderStats = useMemo(() => {
    const pendingStatuses = new Set([0, 1, 2, 3])
    const completedStatuses = new Set([5, 6])

    let pending = 0
    let completedToday = 0

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    orders.forEach(order => {
      const status = order.status ?? -1
      if (pendingStatuses.has(status)) {
        pending += 1
      }

      if (completedStatuses.has(status) && order.updatedAt) {
        const updatedAt = new Date(order.updatedAt)
        if (!Number.isNaN(updatedAt.getTime())) {
          if (updatedAt >= startOfToday && updatedAt <= endOfToday) {
            completedToday += 1
          }
        }
      }
    })

    return {
      total: orders.length,
      pending,
      completedToday,
    }
  }, [orders])

  const cropStats = useMemo(() => {
    const active = crops.filter(crop => crop.status?.toLowerCase() === 'active').length
    const nearingHarvest = crops.filter(crop => {
      if (!crop.harvestDate) return false
      const harvest = new Date(crop.harvestDate)
      if (Number.isNaN(harvest.getTime())) return false
      const now = new Date()
      const diff = harvest.getTime() - now.getTime()
      const days = diff / (1000 * 60 * 60 * 24)
      return days >= 0 && days <= 14
    }).length

    return {
      total: crops.length,
      active,
      nearingHarvest,
    }
  }, [crops])

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
        ? `Chất lượng dữ liệu: ${
            sensorData.dataQuality === 'good'
              ? 'Tốt'
              : sensorData.dataQuality === 'poor'
                ? 'Cần kiểm tra'
                : 'Không khả dụng'
          }`
        : 'Không có tín hiệu từ trạm IoT',
    })

    metrics.push({
      title: 'Lịch tác nghiệp',
      value: formatNumber(scheduleStats.total),
      change:
        scheduleStats.upcomingToday > 0
          ? `${scheduleStats.upcomingToday} lịch bắt đầu hôm nay`
          : scheduleStats.inProgress > 0
            ? `${scheduleStats.inProgress} lịch đang diễn ra`
            : 'Không có lịch hôm nay',
      changeType: scheduleStats.overdue > 0 ? 'decrease' : 'increase',
      icon: CalendarCheck,
      color: scheduleStats.overdue > 0 ? 'green-dark' : 'green',
      description:
        scheduleStats.overdue > 0
          ? `${scheduleStats.overdue} lịch đã quá hạn`
          : 'Tổng số lịch đang quản lý',
    })

    metrics.push({
      title: 'Tồn kho hiện tại',
      value: formatNumber(inventoryStats.totalQuantity),
      change:
        inventoryStats.lowStock > 0
          ? `${inventoryStats.lowStock} sản phẩm dưới ${lowStockThreshold}`
          : `${inventoryStats.totalProducts} sản phẩm đang lưu kho`,
      changeType: inventoryStats.lowStock > 0 ? 'decrease' : 'increase',
      icon: Package,
      color: inventoryStats.lowStock > 0 ? 'green-medium' : 'green',
      description: 'Số lượng tính từ danh sách sản phẩm',
    })

    metrics.push({
      title: 'Đơn hàng đang xử lý',
      value: formatNumber(orderStats.pending),
      change:
        orderStats.completedToday > 0
          ? `${orderStats.completedToday} đơn hoàn tất hôm nay`
          : `${orderStats.total} đơn trong hệ thống`,
      changeType: orderStats.pending > 0 ? 'decrease' : 'increase',
      icon: ClipboardList,
      color: orderStats.pending > 0 ? 'green-dark' : 'green',
      description: 'Trạng thái tính từ danh sách đơn hàng',
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
      description: 'Dựa trên danh sách cây trồng Active',
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
    inventoryStats.lowStock,
    inventoryStats.totalProducts,
    inventoryStats.totalQuantity,
    lowStockThreshold,
    orderStats.completedToday,
    orderStats.pending,
    orderStats.total,
    scheduleStats.inProgress,
    scheduleStats.overdue,
    scheduleStats.total,
    scheduleStats.upcomingToday,
    sensorData,
  ])

  const growthOverviewItems = useMemo<GrowthOverviewItem[]>(() => {
    const items: GrowthOverviewItem[] = []

    items.push({
      icon: Sprout,
      gradient: 'from-green-500 to-green-600',
      title: 'Cây trồng active',
      value:
        cropStats.total > 0
          ? `${formatNumber(cropStats.active)}/${formatNumber(cropStats.total)} lô`
          : 'Chưa có dữ liệu',
      description:
        cropStats.nearingHarvest > 0
          ? `${cropStats.nearingHarvest} lô sắp thu hoạch`
          : 'Không có lô sắp thu hoạch trong 14 ngày',
      badges:
        cropStats.total > 0
          ? [
              {
                label: 'Theo dõi sinh trưởng',
                variant: 'default',
                className: 'bg-green-100 text-green-800 border-0',
              },
              {
                label: `${formatNumber(cropStats.total)} tổng lô`,
                variant: 'outline',
                className: 'border-green-200 text-green-700',
              },
            ]
          : undefined,
    })

    items.push({
      icon: Gauge,
      gradient: 'from-green-400 to-green-500',
      title: 'Điều kiện môi trường',
      value: sensorData ? `${sensorData.temperature.toFixed(1)}°C` : '--',
      description: sensorData
        ? `Độ ẩm ${sensorData.humidity.toFixed(0)}% • Độ ẩm đất ${sensorData.soilMoisture.toFixed(
            0
          )}%`
        : 'Chưa có dữ liệu cảm biến môi trường',
      badges: sensorData
        ? [
            {
              label:
                sensorData.dataQuality === 'good'
                  ? 'Chất lượng tốt'
                  : sensorData.dataQuality === 'poor'
                    ? 'Cần kiểm tra'
                    : 'Mất tín hiệu',
              variant: 'default',
              className:
                sensorData.dataQuality === 'good'
                  ? 'bg-green-50 text-green-700 border-0'
                  : 'bg-yellow-100 text-yellow-800 border-0',
            },
          ]
        : undefined,
    })

    items.push({
      icon: Clock,
      gradient: 'from-green-600 to-green-700',
      title: 'Tiến độ lịch tác nghiệp',
      value: `${formatNumber(scheduleStats.inProgress)} đang thực hiện`,
      description:
        scheduleStats.upcomingToday > 0
          ? `${scheduleStats.upcomingToday} lịch bắt đầu hôm nay`
          : scheduleStats.overdue > 0
            ? `${scheduleStats.overdue} lịch quá hạn`
            : 'Không có lịch mới trong hôm nay',
      badges:
        scheduleStats.total > 0
          ? [
              {
                label: `${formatNumber(scheduleStats.total)} lịch`,
                variant: 'default',
                className: 'bg-green-100 text-green-800 border-0',
              },
            ]
          : undefined,
    })

    return items
  }, [
    cropStats.active,
    cropStats.nearingHarvest,
    cropStats.total,
    formatNumber,
    scheduleStats.inProgress,
    scheduleStats.overdue,
    scheduleStats.total,
    scheduleStats.upcomingToday,
    sensorData,
  ])

  const recentActivities = useMemo(() => {
    const entries: Array<{ item: ActivityItemProps; timestamp: number }> = []

    farmActivities.forEach(activity => {
      const timestamp = toTimestamp(activity.endDate ?? activity.startDate)
      entries.push({
        timestamp,
        item: {
          title: activity.activityType || 'Hoạt động nông trại',
          description: `Trạng thái: ${activity.status}`,
          time: formatDateTime(activity.endDate ?? activity.startDate),
          type: activity.status?.toLowerCase().includes('complete') ? 'success' : 'info',
          icon: Activity,
        },
      })
    })

    orders.forEach(order => {
      const timestamp = toTimestamp(order.updatedAt ?? order.createdAt)
      const status = order.status ?? 0
      const statusLabel = getOrderStatusLabel(status)
      const type: ActivityItemProps['type'] =
        status === 5 ? 'success' : status === 4 ? 'error' : status === 0 ? 'warning' : 'info'

      entries.push({
        timestamp,
        item: {
          title: `Đơn hàng #${order.orderId}`,
          description: `Giá trị ${formatCurrency(order.totalPrice)} - ${statusLabel}`,
          time: formatDateTime(order.updatedAt ?? order.createdAt),
          type,
          icon: ClipboardList,
        },
      })
    })

    schedules.forEach(schedule => {
      const timestamp = toTimestamp(schedule.updatedAt ?? schedule.startDate)
      const status = typeof schedule.status === 'string' ? schedule.status : String(schedule.status ?? '')

      entries.push({
        timestamp,
        item: {
          title:
            schedule.farmActivityView?.activityType ||
            schedule.cropView?.cropName ||
            'Lịch tác nghiệp',
          description: `Khối lượng: ${schedule.quantity} - Trạng thái: ${status}`,
          time: formatDateTime(schedule.startDate),
          type: 'info',
          icon: CalendarCheck,
        },
      })
    })

    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8)
      .map(entry => entry.item)
  }, [farmActivities, orders, schedules, formatDateTime, formatCurrency, toTimestamp])

  const quickActions = useMemo(
    () => [
      {
        title: 'Bắt đầu tưới',
        description: sensorData
          ? sensorData.pumpState
            ? 'Máy bơm đang hoạt động'
            : 'Máy bơm đang tắt'
          : 'Điều khiển hệ thống tưới',
        icon: Droplets,
        color: 'green-light' as const,
        action: () => navigate('/manager/irrigation'),
      },
      {
        title: 'Quản lý IoT',
        description: `${formatNumber(iotDeviceStats.total)} thiết bị đã kết nối`,
        icon: Cpu,
        color: 'green-dark' as const,
        action: () => navigate('/manager/iot-devices'),
      },
    ],
    [navigate, sensorData, formatNumber, iotDeviceStats.total]
  )

  const moduleSnapshots = useMemo<ModuleSnapshot[]>(() => {
    const snapshots: ModuleSnapshot[] = []

    snapshots.push({
      title: 'Quản lý cây trồng',
      summary:
        cropStats.total > 0
          ? `${cropStats.active}/${cropStats.total} lô đang active`
          : 'Chưa có dữ liệu cây trồng',
      trend:
        cropStats.nearingHarvest > 0
          ? `${cropStats.nearingHarvest} lô sắp thu hoạch`
          : 'Không có lô sắp thu hoạch trong 14 ngày',
      link: '/manager/crops',
      icon: Sprout,
      tag: cropStats.active > 0 ? 'Hoạt động' : 'Chưa cập nhật',
      tagTone: cropStats.active > 0 ? 'positive' : 'neutral',
    })

    snapshots.push({
      title: 'Lịch & Hoạt động',
      summary: `${formatNumber(scheduleStats.total)} lịch đang quản lý`,
      trend:
        scheduleStats.overdue > 0
          ? `${scheduleStats.overdue} lịch quá hạn`
          : `${scheduleStats.inProgress} lịch đang thực hiện`,
      link: '/manager/farm-activities',
      icon: CalendarCheck,
      tag: scheduleStats.overdue > 0 ? 'Cần xử lý' : 'Ổn định',
      tagTone: scheduleStats.overdue > 0 ? 'alert' : 'positive',
    })

    snapshots.push({
      title: 'Đơn hàng & tồn kho',
      summary: `${formatNumber(orderStats.pending)} đơn chờ - ${inventoryStats.lowStock} sản phẩm thấp`,
      trend:
        orderStats.completedToday > 0
          ? `${orderStats.completedToday} đơn hoàn tất hôm nay`
          : `${inventoryStats.totalProducts} sản phẩm theo dõi`,
      link: '/manager/orders',
      icon: Package,
      tag: inventoryStats.lowStock > 0 ? 'Kiểm tra tồn kho' : 'An toàn',
      tagTone: inventoryStats.lowStock > 0 ? 'alert' : 'positive',
    })

    snapshots.push({
      title: 'Thiết bị IoT',
      summary: `${iotDeviceStats.active} hoạt động, ${iotDeviceStats.maintenance} bảo trì, ${iotDeviceStats.error} lỗi`,
      trend: `${iotDeviceStats.total} thiết bị đã đăng ký`,
      link: '/manager/iot-devices',
      icon: Cpu,
      tag: iotDeviceStats.error > 0 ? 'Cảnh báo' : 'Ổn định',
      tagTone: iotDeviceStats.error > 0 ? 'alert' : 'positive',
    })

    return snapshots
  }, [
    cropStats.active,
    cropStats.nearingHarvest,
    cropStats.total,
    formatNumber,
    iotDeviceStats.active,
    iotDeviceStats.error,
    iotDeviceStats.maintenance,
    iotDeviceStats.total,
    inventoryStats.lowStock,
    inventoryStats.totalProducts,
    orderStats.completedToday,
    orderStats.pending,
    scheduleStats.inProgress,
    scheduleStats.overdue,
    scheduleStats.total,
  ])

  const actionCenterItems = useMemo<ActionCenterItem[]>(() => {
    const items: ActionCenterItem[] = []

    if (iotDeviceStats.error > 0) {
      items.push({
        title: `${iotDeviceStats.error} thiết bị IoT cần kiểm tra`,
        description: 'Có thiết bị báo lỗi, nên rà soát trạng thái ngay',
        status: 'critical',
        module: 'Thiết bị IoT',
        ctaLabel: 'Xem thiết bị',
        onClick: () => navigate('/manager/iot-devices'),
      })
    }

    if (scheduleStats.overdue > 0) {
      items.push({
        title: `${scheduleStats.overdue} lịch đã quá hạn`,
        description: 'Một số lịch chưa cập nhật trạng thái sau thời gian kết thúc',
        status: 'warning',
        module: 'Lịch tác nghiệp',
        ctaLabel: 'Kiểm tra lịch',
        onClick: () => navigate('/manager/farm-activities'),
      })
    }

    if (inventoryStats.lowStock > 0) {
      items.push({
        title: `${inventoryStats.lowStock} sản phẩm gần hết`,
        description: `Kiểm tra danh mục để bổ sung tồn kho dưới ${lowStockThreshold} đơn vị`,
        status: 'warning',
        module: 'Kho & Sản phẩm',
        ctaLabel: 'Xem tồn kho',
        onClick: () => navigate('/manager/products'),
      })
    }

    if (orderStats.pending > 0) {
      items.push({
        title: `${orderStats.pending} đơn hàng đang chờ xử lý`,
        description: 'Ưu tiên xác nhận các đơn hàng mới để đảm bảo tiến độ giao',
        status: 'info',
        module: 'Đơn hàng',
        ctaLabel: 'Quản lý đơn hàng',
        onClick: () => navigate('/manager/orders'),
      })
    }

    if (items.length === 0) {
      items.push({
        title: 'Tất cả hệ thống hoạt động ổn định',
        description: 'Không có cảnh báo mới, tiếp tục giám sát dữ liệu theo thời gian thực',
        status: 'info',
        module: 'Tổng quan',
        ctaLabel: 'Làm mới',
        onClick: () => fetchDashboardData(),
      })
    }

    return items
  }, [
    fetchDashboardData,
    inventoryStats.lowStock,
    iotDeviceStats.error,
    lowStockThreshold,
    navigate,
    orderStats.pending,
    scheduleStats.overdue,
  ])

  const scheduleTimeline = useMemo<ScheduleItem[]>(() => {
    return schedules
      .filter(schedule => toTimestamp(schedule.startDate) > 0)
      .slice()
      .sort((a, b) => toTimestamp(a.startDate) - toTimestamp(b.startDate))
      .slice(0, 5)
      .map(schedule => {
        const progress = computeScheduleProgress(schedule)
        const status = getScheduleTimelineStatus(schedule)
        const responsible =
          schedule.staff?.accountProfile?.fullname ||
          schedule.staffName ||
          schedule.managerName ||
          'Chưa phân công'
        const identifier =
          schedule.scheduleId ??
          schedule.farmActivitiesId ??
          `${schedule.startDate}-${schedule.endDate ?? ''}`

        return {
          id: identifier,
          title:
            schedule.farmActivityView?.activityType ||
            schedule.cropView?.cropName ||
            `Lịch #${schedule.scheduleId ?? ''}`,
          timeRange: formatDateRange(schedule.startDate, schedule.endDate),
          responsible,
          progress,
          status,
        }
      })
  }, [
    computeScheduleProgress,
    formatDateRange,
    getScheduleTimelineStatus,
    schedules,
    toTimestamp,
  ])

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển quản lý nông trại</h1>
            <p className="mt-2 text-gray-600">
              Tổng hợp các chỉ số cốt lõi từ cây trồng, lịch tác nghiệp, thiết bị IoT và kinh doanh.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
              Tải báo cáo
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">Thêm ghi chú</Button>
          </div>
        </div>

        {isLoadingDashboard && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-ping" />
            <span>Đang đồng bộ dữ liệu thời gian thực...</span>
          </div>
        )}

        {dashboardError && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {dashboardError}
          </div>
        )}

        <div className="grid gap-6 mb-10 md:grid-cols-2 xl:grid-cols-4">
          {dashboardMetrics.map(metric => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Tổng quan tăng trưởng
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
                  {growthOverviewItems.map(item => (
                    <div key={item.title} className="flex flex-col items-center text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center shadow-lg`}
                      >
                        <item.icon className="w-8 h-8 text-white" />
                    </div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-800 font-semibold mt-1">{item.value}</p>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      {item.badges && (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          {item.badges.map(badge => (
                            <Badge
                              key={`${item.title}-${badge.label}`}
                              variant={badge.variant}
                              className={badge.className}
                            >
                              {badge.label}
                    </Badge>
                          ))}
                  </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Thao tác nhanh & hành động ưu tiên
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {actionCenterItems.map(item => {
                    const toneClasses =
                      item.status === 'critical'
                        ? 'border-red-100 bg-red-50/40 text-red-700'
                        : item.status === 'warning'
                          ? 'border-yellow-100 bg-yellow-50/40 text-yellow-700'
                          : 'border-green-100 bg-green-50/40 text-green-700'
                    return (
                      <div
                        key={item.title}
                        className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${toneClasses}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              {item.module}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-700 hover:bg-green-50"
                            onClick={item.onClick}
                          >
                            {item.ctaLabel}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

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

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Lịch tác nghiệp hôm nay
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/manager/farm-activities')}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Quản lý lịch
                  </Button>
          </div>
              </CardHeader>
              <CardContent className="p-0">
                {scheduleTimeline.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {scheduleTimeline.map(item => {
                      const statusLabel =
                        item.status === 'ongoing'
                          ? 'Đang thực hiện'
                          : item.status === 'upcoming'
                            ? 'Sắp diễn ra'
                            : item.status === 'completed'
                              ? 'Hoàn tất'
                              : 'Quá hạn'
                      const statusTone =
                        item.status === 'ongoing'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'upcoming'
                            ? 'bg-green-50 text-green-700'
                            : item.status === 'completed'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-50 text-red-700'

                      return (
                        <div
                          key={item.id}
                          className="p-5 flex flex-col gap-2 md:flex-row md:items-center"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.timeRange}</p>
                            <p className="text-sm text-gray-500">Phụ trách: {item.responsible}</p>
                          </div>
                          <div className="flex flex-col items-start md:items-end gap-2">
                            <div className="w-32 h-2 bg-gray-100 rounded-full">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <Badge variant="default" className={`${statusTone} border-0`}>
                              {statusLabel}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Chưa có lịch tác nghiệp để hiển thị
                  </div>
                )}
              </CardContent>
            </Card>
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
                {recentActivities.length > 0 ? (
                  <>
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
                        onClick={() => fetchDashboardData()}
                  >
                        Làm mới dữ liệu
                  </Button>
                </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Chưa ghi nhận hoạt động mới
                  </div>
                )}
              </CardContent>
            </Card>

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

        <Card className="border-0 shadow-lg bg-white mt-10">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Ảnh chụp nhanh theo mô-đun
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Tùy chỉnh bố cục
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {moduleSnapshots.map(snapshot => {
                const tagStyles =
                  snapshot.tagTone === 'positive'
                    ? 'bg-green-100 text-green-800'
                    : snapshot.tagTone === 'alert'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700'

                return (
                  <motion.button
                    key={snapshot.title}
                    onClick={() => navigate(snapshot.link)}
                    whileHover={{ scale: 1.02 }}
                    className="text-left h-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <snapshot.icon className="h-5 w-5 text-green-600" />
                      </div>
                      <Badge variant="default" className={`${tagStyles} border-0`}>
                        {snapshot.tag}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">{snapshot.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 min-h-[48px]">{snapshot.summary}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-green-700">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {snapshot.trend}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  )
}
