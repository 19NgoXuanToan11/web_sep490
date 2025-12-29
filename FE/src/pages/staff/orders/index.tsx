import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { CheckCircle, RefreshCw, Search, MoreHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { StaffDataTable, type StaffDataTableColumn } from '@/shared/ui/staff-data-table'
import { formatDate } from '@/shared/lib/date-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Tabs, TabsContent } from '@/shared/ui/tabs'
import { StaffLayout } from '@/shared/layouts/StaffLayout'
import { ManagementPageHeader, StaffFilterBar } from '@/shared/ui'
import { useToast } from '@/shared/ui/use-toast'
import {
  orderService,
  getOrderStatusLabel,
  getOrderStatusVariant,
  normalizeOrderStatus,
  derivePaymentStatus,
} from '@/shared/api/orderService'
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

type ApiOrderWithFullname = ApiOrder & {
  fullname?: string
}

const StaffOrdersPage: React.FC = () => {
  const { toast } = useToast()
  const [orders, setOrders] = useState<DisplayOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const pageSize = 10

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')


  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<ApiOrder | null>(null)
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false)
  const [maxOrderId, setMaxOrderId] = useState<number>(0)

  const transformApiOrder = (apiOrder: ApiOrderWithFullname): DisplayOrder => {
    const email = apiOrder.customer?.email || apiOrder.email || 'N/A'
    const normalizedStatus = normalizeOrderStatus(apiOrder.status)
    const paymentStatus = derivePaymentStatus({
      status: normalizedStatus,
      payments: apiOrder.payments,
    })

    const customerName =
      apiOrder.fullname ||
      (email !== 'N/A' ? email.split('@')[0].replace(/[._]/g, ' ') : 'Unknown Customer')

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
      status: normalizedStatus,
      orderDate: apiOrder.createdAt || new Date().toISOString(),
      totalAmount: apiOrder.totalPrice || 0,
      paymentStatus,
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
        setTotalPages(Math.max(1, Math.ceil((response.totalItemCount || 0) / pageSize)))
        setCurrentPage(response.pageIndex)

        if (page === 1 && transformedOrders.length > 0) {
          const maxId = Math.max(...transformedOrders.map(o => parseInt(o.id) || 0))
          setMaxOrderId(prevMax => Math.max(prevMax, maxId))
        }
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

  useEffect(() => {
    if (searchQuery.trim()) {
      return
    }

    const checkForNewOrders = async () => {
      try {
        const response = await orderService.getOrderList({
          pageIndex: 1,
          pageSize: 1,
        })

        if (response.items?.length) {
          const latestOrderId = parseInt(String(response.items[0].orderId || 0))

          if (latestOrderId > maxOrderId && maxOrderId > 0) {
            await fetchOrders(currentPage)

            toast({
              title: 'Có đơn hàng mới',
              description: 'Danh sách đơn hàng đã được cập nhật.',
            })
          } else if (maxOrderId === 0 && latestOrderId > 0) {
            setMaxOrderId(latestOrderId)
          }
        }
      } catch (error) {
        console.error('Error checking for new orders:', error)
      }
    }

    const intervalId = window.setInterval(checkForNewOrders, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [maxOrderId, currentPage, statusFilter, searchQuery, fetchOrders, toast])

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
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
        statusParam = 5
        break
      case 'cancelled':
        statusParam = 4
        break
      default:
        statusParam = undefined
    }

    fetchOrders(1, statusParam)
  }

  const handleAdvancedSearch = async () => {
    if (!searchQuery.trim()) {
      fetchOrders(1)
      return
    }

    try {
      let searchResult

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

      if (!searchResult || !searchResult.items) {
        throw new Error('Invalid search result format')
      }

      const transformedOrders = searchResult.items.map(transformApiOrder)
      setOrders(transformedOrders)
      const total = searchResult.totalItemCount || 0
      setTotalItems(total)
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)))
      setCurrentPage(1)

      toast({
        title: 'Tìm kiếm hoàn tất',
        description: `Tìm thấy ${searchResult.totalItemCount || 0} đơn hàng`,
      })
    } catch (error) {
      toast({
        title: 'Lỗi tìm kiếm',
        description: 'Không thể thực hiện tìm kiếm. Vui lòng thử lại.',
        variant: 'destructive',
      })
      console.error('Search error:', error)
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

      if (searchQuery.trim()) {
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

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === '3'
          ? [3, 6].includes(order.status)
          : order.status?.toString() === statusFilter)
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [orders, searchQuery, statusFilter, paymentFilter])

  const orderStats = useMemo(
    () => ({
      total: totalItems || orders.length,
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
    [orders, totalItems]
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

  const getStatusBadge = (status: number, paymentStatus?: string) => {
    let label = getOrderStatusLabel(status)
    let variant = getOrderStatusVariant(status)

    if (paymentStatus === 'failed' && status === 2) {
      label = 'Thất bại'
      variant = 'destructive'
    }

    return <Badge variant={variant}>{label}</Badge>
  }

  const getDisplayStatusBadge = (order: DisplayOrder) => {
    return getStatusBadge(order.status, order.paymentStatus)
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

  const formatDateOnly = (dateString: string) => {
    return formatDate(dateString)
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
          variant: 'success',
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
        variant: 'success',
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
        variant: 'success',
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
        variant: 'success',
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


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <StaffLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ManagementPageHeader
          className="mb-8"
          title="Quản lý đơn hàng"
          description="Giám sát và quản lý tất cả đơn hàng trong hệ thống"
          actions={
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              Làm mới
            </Button>
          }
        />

        { }
        <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                  <p className="text-2xl font-semibold mt-1">{orderStats.total}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Toàn bộ đơn hàng mà bạn có quyền xem trong hệ thống
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cần xử lý</p>
                  <p className="text-2xl font-semibold mt-1 text-orange-600">
                    {orderStats.pending + orderStats.confirmed + orderStats.preparing}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Gồm đơn chưa thanh toán, đã xác nhận và đang chuẩn bị
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Đang giao</p>
                  <p className="text-2xl font-semibold mt-1 text-green-600">{orderStats.shipping}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Đơn hàng đã xuất kho và đang trên đường giao cho khách
              </p>
            </CardContent>
          </Card>
        </div>

        { }
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4 mb-6">
          <TabsContent value="all" className="space-y-4 mt-4">
            <StaffFilterBar>
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nhập mã đơn hàng..."
                      value={searchQuery}
                      onChange={e => handleSearchInputChange(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleAdvancedSearch()}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('')
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
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="1">{getOrderStatusLabel(1)}</SelectItem>
                    <SelectItem value="3">{getOrderStatusLabel(3)}</SelectItem>
                    <SelectItem value="4">{getOrderStatusLabel(4)}</SelectItem>
                    <SelectItem value="5">{getOrderStatusLabel(5)}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </StaffFilterBar>

            { }
            {searchQuery && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Search className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-800">
                      Kết quả tìm kiếm cho "{searchQuery}" (theo mã đơn hàng)
                    </span>
                  </div>
                  <span className="text-sm font-medium text-green-800">
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

          <TabsContent value="cancelled">
            <div className="text-center py-8 text-gray-500">
              Hiển thị các đơn hàng đã hủy ({orderStats.cancelled} đơn)
            </div>
          </TabsContent>
        </Tabs>

        { }
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                <StaffDataTable<DisplayOrder>
                  className="px-4 sm:px-6 pb-6"
                  data={filteredOrders}
                  getRowKey={order => `${order.id}-${order.orderNumber}`}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onPageChange={page => fetchOrders(page)}
                  emptyTitle="Không tìm thấy đơn hàng nào"
                  emptyDescription="Không có đơn hàng nào phù hợp với điều kiện lọc hiện tại."
                  columns={[
                    {
                      id: 'orderNumber',
                      header: 'Mã đơn hàng',
                      render: order => (
                        <div className="font-medium">{order.orderNumber || 'Chưa có mã'}</div>
                      ),
                    },
                    {
                      id: 'customer',
                      header: 'Khách hàng',
                      render: order => (
                        <div>
                          <div className="font-medium">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      ),
                    },
                    {
                      id: 'products',
                      header: 'Sản phẩm & Số lượng',
                      render: order => {
                        const products =
                          order.orderDetails && order.orderDetails.length > 0
                            ? order.orderDetails
                            : order.items || []

                        if (products.length === 0) {
                          return <div className="text-sm text-gray-500">Không có sản phẩm</div>
                        }

                        return (
                          <div className="space-y-1">
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
                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
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
                            <div className="text-xs text-green-600 font-medium mt-2 pt-2 border-t border-gray-100">
                              Tổng:{' '}
                              {products.reduce(
                                (sum: number, item: any) => sum + (item.quantity || 1),
                                0,
                              )}{' '}
                              sản phẩm
                            </div>
                          </div>
                        )
                      },
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      render: order => getDisplayStatusBadge(order),
                    },
                    {
                      id: 'payment',
                      header: 'Thanh toán',
                      render: order => getPaymentBadge(order.paymentStatus),
                    },
                    {
                      id: 'total',
                      header: 'Tổng tiền',
                      render: order => (
                        <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                      ),
                    },
                    {
                      id: 'date',
                      header: 'Ngày đặt',
                      render: order => (
                        <div className="text-sm">{formatDateOnly(order.orderDate)}</div>
                      ),
                    },
                    {
                      id: 'actions',
                      header: '',
                      render: order => {
                        const isFailedPayment = order.paymentStatus === 'failed' && order.status === 2
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {isFailedPayment ? (
                                <>
                                  <DropdownMenuItem onClick={() => fetchOrderDetail(order.id)}>
                                    Xem chi tiết
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => fetchOrderDetail(order.id)}>
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
                                      Đánh dấu đang giao
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 3 && (
                                    <DropdownMenuItem onClick={() => handleCompleteStatus(order.id)}>
                                      Đánh dấu hoàn thành
                                    </DropdownMenuItem>
                                  )}
                                  {order.status === 6 && (
                                    <DropdownMenuItem onClick={() => handleCompleteStatus(order.id)}>
                                      Hoàn thành đơn hàng
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== 4 && order.status !== 5 && order.status !== 6 && (
                                    <DropdownMenuItem onClick={() => handleCancelStatus(order.id)}>
                                      Hủy đơn hàng
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )
                      },
                    },
                  ] satisfies StaffDataTableColumn<DisplayOrder>[]}
                />
              </>
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
          </DialogHeader>

          {loadingOrderDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải chi tiết đơn hàng...</span>
            </div>
          ) : selectedOrderDetail ? (
            <div className="space-y-6">
              { }
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">Mã đơn hàng:</span>
                    <span>{selectedOrderDetail.orderId || 'Chưa có mã'}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">Tổng tiền:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(selectedOrderDetail.totalPrice)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">Ngày đặt:</span>
                    <span>{formatDateOnly(selectedOrderDetail.createdAt)}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">Trạng thái:</span>
                    {getStatusBadge(
                      normalizeOrderStatus(selectedOrderDetail.status),
                      derivePaymentStatus({
                        status: normalizeOrderStatus(selectedOrderDetail.status),
                        payments: selectedOrderDetail.payments,
                      })
                    )}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">Email khách hàng:</span>
                    <span className="text-sm text-gray-700">
                      {selectedOrderDetail.customer?.email || selectedOrderDetail.email || 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <span className="font-medium">Địa chỉ giao hàng:</span>
                    <span className="text-sm text-gray-700 whitespace-pre-line sm:max-w-[70%] text-right sm:text-left">
                      {selectedOrderDetail.shippingAddress || 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

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

