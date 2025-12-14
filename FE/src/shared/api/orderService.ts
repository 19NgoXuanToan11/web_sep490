import { http } from './client'

export interface OrderItem {
  productId: string
  productName: string
  price: number
  unit: string
  stockQuantity: number
}

export interface Product {
  productId: string
  productName: string
  images: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
  categoryId: string
  inventories: any[]
}

export interface OrderDetail {
  orderDetailId: string
  quantity: number
  unitPrice: number
  productId: string
  stockQuantity: number
  product?: Product
}

export interface Customer {
  accountId: string
  email: string
  passwordHash: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  paymentId: string
  amount: number
  method: string
  status: string
  createdAt: string
}

export interface Order {
  orderId: string
  totalPrice: number
  email?: string 
  customerId?: string
  orderDetailIds?: string[]
  createdAt: string
  updatedAt?: string
  status: number
  shippingAddress: string
  orderItems?: OrderItem[]
  orderDetails?: OrderDetail[]
  customer?: Customer
  payments?: Payment[]
}

export interface OrderListResponse {
  status: number
  message: string
  data: {
    totalItemCount: number
    pageSize: number
    totalPageCount: number
    pageIndex: number
    next: boolean
    previous: boolean
    items: Order[]
  }
}

export interface OrderListParams {
  pageIndex?: number
  pageSize?: number
  status?: number
}

export const orderService = {
  getOrderList: async (params: OrderListParams = {}): Promise<OrderListResponse['data']> => {
    const { pageIndex = 1, pageSize = 10, status } = params

    let url = `/v1/order/order-list?pageIndex=${pageIndex}&pageSize=${pageSize}`
    if (status !== undefined) {
      url += `&status=${status}`
    }

    const response = await http.get<OrderListResponse>(url)
    return response.data.data
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await http.get<{ data: Order }>(`/v1/order/order/${orderId}`)
    return response.data.data
  },

  getOrdersByCustomerName: async (name: string): Promise<OrderListResponse['data']> => {
    const response = await http.get<OrderListResponse>(
      `/v1/order/order-list-by-customer-name/${encodeURIComponent(name)}`
    )
    return response.data.data
  },

  getOrdersByEmail: async (email: string): Promise<OrderListResponse['data']> => {
    const response = await http.get<OrderListResponse>(
      `/v1/order/order-list-by-email/${encodeURIComponent(email)}`
    )
    return response.data.data
  },

  getOrdersByCustomerId: async (customerId: string): Promise<OrderListResponse['data']> => {
    const response = await http.get<OrderListResponse>(
      `/v1/order/order-list-by-customer/${encodeURIComponent(customerId)}`
    )
    return response.data.data
  },

  getOrdersByDate: async (
    date: string,
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<OrderListResponse['data']> => {
    try {
      const response = await http.post<{ status: number; message: string; data: Order[] }>(
        `/v1/order/order-list-by-date?pageIndex=${pageIndex}&pageSize=${pageSize}`,
        date
      )

      const orders = Array.isArray(response.data.data) ? response.data.data : []

      return {
        items: orders,
        totalItemCount: orders.length,
        totalPageCount: Math.ceil(orders.length / pageSize) || 1,
        pageIndex: pageIndex,
        pageSize: pageSize,
        next: false,
        previous: pageIndex > 1,
      }
    } catch (error) {
      console.error('Error in getOrdersByDate:', error)
      throw error
    }
  },

  updateOrderStatus: async (orderId: string, status: string | number): Promise<Order> => {
    const response = await http.put<{ data: Order }>(`/v1/order/${orderId}/status`, { status })
    return response.data.data
  },

  updateDeliveryStatus: async (orderId: string): Promise<any> => {
    const response = await http.put(`/v1/order/updateDeliveryStatus/${orderId}`)
    return response.data
  },

  updateCompleteStatus: async (orderId: string): Promise<any> => {
    const response = await http.put(`/v1/order/updateCompletedStatus/${orderId}`)
    return response.data
  },

  updateCancelStatus: async (orderId: string): Promise<any> => {
    const response = await http.put(`/v1/order/updateCancelStatus/${orderId}`)
    return response.data
  },

  createOrderPayment: async (orderId: string): Promise<any> => {
    const response = await http.post(`/v1/order/createOrderPayment/${orderId}`)
    return response.data
  },
}

export const normalizeOrderStatus = (status: any): number => {
  if (typeof status === 'number' && !Number.isNaN(status)) {
    return status
  }

  const raw = String(status || '')
    .trim()
    .toUpperCase()

  switch (raw) {
    case 'ACTIVE':
    case 'PAID':
    case 'CONFIRMED':
    case 'CONFIRM':
    case 'PAYMENT_SUCCESS':
      return 1
    case 'PROCESSING':
    case 'PROCESS':
    case 'PREPARING':
    case 'PACKING':
      return 2
    case 'PENDING':
    case 'WAITING':
    case 'UNPAID':
      return 0
    case 'SHIPPING':
    case 'DELIVERING':
    case 'DELIVERED':
    case 'IN_DELIVERY':
      return 6
    case 'COMPLETED':
    case 'DONE':
      return 5
    case 'CANCELLED':
    case 'CANCELED':
    case 'CANCEL':
      return 4
    case 'FAILED':
    case 'FAIL':
    case 'PAYMENT_FAILED':
      return 2
    case 'REFUNDED':
      return 4
    default:
      return 0
  }
}

export const derivePaymentStatus = (
  order: Partial<Order> & { status?: number }
): 'pending' | 'paid' | 'failed' | 'refunded' => {
  const paymentStatusRaw = order.payments?.find(p => p.status)?.status
  const paymentStatus = paymentStatusRaw ? String(paymentStatusRaw).toUpperCase() : undefined

  switch (paymentStatus) {
    case 'SUCCESS':
    case 'PAID':
    case 'COMPLETED':
    case 'DONE':
      return 'paid'
    case 'FAILED':
    case 'FAIL':
    case 'CANCELLED':
    case 'CANCELED':
    case 'DECLINED':
      return 'failed'
    case 'REFUNDED':
      return 'refunded'
    default:
      break
  }

  const status = order.status ?? 0

  switch (status) {
    case 1:
    case 5:
    case 6:
      return 'paid'
    case 4:
      return 'refunded'
    case 2:
      return 'failed'
    default:
      return 'pending'
  }
}

export const getOrderStatusLabel = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Chờ xử lý', 
    1: 'Đã xác nhận', 
    2: 'Thất bại', 
    3: 'Đang giao', 
    4: 'Đã hủy', 
    5: 'Hoàn thành', 
    6: 'Đang giao', 
  }
  return statusMap[status] || 'Không xác định'
}

export const getOrderStatusVariant = (status: number): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 0: 
    case 2: 
    case 3: 
    case 6: 
      return 'secondary'
    case 1: 
    case 5: 
      return 'default'
    case 4: 
      return 'destructive'
    default:
      return 'secondary'
  }
}

export const getOrderStatusIcon = (status: number): string => {
  switch (status) {
    case 0: 
      return 'clock'
    case 1: 
      return 'check-circle'
    case 2: 
      return 'package'
    case 3: 
      return 'truck'
    case 4: 
      return 'alert-triangle'
    case 5: 
      return 'check-circle'
    case 6: 
      return 'truck'
    default:
      return 'shopping-cart'
  }
}
