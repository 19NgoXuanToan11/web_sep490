import { http } from './client'

// Interface matching the actual API response structure
export interface OrderItem {
  productId: string
  productName: string
  price: number
  unit: string
  stockQuantity: number
}

export interface Order {
  orderId: string
  totalPrice: number
  email: string
  orderDetailIds: string[]
  createdAt: string
  status: number // 0-6 based on API
  shippingAddress: string
  orderItems: OrderItem[]
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
  // Lấy danh sách đơn hàng với phân trang và filter
  getOrderList: async (params: OrderListParams = {}): Promise<OrderListResponse['data']> => {
    const { pageIndex = 1, pageSize = 10, status } = params

    let url = `/v1/order/order-list?pageIndex=${pageIndex}&pageSize=${pageSize}`
    if (status !== undefined) {
      url += `&status=${status}`
    }

    const response = await http.get<OrderListResponse>(url)
    return response.data.data
  },

  // Lấy chi tiết đơn hàng theo ID
  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await http.get<{ data: Order }>(`/v1/order/${orderId}`)
    return response.data.data
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId: string, status: number): Promise<Order> => {
    const response = await http.put<{ data: Order }>(`/v1/order/${orderId}/status`, { status })
    return response.data.data
  },
}

// Helper function để chuyển đổi status code sang label
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

// Helper function để chuyển đổi status code sang variant cho Badge
export const getOrderStatusVariant = (status: number): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 0: // Chờ xử lý
      return 'secondary'
    case 1: // Đã xác nhận
    case 4: // Đã giao
      return 'default'
    case 2: // Đang chuẩn bị
    case 3: // Đang giao
      return 'secondary'
    case 5: // Đã hủy
    case 6: // Hoàn trả
      return 'destructive'
    default:
      return 'secondary'
  }
}

// Helper function để lấy icon status
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
