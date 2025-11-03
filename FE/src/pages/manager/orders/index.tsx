import React, { useEffect, useState, useCallback, useMemo } from 'react'
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
  MoreHorizontal,
  Loader2,
  Calendar,
  XCircle,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
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
  orderDetails?: any[] // Add this for compatibility
  status: number
  orderDate: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  notes?: string
  updatedAt?: string // Add this field
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
  const [searchType, setSearchType] = useState<
    'all' | 'orderId' | 'customerName' | 'email' | 'date'
  >('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  // Date search states
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  // Order detail modal states
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<ApiOrder | null>(null)
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false)

  // Transform API order to display format
  const transformApiOrder = (apiOrder: ApiOrder): DisplayOrder => {
    // Extract customer info from email (fallback since API doesn't provide full customer details)
    const email = apiOrder.email || 'N/A'
    const customerName =
      email !== 'N/A' ? email.split('@')[0].replace(/[._]/g, ' ') : 'Unknown Customer'

    return {
      id: String(apiOrder.orderId || ''),
      orderNumber: String(apiOrder.orderId || ''),
      customer: {
        name: customerName,
        email: email,
        phone: 'N/A', // Not provided by API
        address: apiOrder.shippingAddress || 'N/A',
      },
      items: apiOrder.orderItems || [],
      orderDetails: apiOrder.orderItems || apiOrder.orderDetails || [], // Add orderDetails from API
      status: apiOrder.status ?? 0,
      orderDate: apiOrder.createdAt || new Date().toISOString(),
      totalAmount: apiOrder.totalPrice || 0,
      paymentStatus: 'paid', // Default assumption, could be enhanced
      paymentMethod: 'N/A', // Not provided by API
      updatedAt: apiOrder.updatedAt, // Add updatedAt field
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

  // Date search function
  const handleDateSearch = async (date: Date) => {
    try {
      setIsSearching(true)
      const dateString = format(date, 'yyyy-MM-dd')

      const searchResult = await orderService.getOrdersByDate(dateString)
      const transformedOrders = searchResult.items.map(transformApiOrder)

      setOrders(transformedOrders)
      setTotalItems(searchResult.totalItemCount)
      setTotalPages(searchResult.totalPageCount)
      setCurrentPage(1)

      toast({
        title: 'Tìm kiếm thành công',
        description: `Tìm thấy ${searchResult.totalItemCount} đơn hàng trong ngày ${format(date, 'dd/MM/yyyy', { locale: vi })}`,
      })
    } catch (error) {
      console.error('Date search error:', error)
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể tìm kiếm đơn hàng theo ngày. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Advanced search function
  const handleAdvancedSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, reload all orders
      fetchOrders(1)
      return
    }

    try {
      setIsSearching(true)
      let searchResult

      switch (searchType) {
        case 'orderId':
          // For orderId search, we'll get single order detail
          try {
            const orderDetail = await orderService.getOrderById(searchQuery.trim())
            searchResult = {
              items: [orderDetail],
              totalItemCount: 1,
              pageSize: 1,
              totalPageCount: 1,
              pageIndex: 1,
              next: false,
              previous: false,
            }

            // Auto-open order detail modal for orderId search
            setSelectedOrderDetail(orderDetail)
            setIsOrderDetailOpen(true)
          } catch (error) {
            // If order not found, show empty result
            searchResult = {
              items: [],
              totalItemCount: 0,
              pageSize: 10,
              totalPageCount: 0,
              pageIndex: 1,
              next: false,
              previous: false,
            }
            toast({
              title: 'Không tìm thấy đơn hàng',
              description: `Không tìm thấy đơn hàng với mã "${searchQuery.trim()}"`,
              variant: 'destructive',
            })
          }
          break
        case 'customerName':
          searchResult = await orderService.getOrdersByCustomerName(searchQuery.trim())
          break
        case 'email':
          searchResult = await orderService.getOrdersByEmail(searchQuery.trim())
          break
        case 'date':
          // For date search, use selectedDate instead of searchQuery
          if (selectedDate) {
            const dateString = format(selectedDate, 'yyyy-MM-dd')
            searchResult = await orderService.getOrdersByDate(dateString)
          } else {
            toast({
              title: 'Chưa chọn ngày',
              description: 'Vui lòng chọn ngày để tìm kiếm đơn hàng',
              variant: 'destructive',
            })
            return
          }
          break
        default:
          // Default search - use regular order list
          searchResult = await orderService.getOrderList({
            pageIndex: 1,
            pageSize: 50, // Get more results for search
          })
      }

      const transformedOrders = searchResult.items.map(transformApiOrder)
      setOrders(transformedOrders)
      setTotalItems(searchResult.totalItemCount)
      setTotalPages(searchResult.totalPageCount)
      setCurrentPage(1)

      toast({
        title: 'Tìm kiếm hoàn tất',
        description: `Tìm thấy ${searchResult.totalItemCount} đơn hàng`,
      })
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể thực hiện tìm kiếm. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      // If search is cleared, reload all orders
      if (!value.trim()) {
        fetchOrders(1)
      }
    },
    [fetchOrders]
  )

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Debug logging
      if (!order || typeof order !== 'object') {
        return false
      }

      // If using advanced search with specific search type, don't apply additional filtering
      if (searchQuery.trim() && searchType !== 'all') {
        return true
      }

      const searchTerm = (searchQuery || '').toLowerCase()

      // Safe string handling
      const orderNumber = order.orderNumber
      const customerName = order.customer?.name
      const customerEmail = order.customer?.email

      const matchesSearch =
        !searchTerm ||
        (orderNumber ? orderNumber.toLowerCase().includes(searchTerm) : false) ||
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
  }, [orders, searchQuery, searchType, statusFilter, paymentFilter])

  const orderStats = useMemo(
    () => ({
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
    }),
    [orders]
  )

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

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Fetch order detail
  const fetchOrderDetail = async (orderId: string) => {
    try {
      setLoadingOrderDetail(true)
      const orderDetail = await orderService.getOrderById(orderId)
      setSelectedOrderDetail(orderDetail)
      setIsOrderDetailOpen(true)
    } catch (error) {
      console.error('Error fetching order detail:', error)
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoadingOrderDetail(false)
    }
  }

  // Handle update order status
  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      setLoading(true)

      let statusNumber: number
      switch (status) {
        case 'CONFIRMED':
          statusNumber = 1
          break
        case 'DELIVERED':
          statusNumber = 4
          break
        case 'CANCELLED':
          statusNumber = 5
          break
        default:
          throw new Error('Invalid status')
      }

      const response = await orderService.updateOrderStatus(orderId, statusNumber)

      if (response) {
        toast({
          title: 'Thành công',
          description: `Đã cập nhật trạng thái đơn hàng thành ${getOrderStatusLabel(statusNumber)}`,
          variant: 'default',
        })

        // Refresh orders list
        await fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="min-w-[140px]">
                            {searchType === 'all' && 'Tất cả'}
                            {searchType === 'orderId' && 'Mã đơn hàng'}
                            {searchType === 'customerName' && 'Tên khách hàng'}
                            {searchType === 'email' && 'Email'}
                            {searchType === 'date' && 'Theo ngày'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setSearchType('all')}>
                            Tất cả
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchType('orderId')}>
                            Mã đơn hàng
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchType('customerName')}>
                            Tên khách hàng
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchType('email')}>
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchType('date')}>
                            Theo ngày
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {searchType === 'date' ? (
                        <div className="flex-1 flex items-center gap-2">
                          <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="date"
                              placeholder="Chọn ngày để tìm kiếm..."
                              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                              onChange={e => {
                                if (e.target.value) {
                                  const date = new Date(e.target.value)
                                  setSelectedDate(date)
                                  handleDateSearch(date)
                                } else {
                                  setSelectedDate(undefined)
                                }
                              }}
                              max={format(new Date(), 'yyyy-MM-dd')}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder={
                              searchType === 'orderId'
                                ? 'Nhập mã đơn hàng...'
                                : searchType === 'customerName'
                                  ? 'Nhập tên khách hàng...'
                                  : searchType === 'email'
                                    ? 'Nhập email khách hàng...'
                                    : 'Tìm kiếm đơn hàng...'
                            }
                            value={searchQuery}
                            onChange={e => handleSearchInputChange(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAdvancedSearch()}
                            className="pl-10"
                          />
                        </div>
                      )}
                      {searchType !== 'date' && (
                        <Button
                          onClick={handleAdvancedSearch}
                          disabled={isSearching}
                          className="min-w-[100px]"
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Tìm kiếm
                            </>
                          )}
                        </Button>
                      )}
                      {(searchQuery || selectedDate) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedDate(undefined)
                            setSearchType('all')
                            fetchOrders(1)
                          }}
                          className="min-w-[80px]"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      )}
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

                {/* Search Results Indicator */}
                {(searchQuery || selectedDate) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {searchType === 'date' ? (
                          <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                        ) : (
                          <Search className="h-4 w-4 text-blue-600 mr-2" />
                        )}
                        <span className="text-sm text-blue-800">
                          {searchType === 'date' && selectedDate ? (
                            <>
                              Kết quả tìm kiếm đơn hàng trong ngày{' '}
                              <span className="font-medium">
                                {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}
                              </span>
                            </>
                          ) : (
                            <>
                              Kết quả tìm kiếm cho "{searchQuery}"
                              {searchType !== 'all' && (
                                <span className="font-medium">
                                  {' '}
                                  (theo{' '}
                                  {searchType === 'orderId'
                                    ? 'mã đơn hàng'
                                    : searchType === 'customerName'
                                      ? 'tên khách hàng'
                                      : searchType === 'email'
                                        ? 'email'
                                        : ''}
                                  )
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-blue-800">
                        {filteredOrders.length} đơn hàng
                      </span>
                    </div>
                  </div>
                )}

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn hàng</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Sản phẩm & Số lượng</TableHead>
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
                          <TableCell colSpan={9} className="h-24">
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="ml-2">Đang tải dữ liệu...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center">
                            Không tìm thấy đơn hàng nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map(order => (
                          <TableRow key={`order-${order.id}-${order.orderNumber}`}>
                            <TableCell>
                              <div className="font-medium">{order.orderNumber || 'Chưa có mã'}</div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customer.name}</div>
                                <div className="text-sm text-gray-500">{order.customer.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {(() => {
                                  // Try orderDetails first, then fallback to items
                                  const products =
                                    order.orderDetails && order.orderDetails.length > 0
                                      ? order.orderDetails
                                      : order.items || []

                                  if (products.length > 0) {
                                    return (
                                      <>
                                        {products.slice(0, 2).map((item: any, index: number) => (
                                          <div
                                            key={`item-${item.productId || item.id}-${index}-${order.id}`}
                                            className="text-sm mb-1"
                                          >
                                            <div className="font-medium text-gray-900">
                                              {item.product?.productName ||
                                                item.productName ||
                                                `Sản phẩm #${item.productId || item.id}`}
                                            </div>
                                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                SL: {item.quantity || 1}
                                              </span>
                                              {item.price && (
                                                <span className="text-gray-500">
                                                  {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                  }).format(item.price)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                        {products.length > 2 && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            +{products.length - 2} sản phẩm khác
                                          </div>
                                        )}
                                        <div className="text-xs text-blue-600 font-medium mt-2 pt-2 border-t border-gray-100">
                                          Tổng:{' '}
                                          {products.reduce(
                                            (sum: number, item: any) => sum + (item.quantity || 1),
                                            0
                                          )}{' '}
                                          sản phẩm
                                        </div>
                                      </>
                                    )
                                  } else {
                                    return (
                                      <div className="text-sm text-gray-500">Không có sản phẩm</div>
                                    )
                                  }
                                })()}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDateOnly(order.orderDate)}</div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => fetchOrderDetail(order.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Xem chi tiết
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Xác nhận đơn hàng
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Đánh dấu đã giao
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Hủy đơn hàng
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

      {/* Order Detail Modal */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn hàng{' '}
              {selectedOrderDetail?.orderId ? `#${selectedOrderDetail.orderId}` : ''}
            </DialogTitle>
            <DialogDescription>Thông tin chi tiết về đơn hàng và sản phẩm</DialogDescription>
          </DialogHeader>

          {loadingOrderDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải chi tiết đơn hàng...</span>
            </div>
          ) : selectedOrderDetail ? (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Mã đơn hàng:</span>
                      <span>{selectedOrderDetail.orderId || 'Chưa có mã'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tổng tiền:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatCurrency(selectedOrderDetail.totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Ngày tạo:</span>
                      <span>{formatDate(selectedOrderDetail.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Ngày cập nhật:</span>
                      <span>
                        {selectedOrderDetail.updatedAt
                          ? formatDate(selectedOrderDetail.updatedAt)
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Trạng thái:</span>
                      {getStatusBadge(selectedOrderDetail.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Địa chỉ giao hàng:</span>
                      <span className="text-right max-w-[200px]">
                        {selectedOrderDetail.shippingAddress}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin khách hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">ID khách hàng:</span>
                      <span>{selectedOrderDetail.customerId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{selectedOrderDetail.email}</span>
                    </div>
                    {selectedOrderDetail.customer && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">ID tài khoản:</span>
                          <span>{selectedOrderDetail.customer.accountId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Vai trò:</span>
                          <Badge variant="outline">
                            {selectedOrderDetail.customer.role || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Trạng thái tài khoản:</span>
                          <Badge
                            variant={
                              selectedOrderDetail.customer.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {selectedOrderDetail.customer.status || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Ngày tạo tài khoản:</span>
                          <span className="text-sm">
                            {selectedOrderDetail.customer.createdAt
                              ? formatDate(selectedOrderDetail.customer.createdAt)
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Cập nhật lần cuối:</span>
                          <span className="text-sm">
                            {selectedOrderDetail.customer.updatedAt
                              ? formatDate(selectedOrderDetail.customer.updatedAt)
                              : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sản phẩm trong đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrderDetail.orderDetails &&
                      selectedOrderDetail.orderDetails.length > 0 ? (
                        selectedOrderDetail.orderDetails.map((item, index) => (
                          <div
                            key={`detail-${item.productId}-${index}-${selectedOrderDetail.orderId}`}
                            className="p-4 border rounded-lg space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-lg">
                                  {item.product?.productName || 'N/A'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  ID sản phẩm: {item.productId}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-green-600">
                                  {formatCurrency(item.unitPrice)}
                                </p>
                                <p className="text-sm text-muted-foreground">Đơn giá</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Số lượng:</span>
                                <span className="ml-2">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="font-medium">Tồn kho:</span>
                                <span className="ml-2">{item.stockQuantity}</span>
                              </div>
                            </div>

                            {item.product && (
                              <div className="pt-2 border-t space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Mô tả:</span>
                                    <p className="text-muted-foreground mt-1">
                                      {item.product.description || 'Không có mô tả'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Trạng thái:</span>
                                    <Badge
                                      variant={
                                        item.product.status === 'active' ? 'default' : 'secondary'
                                      }
                                      className="ml-2"
                                    >
                                      {item.product.status || 'N/A'}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Ngày tạo:</span>
                                    <span className="ml-2">
                                      {item.product.createdAt
                                        ? formatDate(item.product.createdAt)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Cập nhật:</span>
                                    <span className="ml-2">
                                      {item.product.updatedAt
                                        ? formatDate(item.product.updatedAt)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Danh mục:</span>
                                    <span className="ml-2">{item.product.categoryId || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium">Kho:</span>
                                    <span className="ml-2">
                                      {item.product.inventories?.length || 0} kho
                                    </span>
                                  </div>
                                </div>

                                {item.product.images && (
                                  <div>
                                    <span className="font-medium text-sm">Hình ảnh:</span>
                                    <img
                                      src={item.product.images}
                                      alt={item.product.productName}
                                      className="mt-2 w-20 h-20 object-cover rounded border"
                                      onError={e => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          Không có sản phẩm trong đơn hàng
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrderDetail.payments && selectedOrderDetail.payments.length > 0 ? (
                      selectedOrderDetail.payments.map((payment: any, index: number) => (
                        <div
                          key={`payment-${payment.paymentId || index}-${selectedOrderDetail.orderId}`}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Thanh toán #{index + 1}</span>
                            <Badge variant="outline">{payment.status || 'N/A'}</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Phương thức:</span>
                              <span>{payment.method || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Số tiền:</span>
                              <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ngày thanh toán:</span>
                              <span>
                                {payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Chưa có thông tin thanh toán
                      </p>
                    )}

                    {/* Order Summary */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Tổng cộng:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(selectedOrderDetail.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </ManagerLayout>
  )
}

export default ManagerOrdersPage
