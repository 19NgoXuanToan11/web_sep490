import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    ShoppingCart,
    Package,
    Star,
    TrendingUp,
    DollarSign,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    CheckCircle,
    Truck,
    XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useNavigate } from 'react-router-dom'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { orderService, getOrderStatusLabel, getOrderStatusVariant } from '@/shared/api/orderService'
import type { Order } from '@/shared/api/orderService'
import { feedbackService } from '@/shared/api/feedbackService'
import type { Feedback } from '@/shared/api/feedbackService'
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
    icon: React.ComponentType<{ className?: string }>
    description?: string
    color?: 'purple' | 'blue' | 'green' | 'orange' | 'red'
    onClick?: () => void
}

const MetricCard = React.memo<MetricCardProps>(
    ({ title, value, change, changeType = 'increase', icon: Icon, description, color = 'purple', onClick }) => {
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

export default function StaffDashboard() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState<Order[]>([])
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dashboardError, setDashboardError] = useState<string | null>(null)
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true)
        setDashboardError(null)

        try {
            const [orderResult, feedbackResult] = await Promise.allSettled([
                orderService.getOrderList({ pageIndex: 1, pageSize: 100 }),
                feedbackService.getFeedbackList({ pageIndex: 1, pageSize: 100 }),
            ])

            const errors: string[] = []

            if (orderResult.status === 'fulfilled') {
                setOrders(orderResult.value?.items ?? [])
            } else {
                errors.push('đơn hàng')
            }

            if (feedbackResult.status === 'fulfilled') {
                setFeedbacks(feedbackResult.value?.items ?? [])
            } else {
                errors.push('đánh giá')
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

        const totalRevenue = recentOrders.reduce((sum, order) => {
            const price = order.totalPrice ?? 0
            return sum + (typeof price === 'number' ? price : 0)
        }, 0)

        const validFeedbacks = feedbacks.filter(fb => fb.rating >= 1 && fb.rating <= 5)
        const avgRating =
            validFeedbacks.length > 0
                ? validFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / validFeedbacks.length
                : 0

        const statusCounts = orders.reduce((acc, order) => {
            const status = getOrderStatusLabel(order.status ?? 0)
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            totalOrders: orders.length,
            recentOrders: recentOrders.length,
            totalRevenue,
            avgRating: avgRating.toFixed(1),
            totalFeedbacks: feedbacks.length,
            statusCounts,
        }
    }, [orders, feedbacks, timeRange])

    const revenueData = useMemo(() => {
        const now = new Date()
        const data: { name: string; revenue: number; orders: number }[] = []

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
                    revenue: dayOrders.reduce((sum, order) => {
                        const price = order.totalPrice ?? 0
                        return sum + (typeof price === 'number' ? price : 0)
                    }, 0),
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
                    revenue: weekOrders.reduce((sum, order) => {
                        const price = order.totalPrice ?? 0
                        return sum + (typeof price === 'number' ? price : 0)
                    }, 0),
                    orders: weekOrders.length,
                })
            }
        }

        return data
    }, [orders, timeRange])

    const orderStatusData = useMemo(() => {
        // Chỉ hiển thị 3 trạng thái: Đã xác nhận (1), Đang giao (3), Hoàn thành (5)
        const statusMap: Record<number, { label: string; color: string }> = {
            1: { label: 'Đã xác nhận', color: '#4CAF50' },     // Green - Đã thanh toán
            3: { label: 'Đang giao', color: '#9C27B0' },       // Purple - Đang giao hàng
            5: { label: 'Hoàn thành', color: '#4CAF50' },       // Green - Hoàn thành
        }

        // Chỉ lọc các trạng thái được phép hiển thị
        const allowedStatuses = [1, 3, 5]

        // Đếm số lượng đơn hàng theo từng trạng thái từ dữ liệu thật
        const statusCounts = orders.reduce((acc, order) => {
            const status = order.status ?? 0
            // Chỉ đếm các trạng thái được phép
            if (allowedStatuses.includes(status)) {
                acc[status] = (acc[status] || 0) + 1
            }
            return acc
        }, {} as Record<number, number>)

        // Chỉ hiển thị các trạng thái có đơn hàng (value > 0)
        return Object.entries(statusCounts)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => ({
                name: statusMap[Number(status)]?.label || getOrderStatusLabel(Number(status)),
                value: count,
                color: statusMap[Number(status)]?.color || '#999',
            }))
            .sort((a, b) => b.value - a.value) // Sắp xếp theo số lượng giảm dần
    }, [orders])

    const ratingData = useMemo(() => {
        // Khởi tạo mảng 5 phần tử: 1 sao, 2 sao, 3 sao, 4 sao, 5 sao
        const distribution = [0, 0, 0, 0, 0]

        feedbacks.forEach(fb => {
            // Chỉ lấy rating là số nguyên từ 1 đến 5
            const rating = Math.floor(fb.rating ?? 0)
            if (rating >= 1 && rating <= 5) {
                distribution[rating - 1]++
            }
        })

        // Luôn trả về đầy đủ 5 mức đánh giá từ 1 sao đến 5 sao
        return distribution.map((count, index) => ({
            name: `${index + 1} sao`,
            count,
        }))
    }, [feedbacks])

    // Sắp xếp đơn hàng theo thời gian tạo mới nhất trước (giống như trong trang quản lý đơn hàng)
    const recentOrdersSorted = useMemo(() => {
        return [...orders]
            .filter(order => order.createdAt)
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return dateB - dateA // Mới nhất trước
            })
            .slice(0, 5) // Lấy 5 đơn hàng mới nhất
    }, [orders])

    // Hàm xác định paymentStatus từ order status (giống như trong orders/index.tsx)
    const mapPaymentStatus = (status: number): 'pending' | 'paid' | 'failed' | 'refunded' => {
        switch (status) {
            case 1: // PAID - Đã thanh toán
            case 5: // COMPLETED - Hoàn thành
            case 6: // DELIVERED - Đã giao hàng
                return 'paid'
            case 0: // UNPAID - Chưa thanh toán
            case 3: // PENDING - Đang xử lý
                return 'pending'
            case 2: // UNDISCHARGED - Thanh toán thất bại/Chưa thanh toán
                return 'failed'
            case 4: // CANCELLED - Đã hủy
                return 'refunded'
            default:
                return 'pending'
        }
    }

    // Hàm hiển thị icon trạng thái (giống như trong orders/index.tsx)
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

    // Hàm hiển thị badge trạng thái (giống như trong orders/index.tsx)
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

    // Hàm hiển thị trạng thái với xử lý paymentStatus (giống như trong orders/index.tsx)
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

    // Hàm format ngày (giống như trong orders/index.tsx)
    const formatDateOnly = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }


    if (isLoading) {
        return (
            <StaffLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            </StaffLayout>
        )
    }

    return (
        <StaffLayout>
            <div className="px-4 sm:px-6 lg:px-8">
                { }
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <BarChart3 className="h-8 w-8 text-purple-600" />
                                Dashboard - Tổng quan
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Theo dõi hoạt động kinh doanh và hiệu suất làm việc
                            </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex gap-3">
                            <Button
                                variant="outline"
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
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

                { }
                <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Tổng đơn hàng"
                        value={stats.totalOrders}
                        change={`${stats.recentOrders} đơn mới`}
                        icon={ShoppingCart}
                        color="purple"
                        description={`Trong ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`}
                        onClick={() => navigate('/staff/orders')}
                    />
                    <MetricCard
                        title={`Doanh thu (${timeRange === 'week' ? 'tuần' : 'tháng'})`}
                        value={`${stats.totalRevenue.toLocaleString('vi-VN')} đ`}
                        change={stats.recentOrders > 0 ? `Từ ${stats.recentOrders} đơn` : 'Chưa có đơn'}
                        changeType={stats.recentOrders > 0 ? 'increase' : 'decrease'}
                        icon={DollarSign}
                        color="green"
                        description={`Tổng thu ${timeRange === 'week' ? '7 ngày' : '30 ngày'} qua`}
                    />
                    <MetricCard
                        title="Đánh giá trung bình"
                        value={`${stats.avgRating} ⭐`}
                        change={`${stats.totalFeedbacks} đánh giá`}
                        icon={Star}
                        color="orange"
                        description="Mức độ hài lòng khách hàng"
                        onClick={() => navigate('/staff/feedbacks')}
                    />
                    <MetricCard
                        title="Sản phẩm"
                        value="Quản lý"
                        change="Xem chi tiết"
                        icon={Package}
                        color="blue"
                        description="Kiểm tra kho & sản phẩm"
                        onClick={() => navigate('/staff/products')}
                    />
                </div>

                { }
                <div className="grid gap-8 lg:grid-cols-2 mb-8">
                    { }
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-600" />
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
                                    <Bar dataKey="revenue" fill="#8B5CF6" name="Doanh thu" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    { }
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-purple-600" />
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

                { }
                <div className="grid gap-8 lg:grid-cols-2 mb-8">
                    { }
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

                    { }
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-purple-600" />
                                    Đơn hàng gần đây
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/staff/orders')}
                                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
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

                { }
                <Card className="border-0 shadow-lg mb-8">
                    <CardHeader className="border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-orange-500" />
                                Đánh giá gần đây
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/staff/feedbacks')}
                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                            >
                                Xem tất cả
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1">
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
                                            <p className="text-sm text-gray-600 mb-1">{feedback.comment || 'Không có bình luận'}</p>
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

                { }
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Thao tác nhanh</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <motion.button
                                onClick={() => navigate('/staff/orders')}
                                className="p-4 text-left rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md hover:bg-purple-50/30 transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
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
                                className="p-4 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 transition-all duration-200"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
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

