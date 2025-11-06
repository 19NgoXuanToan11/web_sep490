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
  email: string
  customerId?: string
  orderDetailIds: string[]
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

  getOrdersByDate: async (
    date: string,
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<OrderListResponse['data']> => {
    const response = await http.post<OrderListResponse>(
      `/v1/order/order-list-by-date?pageIndex=${pageIndex}&pageSize=${pageSize}`,
      date
    )
    return response.data.data
  },

  updateOrderStatus: async (orderId: string, status: string | number): Promise<Order> => {
    const response = await http.put<{ data: Order }>(`/v1/order/${orderId}/status`, { status })
    return response.data.data
  },

  updateDeliveryStatus: async (orderId: string): Promise<any> => {
    const response = await http.put(`/v1/order/updateDeliveryStatus/${orderId}`)
    return response.data
  },

  updateCancelStatus: async (orderId: string): Promise<any> => {
    const response = await http.put(`/v1/order/updateCancelStatus/${orderId}`)
    return response.data
  },
}

export const getOrderStatusLabel = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: 'Chờ xử lý',
    1: 'Đã xác nhận',
    2: 'Đang chuẩn bị',
    3: 'Đang giao',
    4: 'Đã giao',
    5: 'Đã hủy',
    6: 'Hoàn trả',
  }
  return statusMap[status] || 'Không xác định'
}

export const getOrderStatusVariant = (status: number): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 0:
      return 'secondary'
    case 1:
    case 4:
      return 'default'
    case 2:
    case 3:
      return 'secondary'
    case 5:
    case 6:
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
      return 'check-circle'
    case 5:
    case 6:
      return 'alert-triangle'
    default:
      return 'shopping-cart'
  }
}
