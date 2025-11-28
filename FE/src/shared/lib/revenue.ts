import { type Order } from '@/shared/api/orderService'

export const REVENUE_ORDER_STATUSES = [5, 6] as const

export type RevenueRelevantStatus = (typeof REVENUE_ORDER_STATUSES)[number]

export interface RevenueCalculationOptions {
  startDate?: Date
  endDate?: Date
  statuses?: number[]
}

export const normalizeDateStartOfDay = (date: Date): Date => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export const parseOrderDate = (dateString?: string | null): Date | null => {
  if (!dateString) return null
  try {
    const parsed = new Date(dateString)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

export const extractOrderTotal = (order: Order): number => {
  if (order.totalPrice !== null && order.totalPrice !== undefined) {
    const price =
      typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : Number(order.totalPrice)
    return Number.isNaN(price) ? 0 : price
  }

  if (order.orderDetails && order.orderDetails.length > 0) {
    return order.orderDetails.reduce((sum, detail) => {
      const unitPrice =
        typeof detail.unitPrice === 'string'
          ? parseFloat(detail.unitPrice)
          : Number(detail.unitPrice ?? 0)
      const quantity = Number(detail.quantity ?? 1)
      const safeUnitPrice = Number.isNaN(unitPrice) ? 0 : unitPrice
      const safeQuantity = Number.isNaN(quantity) ? 1 : quantity
      return sum + safeUnitPrice * safeQuantity
    }, 0)
  }

  return 0
}

export const calculateRevenue = (
  orders: Order[],
  options: RevenueCalculationOptions = {}
): number => {
  const { startDate, endDate, statuses = REVENUE_ORDER_STATUSES } = options
  const allowedStatuses: ReadonlyArray<number> =
    statuses.length > 0 ? statuses : REVENUE_ORDER_STATUSES

  return orders.reduce((sum, order) => {
    const status = order.status ?? 0
    if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
      return sum
    }

    const orderDate = parseOrderDate(order.createdAt)
    if (!orderDate) {
      return sum
    }

    if (startDate && orderDate < startDate) {
      return sum
    }
    if (endDate && orderDate > endDate) {
      return sum
    }

    return sum + extractOrderTotal(order)
  }, 0)
}
