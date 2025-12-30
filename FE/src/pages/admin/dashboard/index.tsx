import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { accountApi } from '@/shared/api/auth'
import { farmService } from '@/shared/api/farmService'
import { iotDeviceService } from '@/shared/api/iotDeviceService'
import { orderService } from '@/shared/api/orderService'
import { productService } from '@/shared/api/productService'
import { feedbackService } from '@/shared/api/feedbackService'
import { useToast } from '@/shared/ui/use-toast'
import { calculateRevenue } from '@/shared/lib/revenue'
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

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalFarms: number
  activeFarms: number
  totalDevices: number
  onlineDevices: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalProducts: number
  activeProducts: number
  lowStockItems: number
  totalRevenue: number
  totalFeedbacks: number
  systemHealth: number
  lastUpdated: Date | null
}

const AdminDashboard: React.FC = () => {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalFarms: 0,
    activeFarms: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockItems: 0,
    totalRevenue: 0,
    totalFeedbacks: 0,
    systemHealth: 0,
    lastUpdated: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateSystemHealth = useCallback((m: SystemMetrics): number => {
    let healthScore = 100

    if (m.totalDevices > 0) {
      const deviceHealth = (m.onlineDevices / m.totalDevices) * 100
      healthScore -= (100 - deviceHealth) * 0.3
    }

    if (m.totalOrders > 0) {
      const pendingRatio = (m.pendingOrders / m.totalOrders) * 100
      if (pendingRatio > 20) healthScore -= (pendingRatio - 20) * 0.2
    }

    if (m.totalProducts > 0) {
      const lowStockRatio = (m.lowStockItems / m.totalProducts) * 100
      if (lowStockRatio > 15) healthScore -= (lowStockRatio - 15) * 0.2
    }

    if (m.totalUsers > 0) {
      const activeUserRatio = (m.activeUsers / m.totalUsers) * 100
      if (activeUserRatio < 50) healthScore -= (50 - activeUserRatio) * 0.15
    }

    if (m.totalFarms > 0) {
      const activeFarmRatio = (m.activeFarms / m.totalFarms) * 100
      if (activeFarmRatio < 70) healthScore -= (70 - activeFarmRatio) * 0.15
    }

    return Math.max(0, Math.min(100, Math.round(healthScore)))
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      const [
        accountsResult,
        farmsResult,
        devicesResult,
        ordersResult,
        productsResult,
        feedbacksResult,
      ] = await Promise.allSettled([
        accountApi.getAll({ pageSize: 1000, pageIndex: 1 }),
        farmService.getAllFarms(),
        iotDeviceService.getAllDevices(1, 1000),
        orderService.getOrderList({ pageIndex: 1, pageSize: 1000 }),
        productService.getProductsList({ page: 1, pageSize: 1000 }),
        feedbackService.getFeedbackList({ pageIndex: 1, pageSize: 1000 }),
      ])

      let totalUsers = 0
      let activeUsers = 0
      if (accountsResult.status === 'fulfilled') {
        const accounts = accountsResult.value.items || []
        totalUsers = accounts.length
        activeUsers = accounts.filter(
          acc => acc.status === 'Active' || acc.status === 'ACTIVE' || acc.status === 1
        ).length
      }

      let totalFarms = 0
      let activeFarms = 0
      if (farmsResult.status === 'fulfilled') {
        const farms = Array.isArray(farmsResult.value) ? farmsResult.value : []
        totalFarms = farms.length
        activeFarms = farms.length
      }

      let totalDevices = 0
      let onlineDevices = 0
      if (devicesResult.status === 'fulfilled') {
        const devices = devicesResult.value.items || []
        totalDevices = devices.length
        onlineDevices = devices.filter(d => {
          const s = d.status
          if (s === undefined || s === null) return false
          if (typeof s === 'number') return s === 1
          const normalized = String(s).toUpperCase()
          return normalized === '1' || normalized === 'ACTIVE'
        }).length
      }

      let totalOrders = 0
      let pendingOrders = 0
      let completedOrders = 0
      let totalRevenue = 0
      if (ordersResult.status === 'fulfilled') {
        const orders = ordersResult.value.items || []
        totalOrders = orders.length
        pendingOrders = orders.filter(o => o.status === 0 || o.status === 2 || o.status === 3).length
        completedOrders = orders.filter(o => o.status === 5 || o.status === 6).length
        totalRevenue = calculateRevenue(orders)
      }

      let totalProducts = 0
      let activeProducts = 0
      let lowStockItems = 0
      if (productsResult.status === 'fulfilled') {
        const products = productsResult.value.products || []
        totalProducts = products.length
        activeProducts = products.filter(p => p.status === 'Active').length
        lowStockItems = products.filter(p => (p.quantity || 0) < 10).length
      }

      let totalFeedbacks = 0
      if (feedbacksResult.status === 'fulfilled') {
        totalFeedbacks = feedbacksResult.value.items?.length || 0
      }

      const newMetrics: SystemMetrics = {
        totalUsers,
        activeUsers,
        totalFarms,
        activeFarms,
        totalDevices,
        onlineDevices,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts,
        activeProducts,
        lowStockItems,
        totalRevenue,
        totalFeedbacks,
        systemHealth: 0,
        lastUpdated: new Date(),
      }

      newMetrics.systemHealth = calculateSystemHealth(newMetrics)

      setMetrics(newMetrics)
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải dữ liệu bảng điều khiển'
      setError(errorMessage)
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [calculateSystemHealth, toast])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = async () => {
    await fetchDashboardData()
    toast({
      title: 'Đã làm mới',
      description: 'Dữ liệu đã được cập nhật',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const systemActivityData = useMemo(
    () => [
      {
        name: 'Người dùng',
        'Hoạt động': metrics.activeUsers,
        'Tổng': metrics.totalUsers,
      },
      {
        name: 'Trang trại',
        'Hoạt động': metrics.activeFarms,
        'Tổng': metrics.totalFarms,
      },
      {
        name: 'Thiết bị',
        'Hoạt động': metrics.onlineDevices,
        'Tổng': metrics.totalDevices,
      },
      {
        name: 'Sản phẩm',
        'Hoạt động': metrics.activeProducts,
        'Tổng': metrics.totalProducts,
      },
    ],
    [metrics]
  )

  const orderStatusData = useMemo(
    () =>
      [
        {
          name: 'Đang xử lý',
          value: metrics.pendingOrders,
          color: '#f59e0b',
        },
        {
          name: 'Đã hoàn thành',
          value: metrics.completedOrders,
          color: '#10b981',
        },
        {
          name: 'Khác',
          value: metrics.totalOrders - metrics.pendingOrders - metrics.completedOrders,
          color: '#94a3b8',
        },
      ].filter(item => item.value > 0),
    [metrics]
  )

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bảng điều khiển</h1>
            <p className="text-gray-600">
              Tổng quan hệ thống và giám sát toàn bộ hoạt động
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              Làm mới
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isRefreshing && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-ping" />
            <span>Đang đồng bộ dữ liệu thời gian thực...</span>
          </div>
        )}

        <div className="mb-8">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mx-auto mb-2" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-900">{metrics.onlineDevices}</div>
                      <div className="text-xs text-gray-500">Thiết bị trực tuyến</div>
                    </>
                  )}
                </div>
                <div className="text-center">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mx-auto mb-2" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</div>
                      <div className="text-xs text-gray-500">Người dùng hoạt động</div>
                    </>
                  )}
                </div>
                <div className="text-center">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mx-auto mb-2" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-900">{metrics.completedOrders}</div>
                      <div className="text-xs text-gray-500">Đơn hàng hoàn thành</div>
                    </>
                  )}
                </div>
                <div className="text-center">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mx-auto mb-2" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-900">{metrics.activeProducts}</div>
                      <div className="text-xs text-gray-500">Sản phẩm hoạt động</div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tổng số người dùng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : metrics.totalUsers}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <span className="text-green-600 font-medium">{metrics.activeUsers} hoạt động</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    <>
                      Tỷ lệ hoạt động:{' '}
                      {metrics.totalUsers > 0
                        ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100)
                        : 0}
                      %
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Trang trại</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : metrics.totalFarms}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <span className="text-green-600 font-medium">{metrics.activeFarms} hoạt động</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-40 mt-1" />
                  ) : (
                    'Tất cả trang trại đang hoạt động'
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Thiết bị IoT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : metrics.totalDevices}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <span
                      className={`font-medium ${metrics.onlineDevices === metrics.totalDevices
                        ? 'text-green-600'
                        : 'text-yellow-600'
                        }`}
                    >
                      {metrics.onlineDevices} trực tuyến
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    <>
                      Tỷ lệ trực tuyến:{' '}
                      {metrics.totalDevices > 0
                        ? Math.round((metrics.onlineDevices / metrics.totalDevices) * 100)
                        : 0}
                      %
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : metrics.totalOrders}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <span className="text-yellow-600 font-medium">
                      {metrics.pendingOrders} đang xử lý
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    `${metrics.completedOrders} đã hoàn thành`
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : metrics.totalProducts}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <span className="text-green-600 font-medium">
                      {metrics.activeProducts} hoạt động
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    metrics.lowStockItems > 0 ? (
                      <span className="text-red-600">{metrics.lowStockItems} tồn kho thấp</span>
                    ) : (
                      <span>Tất cả sản phẩm đủ tồn kho</span>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(metrics.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    `Từ ${metrics.completedOrders} đơn hàng`
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    'Tổng doanh thu hệ thống'
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Đánh giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : metrics.totalFeedbacks}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? <Skeleton className="h-4 w-24 mt-1" /> : 'Tổng số đánh giá'}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    'Phản hồi từ khách hàng'
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      {metrics.totalOrders > 0
                        ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100)
                        : 0}
                      %
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    `${metrics.completedOrders} / ${metrics.totalOrders} đơn hàng`
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {isLoading ? (
                    <Skeleton className="h-3 w-32 mt-1" />
                  ) : (
                    'Tỷ lệ đơn hàng hoàn thành'
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Tổng quan hoạt động hệ thống
              </CardTitle>
              <CardDescription>So sánh các chỉ số hoạt động chính</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={systemActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={'Hoạt động'} fill="#10b981" name="Đang hoạt động" />
                    <Bar dataKey={'Tổng'} fill="#94a3b8" name="Tổng số" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Phân bố trạng thái đơn hàng
              </CardTitle>
              <CardDescription>Chi tiết các trạng thái đơn hàng trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-64 w-full" />
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-16 mx-auto" />
                        <Skeleton className="h-3 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{metrics.pendingOrders}</div>
                      <div className="text-xs text-gray-500">Đang xử lý</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{metrics.completedOrders}</div>
                      <div className="text-xs text-gray-500">Đã hoàn thành</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {metrics.totalOrders - metrics.pendingOrders - metrics.completedOrders}
                      </div>
                      <div className="text-xs text-gray-500">Khác</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
