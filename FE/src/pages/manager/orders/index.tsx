import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Download,
  MoreHorizontal,
  User,
  MapPin,
  Loader2,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { useToast } from '@/shared/ui/use-toast'
import { orderService, getOrderStatusLabel, getOrderStatusVariant } from '@/shared/api/orderService'
import type { Order as ApiOrder, OrderItem } from '@/shared/api/orderService'

// Transform API response to display format
interface DisplayOrder {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  items: OrderItem[]
  status: number
  orderDate: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  notes?: string
}

const ManagerOrdersPage: React.FC = () => {
  const { toast } = useToast()
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')

  // Transform API order to display format
  const transformApiOrder = (apiOrder: ApiOrder): DisplayOrder => {
    // Extract customer info from email (fallback since API doesn't provide full customer details)
    const email = apiOrder.email || 'N/A'
    const customerName =
      email !== 'N/A' ? email.split('@')[0].replace(/[._]/g, ' ') : 'Unknown Customer'

    return {
      id: apiOrder.orderId || '',
      orderNumber: apiOrder.orderId || '',
      customer: {
        name: customerName,
        email: email,
        phone: 'N/A', // Not provided by API
        address: apiOrder.shippingAddress || 'N/A',
      },
      items: apiOrder.orderItems || [],
      status: apiOrder.status ?? 0,
      orderDate: apiOrder.createdAt || new Date().toISOString(),
      totalAmount: apiOrder.totalPrice || 0,
      paymentStatus: 'paid', // Default assumption, could be enhanced
      paymentMethod: 'N/A', // Not provided by API
    }
  }

  // Fetch orders from API
  const fetchOrders = useCallback(
    async (page: number = 1, status?: number) => {
      try {
        setLoading(true)
        const response = await orderService.getOrderList({
          pageIndex: page,
          pageSize,
          status,
        })

        const transformedOrders = response.items
          .map((apiOrder: any, index: number) => {
            try {
              const transformed = transformApiOrder(apiOrder)
              return transformed
            } catch (error) {
              console.error(`Error transforming order ${index}:`, error, 'Raw data:', apiOrder)
              return null
            }
          })
          .filter((order): order is DisplayOrder => order !== null) // Type-safe filter

        setOrders(transformedOrders)
        setTotalItems(response.totalItemCount)
        setTotalPages(response.totalPageCount)
        setCurrentPage(response.pageIndex)
      } catch (error) {
        console.error('Error fetching orders:', error)
        toast({
          title: 'Lỗi tải dữ liệu',
          description: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [pageSize, toast]
  )

  useEffect(() => {
    fetchOrders()
  }, [])

  // Handle status filter change with API call
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    const statusParam = status === 'all' ? undefined : parseInt(status)
    fetchOrders(1, statusParam)
  }

  // Handle tab change to filter by status
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
    let statusParam: number | undefined

    switch (tab) {
      case 'pending':
        statusParam = 0
        break
      case 'processing':
        statusParam = undefined // Show confirmed, preparing, shipping (1,2,3)
        break
      case 'completed':
        statusParam = 4
        break
      default:
        statusParam = undefined
    }

    fetchOrders(1, statusParam)
  }

  const filteredOrders = orders.filter(order => {
    // Debug logging
    if (!order || typeof order !== 'object') {
      console.warn('Invalid order object:', order)
      return false
    }

    const searchTerm = (searchQuery || '').toLowerCase()

    // Safe string handling with additional checks
    const orderNumber = order.orderNumber
    const customerName = order.customer?.name
    const customerEmail = order.customer?.email

    if (orderNumber && typeof orderNumber !== 'string') {
      console.warn('orderNumber is not a string:', orderNumber, typeof orderNumber)
    }

    const matchesSearch =
      (orderNumber && typeof orderNumber === 'string'
        ? orderNumber.toLowerCase().includes(searchTerm)
        : false) ||
      (customerName && typeof customerName === 'string'
        ? customerName.toLowerCase().includes(searchTerm)
        : false) ||
      (customerEmail && typeof customerEmail === 'string'
        ? customerEmail.toLowerCase().includes(searchTerm)
        : false)

    const matchesStatus = statusFilter === 'all' || order.status?.toString() === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 0).length,
    confirmed: orders.filter(o => o.status === 1).length,
    preparing: orders.filter(o => o.status === 2).length,
    shipping: orders.filter(o => o.status === 3).length,
    delivered: orders.filter(o => o.status === 4).length,
    cancelled: orders.filter(o => [5, 6].includes(o.status)).length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0),
    pendingPayments: orders.filter(o => o.paymentStatus === 'pending').length,
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOrders(currentPage)
    setIsRefreshing(false)
    toast({
      title: 'Dữ liệu đã được cập nhật',
      description: 'Thông tin tất cả đơn hàng đã được làm mới.',
    })
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: // Chờ xử lý
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 1: // Đã xác nhận
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 2: // Đang chuẩn bị
        return <Package className="h-4 w-4 text-purple-500" />
      case 3: // Đang giao
        return <Truck className="h-4 w-4 text-orange-500" />
      case 4: // Đã giao
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 5: // Đã hủy
      case 6: // Hoàn trả
        return <AlertTriangle className="h-4 w-4 text-red-500" />
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

  const getPaymentBadge = (paymentStatus: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'secondary',
    }

    const labels: Record<string, string> = {
      paid: 'Đã thanh toán',
      pending: 'Chờ thanh toán',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền',
    }

    return (
      <Badge variant={variants[paymentStatus] || 'secondary'}>
        {labels[paymentStatus] || paymentStatus}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <ManagerLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đơn hàng</h1>
            <p className="text-gray-600">Giám sát và quản lý tất cả đơn hàng trong hệ thống</p>
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
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Xuất báo cáo
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
                <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-yellow-600">{orderStats.pending} chờ xử lý</span>
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
                <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderStats.confirmed + orderStats.preparing + orderStats.shipping}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-blue-600">{orderStats.shipping} đang giao</span>
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
                <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                <p className="text-xs text-muted-foreground">Giao hàng thành công</p>
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
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatCurrency(orderStats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-yellow-600">
                    {orderStats.pendingPayments} chờ thanh toán
                  </span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Danh sách đơn hàng
            </CardTitle>
            <CardDescription>Tất cả đơn hàng trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="pending">Chờ xử lý</TabsTrigger>
                <TabsTrigger value="processing">Đang xử lý</TabsTrigger>
                <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm theo mã đơn, tên khách hàng, trang trại..."
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
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('all')}>
                        Tất cả
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('0')}>
                        Chờ xử lý
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('1')}>
                        Đã xác nhận
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('2')}>
                        Đang chuẩn bị
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('3')}>
                        Đang giao
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('4')}>
                        Đã giao
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusFilterChange('5')}>
                        Đã hủy
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        Thanh toán: {paymentFilter === 'all' ? 'Tất cả' : paymentFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setPaymentFilter('all')}>
                        Tất cả
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPaymentFilter('paid')}>
                        Đã thanh toán
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPaymentFilter('pending')}>
                        Chờ thanh toán
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPaymentFilter('failed')}>
                        Thất bại
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn hàng</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thanh toán</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Ngày đặt</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24">
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="ml-2">Đang tải dữ liệu...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            Không tìm thấy đơn hàng nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map(order => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.orderNumber}</div>
                                <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customer.name}</div>
                                <div className="text-sm text-gray-500">{order.customer.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, index) => (
                                  <div key={index} className="text-sm">
                                    {item.productName} ({item.stockQuantity} {item.unit})
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{order.items.length - 2} sản phẩm khác
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(order.orderDate)}</div>
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
                                    <User className="h-4 w-4 mr-2" />
                                    Liên hệ khách hàng
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Theo dõi giao hàng
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Hiển thị {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalItems)} trong tổng số {totalItems} đơn
                      hàng
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrders(currentPage - 1)}
                        disabled={currentPage <= 1 || loading}
                      >
                        Trước
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => fetchOrders(page)}
                              disabled={loading}
                            >
                              {page}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrders(currentPage + 1)}
                        disabled={currentPage >= totalPages || loading}
                      >
                        Tiếp
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Other tab contents would be filtered versions of the same table */}
              <TabsContent value="pending">
                <div className="text-center py-8 text-gray-500">
                  Hiển thị các đơn hàng chờ xử lý ({orderStats.pending} đơn)
                </div>
              </TabsContent>
              <TabsContent value="processing">
                <div className="text-center py-8 text-gray-500">
                  Hiển thị các đơn hàng đang xử lý (
                  {orderStats.confirmed + orderStats.preparing + orderStats.shipping} đơn)
                </div>
              </TabsContent>
              <TabsContent value="completed">
                <div className="text-center py-8 text-gray-500">
                  Hiển thị các đơn hàng đã hoàn thành ({orderStats.delivered} đơn)
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ManagerLayout>
  )
}

export default ManagerOrdersPage
