import React, { useEffect, useState } from 'react'
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
  Calendar,
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
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { useToast } from '@/shared/ui/use-toast'

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  farm: {
    name: string
    owner: string
  }
  items: {
    name: string
    quantity: number
    unit: string
    price: number
  }[]
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
  orderDate: string
  deliveryDate?: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  notes?: string
}

const AdminOrdersPage: React.FC = () => {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-001',
      orderNumber: 'ORD-2024-001',
      customer: {
        name: 'Nguyễn Văn An',
        email: 'an.nguyen@email.com',
        phone: '0123456789',
        address: '123 Đường ABC, Quận 1, TP.HCM',
      },
      farm: {
        name: 'Green Valley Farm',
        owner: 'Nguyễn Văn Bình',
      },
      items: [
        { name: 'Rau xanh hữu cơ', quantity: 5, unit: 'kg', price: 50000 },
        { name: 'Cà chua cherry', quantity: 2, unit: 'kg', price: 80000 },
      ],
      status: 'confirmed',
      orderDate: '2024-01-15T08:30:00Z',
      deliveryDate: '2024-01-17T10:00:00Z',
      totalAmount: 410000,
      paymentStatus: 'paid',
      paymentMethod: 'VNPay',
      notes: 'Giao hàng buổi sáng',
    },
    {
      id: 'ord-002',
      orderNumber: 'ORD-2024-002',
      customer: {
        name: 'Trần Thị Cẩm',
        email: 'cam.tran@email.com',
        phone: '0987654321',
        address: '456 Đường XYZ, Quận 2, TP.HCM',
      },
      farm: {
        name: 'Smart Eco Farm',
        owner: 'Trần Thị Bình',
      },
      items: [
        { name: 'Thảo mộc tươi', quantity: 1, unit: 'bó', price: 25000 },
        { name: 'Rau gia vị', quantity: 3, unit: 'gói', price: 15000 },
      ],
      status: 'preparing',
      orderDate: '2024-01-15T14:20:00Z',
      totalAmount: 70000,
      paymentStatus: 'paid',
      paymentMethod: 'Momo',
    },
    {
      id: 'ord-003',
      orderNumber: 'ORD-2024-003',
      customer: {
        name: 'Lê Minh Đức',
        email: 'duc.le@email.com',
        phone: '0369852147',
        address: '789 Đường DEF, Quận 3, TP.HCM',
      },
      farm: {
        name: 'Organic Plus Farm',
        owner: 'Phạm Văn Đức',
      },
      items: [{ name: 'Cà phê hạt rang', quantity: 2, unit: 'kg', price: 350000 }],
      status: 'shipping',
      orderDate: '2024-01-14T16:45:00Z',
      deliveryDate: '2024-01-16T14:00:00Z',
      totalAmount: 700000,
      paymentStatus: 'paid',
      paymentMethod: 'Banking',
    },
    {
      id: 'ord-004',
      orderNumber: 'ORD-2024-004',
      customer: {
        name: 'Phạm Thị Hoa',
        email: 'hoa.pham@email.com',
        phone: '0147258369',
        address: '321 Đường GHI, Quận 4, TP.HCM',
      },
      farm: {
        name: 'Tech Agriculture Co.',
        owner: 'Lê Minh Cường',
      },
      items: [
        { name: 'Gạo ST25', quantity: 10, unit: 'kg', price: 45000 },
        { name: 'Ngô ngọt', quantity: 5, unit: 'bắp', price: 12000 },
      ],
      status: 'pending',
      orderDate: '2024-01-15T11:30:00Z',
      totalAmount: 510000,
      paymentStatus: 'pending',
      paymentMethod: 'COD',
      notes: 'Khách hàng yêu cầu kiểm tra hàng trước khi thanh toán',
    },
    {
      id: 'ord-005',
      orderNumber: 'ORD-2024-005',
      customer: {
        name: 'Võ Thanh Nam',
        email: 'nam.vo@email.com',
        phone: '0258963147',
        address: '654 Đường JKL, Quận 5, TP.HCM',
      },
      farm: {
        name: 'Future Farm Lab',
        owner: 'Võ Thị Hương',
      },
      items: [{ name: 'Dâu tây tươi', quantity: 3, unit: 'hộp', price: 120000 }],
      status: 'delivered',
      orderDate: '2024-01-13T09:15:00Z',
      deliveryDate: '2024-01-15T16:30:00Z',
      totalAmount: 360000,
      paymentStatus: 'paid',
      paymentMethod: 'VNPay',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('all')

  useEffect(() => {
    // Auto-refresh orders every 60 seconds
    const interval = setInterval(() => {
      // Simulate random status updates for pending orders
      setOrders(prev =>
        prev.map(order => {
          if (order.status === 'pending' && Math.random() > 0.8) {
            return { ...order, status: 'confirmed' as const }
          }
          return order
        })
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.farm.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0),
    pendingPayments: orders.filter(o => o.paymentStatus === 'pending').length,
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast({
      title: 'Dữ liệu đã được cập nhật',
      description: 'Thông tin tất cả đơn hàng đã được làm mới.',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'preparing':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'shipping':
        return <Truck className="h-4 w-4 text-orange-500" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      confirmed: 'default',
      preparing: 'secondary',
      shipping: 'secondary',
      delivered: 'default',
      cancelled: 'destructive',
    }

    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
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
    <AdminLayout>
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
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
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
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                        Tất cả
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                        Chờ xử lý
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>
                        Đã xác nhận
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('preparing')}>
                        Đang chuẩn bị
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('shipping')}>
                        Đang giao
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('delivered')}>
                        Đã giao
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
                        <TableHead>Trang trại</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thanh toán</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Ngày đặt</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => (
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
                              <div className="text-sm text-gray-500">{order.customer.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.farm.name}</div>
                              <div className="text-sm text-gray-500">{order.farm.owner}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item, index) => (
                                <div key={index} className="text-sm">
                                  {item.name} ({item.quantity} {item.unit})
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
    </AdminLayout>
  )
}

export default AdminOrdersPage
