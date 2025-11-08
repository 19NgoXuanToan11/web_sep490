import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal,
  Loader2,
  Calendar,
  XCircle,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
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
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { useToast } from '@/shared/ui/use-toast'
import { orderService, getOrderStatusLabel, getOrderStatusVariant } from '@/shared/api/orderService'
import type { Order as ApiOrder, OrderItem } from '@/shared/api/orderService'

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
  orderDetails?: any[]
  status: number
  orderDate: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  notes?: string
  updatedAt?: string
}

const StaffOrdersPage: React.FC = () => {
  const { toast } = useToast()
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 30

  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<
    'all' | 'orderId' | 'customerName' | 'email' | 'date'
  >('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<ApiOrder | null>(null)
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false)

  const transformApiOrder = (apiOrder: ApiOrder): DisplayOrder => {
    const email = apiOrder.email || 'N/A'
    const customerName =
      email !== 'N/A' ? email.split('@')[0].replace(/[._]/g, ' ') : 'Unknown Customer'

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

    return {
      id: String(apiOrder.orderId || ''),
      orderNumber: String(apiOrder.orderId || ''),
      customer: {
        name: customerName,
        email: email,
        phone: 'N/A',
        address: apiOrder.shippingAddress || 'N/A',
      },
      items: apiOrder.orderItems || [],
      orderDetails: apiOrder.orderItems || apiOrder.orderDetails || [],
      status: apiOrder.status ?? 0,
      orderDate: apiOrder.createdAt || new Date().toISOString(),
      totalAmount: apiOrder.totalPrice || 0,
      paymentStatus: mapPaymentStatus(apiOrder.status ?? 0),
      paymentMethod: 'N/A',
      updatedAt: apiOrder.updatedAt,
    }
  }

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
          .map((apiOrder: any) => {
            try {
              const transformed = transformApiOrder(apiOrder)
              return transformed
            } catch (error) {
              return null
            }
          })
          .filter((order): order is DisplayOrder => order !== null)

        setOrders(transformedOrders)
        setTotalItems(response.totalItemCount)
        setTotalPages(response.totalPageCount)
        setCurrentPage(response.pageIndex)
      } catch (error) {
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

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    const statusParam = status === 'all' ? undefined : parseInt(status)
    fetchOrders(1, statusParam)
  }

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab)
    let statusParam: number | undefined

    switch (tab) {
      case 'pending':
        statusParam = 0
        break
      case 'processing':
        statusParam = undefined
        break
      case 'completed':
        statusParam = 4
        break
      default:
        statusParam = undefined
    }

    fetchOrders(1, statusParam)
  }

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
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể tìm kiếm đơn hàng theo ngày. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAdvancedSearch = async () => {
    if (!searchQuery.trim()) {
      fetchOrders(1)
      return
    }

    try {
      setIsSearching(true)
      let searchResult

      switch (searchType) {
        case 'orderId':
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

            setSelectedOrderDetail(orderDetail)
            setIsOrderDetailOpen(true)
          } catch (error) {
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
          searchResult = await orderService.getOrderList({
            pageIndex: 1,
            pageSize: 50,
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
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể thực hiện tìm kiếm. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchQuery(value)

      if (!value.trim()) {
        fetchOrders(1)
      }
    },
    [fetchOrders]
  )

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order || typeof order !== 'object') {
        return false
      }

      if (searchQuery.trim() && searchType !== 'all') {
        return true
      }

      const searchTerm = (searchQuery || '').toLowerCase()

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
      failed: 'Thanh toán thất bại',
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

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setLoadingOrderDetail(true)
      const orderDetail = await orderService.getOrderById(orderId)
      setSelectedOrderDetail(orderDetail)
      setIsOrderDetailOpen(true)
    } catch (error) {
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoadingOrderDetail(false)
    }
  }

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

        await fetchOrders()
      }
    } catch (error) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeliveryStatus = async (orderId: string) => {
    try {
      setLoading(true)
      await orderService.updateDeliveryStatus(orderId)

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái đang giao hàng',
        variant: 'default',
      })

      await fetchOrders()
    } catch (error) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật trạng thái giao hàng. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteStatus = async (orderId: string) => {
    try {
      setLoading(true)
      await orderService.updateCompleteStatus(orderId)

      toast({
        title: 'Thành công',
        description: 'Đã đánh dấu đơn hàng hoàn thành',
        variant: 'default',
      })

      await fetchOrders()
    } catch (error) {
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật trạng thái hoàn thành. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelStatus = async (orderId: string) => {
    try {
      setLoading(true)
      await orderService.updateCancelStatus(orderId)

      toast({
        title: 'Thành công',
        description: 'Đã hủy đơn hàng',
        variant: 'default',
      })

      await fetchOrders()
    } catch (error) {
      toast({
        title: 'Lỗi hủy đơn',
        description: 'Không thể hủy đơn hàng. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = async (orderId: string) => {
    try {
      setLoading(true)
      await orderService.createOrderPayment(orderId)

      toast({
        title: 'Thành công',
        description: 'Đã tạo yêu cầu thanh toán lại',
        variant: 'default',
      })

      await fetchOrders()
    } catch (error) {
      toast({
        title: 'Lỗi tạo thanh toán',
        description: 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.',
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
    <StaffLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        { }
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

        { }
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4 mb-6">
          <TabsContent value="all" className="space-y-4 mt-4">
            { }
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

            { }
            {(searchQuery || selectedDate) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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
          </TabsContent>

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

        { }
        <Card>
          <CardContent className="p-0">
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
                              {order.status === 0 && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Xác nhận đơn hàng
                                </DropdownMenuItem>
                              )}
                              {(order.status === 1 || order.status === 2) && (
                                <DropdownMenuItem onClick={() => handleDeliveryStatus(order.id)}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Đánh dấu đang giao
                                </DropdownMenuItem>
                              )}
                              {order.status === 3 && (
                                <DropdownMenuItem onClick={() => handleCompleteStatus(order.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Đánh dấu hoàn thành
                                </DropdownMenuItem>
                              )}
                              { }
                              {order.status === 6 && (
                                <DropdownMenuItem onClick={() => handleCompleteStatus(order.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Hoàn thành đơn hàng
                                </DropdownMenuItem>
                              )}
                              { }
                              {order.status !== 4 && order.status !== 5 && order.status !== 6 && (
                                <DropdownMenuItem onClick={() => handleCancelStatus(order.id)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Hủy đơn hàng
                                </DropdownMenuItem>
                              )}
                              { }
                              {order.status === 4 && (
                                <DropdownMenuItem onClick={() => handleCreatePayment(order.id)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Thanh toán lại
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            { }
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4 px-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalItems)} trong tổng số {totalItems} đơn
                  hàng
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrders(1)}
                    disabled={currentPage <= 1 || loading}
                  >
                    Đầu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrders(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = []
                      const maxVisiblePages = 7
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                      if (endPage - startPage < maxVisiblePages - 1) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1)
                      }

                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant="outline"
                            size="sm"
                            onClick={() => fetchOrders(1)}
                            disabled={loading}
                          >
                            1
                          </Button>
                        )
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis-start" className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => fetchOrders(i)}
                            disabled={loading}
                          >
                            {i}
                          </Button>
                        )
                      }

                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis-end" className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant="outline"
                            size="sm"
                            onClick={() => fetchOrders(totalPages)}
                            disabled={loading}
                          >
                            {totalPages}
                          </Button>
                        )
                      }

                      return pages
                    })()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrders(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Tiếp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrders(totalPages)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Cuối
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      { }
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
              { }
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
                  </CardContent>
                </Card>
              </div>

              { }
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chi tiết sản phẩm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrderDetail.orderDetails && selectedOrderDetail.orderDetails.length > 0 ? (
                      selectedOrderDetail.orderDetails.map((item, index) => (
                        <div
                          key={`detail-${item.orderDetailId || index}`}
                          className="p-4 border rounded-lg space-y-2 bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-start gap-4">
                                { }
                                {item.product?.images && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={item.product.images}
                                      alt={item.product.productName}
                                      className="w-20 h-20 object-cover rounded border"
                                      onError={e => {
                                        e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image'
                                      }}
                                    />
                                  </div>
                                )}

                                { }
                                <div className="flex-1">
                                  <div className="font-semibold text-base mb-2">
                                    {item.product?.productName || 'N/A'}
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium">Mã sản phẩm:</span>
                                      <span className="ml-2">{item.productId}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Số lượng:</span>
                                      <span className="ml-2">{item.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Đơn giá:</span>
                                      <span className="ml-2">{formatCurrency(item.unitPrice)}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Thành tiền:</span>
                                      <span className="ml-2 font-semibold text-green-600">
                                        {formatCurrency(item.quantity * item.unitPrice)}
                                      </span>
                                    </div>
                                  </div>

                                  {item.product?.description && (
                                    <div className="mt-2">
                                      <span className="font-medium text-sm">Mô tả:</span>
                                      <p className="text-sm text-gray-600 mt-1">{item.product.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </StaffLayout>
  )
}

export default StaffOrdersPage

