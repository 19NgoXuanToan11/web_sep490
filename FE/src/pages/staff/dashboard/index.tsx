import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    ShoppingCart,
    Package,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useNavigate } from 'react-router-dom'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import {
    orderService,
    getOrderStatusLabel,
    getOrderStatusVariant,
    normalizeOrderStatus,
    derivePaymentStatus,
} from '@/shared/api/orderService'
import type { Order } from '@/shared/api/orderService'
import { feedbackService } from '@/shared/api/feedbackService'
import type { Feedback } from '@/shared/api/feedbackService'
import { productService, type Product } from '@/shared/api/productService'
import { categoryService, type Category } from '@/shared/api/categoryService'
import { formatDate } from '@/shared/lib/date-utils'
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
    color?: 'purple' | 'blue' | 'green' | 'orange' | 'red'
    onClick?: () => void
}

const MetricCard = React.memo<MetricCardProps>(
    ({ title, value, change, changeType = 'increase', description, color = 'green', onClick }) => {
        const colorClasses = {
            purple: 'from-purple-500 to-purple-600',
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            orange: 'from-orange-500 to-orange-600',
            red: 'from-red-500 to-red-600',
        }

        const changeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight
        const ChangeIcon = changeIcon

        return (
            <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={onClick}
                className={onClick ? 'cursor-pointer' : ''}
            >
                <Card className="relative overflow-hidden border-0 shadow-lg bg-white">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[color]}`} />
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

export default function StaffDashboard() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState<Order[]>([])
    const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0)
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [totalProductsCount, setTotalProductsCount] = useState<number>(0)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dashboardError, setDashboardError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true)
        setDashboardError(null)

        try {
            const [orderResult, feedbackResult, productResult, categoryResult] = await Promise.allSettled([
                orderService.getOrderList({ pageIndex: 1, pageSize: 1000 }),
                feedbackService.getFeedbackList({ pageIndex: 1, pageSize: 1000 }),
                productService.getProductsList({ page: 1, pageSize: 1000 }),
                categoryService.getAllCategories(),
            ])

            const errors: string[] = []

            if (orderResult.status === 'fulfilled') {
                const orderData = orderResult.value
                setOrders(orderData?.items ?? [])
                setTotalOrdersCount(orderData?.totalItemCount ?? 0)
            } else {
                errors.push('đơn hàng')
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

            if (categoryResult.status === 'fulfilled') {
                setCategories(categoryResult.value ?? [])
            } else {
                errors.push('danh mục')
            }

            if (errors.length > 0) {
                setDashboardError(`Không thể tải dữ liệu: ${errors.join(', ')}`)
            }
        } catch (error) {
            setDashboardError('Không thể tải dữ liệu bảng điều khiển')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboardData()
    }, [fetchDashboardData])

    const stats = useMemo(() => {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const cutoffDate = timeRange === 'week' ? weekAgo : monthAgo

        const recentOrders = orders.filter(order => {
            if (!order.createdAt) return false
            const orderDate = new Date(order.createdAt)
            if (Number.isNaN(orderDate.getTime())) return false
            return orderDate >= cutoffDate
        })

        const pendingOrders = orders.filter(order => {
            const status = order.status ?? 0
            return status === 0 || status === 3
        })

        const deliveringOrders = orders.filter(order => {
            const status = order.status ?? 0
            return status === 3
        })

        const validFeedbacks = feedbacks.filter(fb => fb.rating >= 1 && fb.rating <= 5)
        const avgRating =
            validFeedbacks.length > 0
                ? validFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / validFeedbacks.length
                : 0

        const activeProducts = products.filter(p => p.status === 'Active').length

        return {
            totalOrders: totalOrdersCount,
            recentOrders: recentOrders.length,
            pendingOrders: pendingOrders.length,
            deliveringOrders: deliveringOrders.length,
            avgRating: avgRating.toFixed(1),
            totalFeedbacks: feedbacks.length,
            activeProducts,
            totalProducts: totalProductsCount || products.length,
        }
    }, [orders, feedbacks, products, timeRange, totalOrdersCount, totalProductsCount])

    const orderStatusData = useMemo(() => {
        const statusMap: Record<number, { label: string; color: string }> = {
            0: { label: 'Chưa thanh toán', color: '#F59E0B' },
            1: { label: 'Đã xác nhận', color: '#4CAF50' },
            3: { label: 'Đang giao', color: '#9C27B0' },
            5: { label: 'Hoàn thành', color: '#10B981' },
        }

        const allowedStatuses = [0, 1, 3, 5]

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

    const orderCountData = useMemo(() => {
        const now = new Date()
        const data: { name: string; orders: number }[] = []

        if (timeRange === 'week') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                const dayOrders = orders.filter(order => {
                    if (!order.createdAt) return false
                    const orderDate = new Date(order.createdAt)
                    if (Number.isNaN(orderDate.getTime())) return false
                    return orderDate.toDateString() === date.toDateString()
                })
                data.push({
                    name: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                    orders: dayOrders.length,
                })
            }
        } else {
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
                const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
                const weekOrders = orders.filter(order => {
                    if (!order.createdAt) return false
                    const orderDate = new Date(order.createdAt)
                    if (Number.isNaN(orderDate.getTime())) return false
                    return orderDate >= weekStart && orderDate <= weekEnd
                })
                data.push({
                    name: `Tuần ${4 - i}`,
                    orders: weekOrders.length,
                })
            }
        }

        return data
    }, [orders, timeRange])

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

    const categoryStats = useMemo(() => {
        const statsMap = new Map<number, { name: string; count: number; activeCount: number }>()

        categories.forEach(category => {
            statsMap.set(category.categoryId, {
                name: category.categoryName,
                count: 0,
                activeCount: 0,
            })
        })

        products.forEach(product => {
            const categoryId = product.categoryId
            const existing = statsMap.get(categoryId)
            if (existing) {
                existing.count++
                if (product.status === 'Active') {
                    existing.activeCount++
                }
            } else {
                statsMap.set(categoryId, {
                    name: product.categoryName || `Danh mục ${categoryId}`,
                    count: 1,
                    activeCount: product.status === 'Active' ? 1 : 0,
                })
            }
        })

        return Array.from(statsMap.values())
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count)
    }, [products, categories])

    const getStatusBadge = (status: number, paymentStatus?: string) => {
        let label = getOrderStatusLabel(status)
        let variant = getOrderStatusVariant(status)

        if (paymentStatus === 'failed' && status === 2) {
            label = 'Thất bại'
            variant = 'destructive'
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

    if (isLoading) {
        return (
            <StaffLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </StaffLayout>
        )
    }

    return (
        <StaffLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                Bảng điều khiển
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Tổng quan hoạt động trong hệ thống
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex gap-3">
                            <Button
                                variant="outline"
                                className="border-green-200 text-green-700 hover:bg-green-50"
                                onClick={fetchDashboardData}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang tải...' : 'Làm mới'}
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

                <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Tổng đơn hàng"
                        value={stats.totalOrders}
                        change={`${stats.recentOrders} đơn mới`}
                        color="green"
                        description={`Trong ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`}
                        onClick={() => navigate('/staff/orders')}
                    />
                    <MetricCard
                        title="Đơn hàng cần xử lý"
                        value={stats.pendingOrders}
                        change={stats.deliveringOrders > 0 ? `${stats.deliveringOrders} đang giao` : 'Tất cả đã xử lý'}
                        changeType={stats.pendingOrders > 0 ? 'decrease' : 'increase'}
                        color="orange"
                        description="Đơn hàng chưa thanh toán hoặc đang xử lý"
                        onClick={() => navigate('/staff/orders')}
                    />
                    <MetricCard
                        title="Sản phẩm"
                        value={stats.activeProducts}
                        change={`${stats.totalProducts} tổng sản phẩm`}
                        color="blue"
                        description="Sản phẩm đang hoạt động"
                        onClick={() => navigate('/staff/products')}
                    />
                    <MetricCard
                        title="Đánh giá trung bình"
                        value={`${stats.avgRating} ⭐`}
                        change={`${stats.totalFeedbacks} đánh giá`}
                        color="green"
                        description="Mức độ hài lòng khách hàng"
                        onClick={() => navigate('/staff/feedbacks')}
                    />
                </div>

                <div className="grid gap-8 lg:grid-cols-2 mb-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Số lượng đơn hàng {timeRange === 'week' ? 'theo ngày' : 'theo tuần'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={orderCountData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => [`${value} đơn`, 'Số lượng đơn hàng']}
                                    />
                                    <Legend />
                                    <Bar dataKey="orders" fill="#8B5CF6" name="Số lượng đơn hàng" />
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

                <div className="grid gap-8 lg:grid-cols-3 mb-8">
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

                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    Đơn hàng gần đây
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/staff/orders')}
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
                                            onClick={() => navigate('/staff/orders')}
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
                        <CardHeader className="border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    Đánh giá gần đây
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/staff/feedbacks')}
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                >
                                    Xem tất cả
                                </Button>
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

                <div className="grid gap-8 lg:grid-cols-3 mb-8">
                    <Card className="lg:col-span-2 border-0 shadow-lg">
                        <CardHeader className="border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    Sản phẩm
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/staff/products')}
                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                >
                                    Xem tất cả
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {products.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    {products.slice(0, 10).map((product) => (
                                        <motion.div
                                            key={product.productId}
                                            whileHover={{ scale: 1.05, y: -4 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex-shrink-0 w-48 cursor-pointer"
                                            onClick={() => navigate('/staff/products')}
                                        >
                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                                <div className="relative h-40 bg-gray-100">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.productName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = 'https://via.placeholder.com/200x200?text=No+Image'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <Package className="h-12 w-12 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                                                        {product.productName}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                                                        {product.productDescription || 'Không có mô tả'}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg font-bold text-green-600">
                                                            {new Intl.NumberFormat('vi-VN', {
                                                                style: 'currency',
                                                                currency: 'VND',
                                                            }).format(product.price)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            SL: {product.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium mb-2">Chưa có sản phẩm nào</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/staff/products')}
                                        className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                        Thêm sản phẩm mới
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    Danh mục sản phẩm
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {categoryStats.length > 0 ? (
                                <div className="space-y-4">
                                    {categoryStats.slice(0, 5).map((stat, index) => {
                                        const percentage = products.length > 0
                                            ? Math.round((stat.count / products.length) * 100)
                                            : 0
                                        const colors = [
                                            'bg-blue-500',
                                            'bg-green-500',
                                            'bg-purple-500',
                                            'bg-orange-500',
                                            'bg-pink-500',
                                        ]
                                        const color = colors[index % colors.length]

                                        return (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {stat.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">
                                                                {stat.count} sản phẩm
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 text-right">
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {stat.count}
                                                        </span>
                                                        <p className="text-xs text-gray-500">{percentage}%</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`${color} h-2 rounded-full transition-all duration-500`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {categoryStats.length > 5 && (
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 text-center">
                                                Và {categoryStats.length - 5} danh mục khác
                                            </p>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4 border-green-200 text-green-700 hover:bg-green-50"
                                        onClick={() => navigate('/staff/products')}
                                    >
                                        Xem chi tiết
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                    <p>Chưa có dữ liệu danh mục</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Thao tác nhanh</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <motion.button
                                onClick={() => navigate('/staff/orders')}
                                className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md hover:bg-green-50/30 transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                                        <ShoppingCart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Quản lý đơn hàng</h3>
                                        <p className="text-sm text-gray-600">Xem & xử lý đơn hàng</p>
                                    </div>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => navigate('/staff/products')}
                                className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md hover:bg-green-50/30 transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                                        <Package className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Quản lý sản phẩm</h3>
                                        <p className="text-sm text-gray-600">Cập nhật kho hàng</p>
                                    </div>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => navigate('/staff/feedbacks')}
                                className="p-4 text-left rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md hover:bg-orange-50/30 transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                                        <Star className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Xem đánh giá</h3>
                                        <p className="text-sm text-gray-600">Phản hồi khách hàng</p>
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </StaffLayout>
    )
}
