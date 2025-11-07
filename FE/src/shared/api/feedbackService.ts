import { http } from './client'

export interface Feedback {
  feedbackId: number
  comment: string
  rating: number
  status: string
  createdAt: string
  fullName: string
  email: string
  orderDetail: {
    productId: number
    productName: string
    unitPrice: number
    quantity: number
    images?: string
  }
}

export interface FeedbackListResponse {
  status: number
  message: string
  data: {
    totalItemCount: number
    pageSize: number
    pageIndex: number
    items: Feedback[]
  }
}

export interface CreateFeedbackRequest {
  comment: string
  rating: number
  orderDetailId: number
}

export interface FeedbackListParams {
  pageIndex?: number
  pageSize?: number
}

export const feedbackService = {
  getFeedbackList: async (
    params: FeedbackListParams = {}
  ): Promise<FeedbackListResponse['data']> => {
    const { pageIndex = 1, pageSize = 10 } = params
    const url = `/v1/feedback/feed-back-list?pageIndex=${pageIndex}&pageSize=${pageSize}`

    const response = await http.get<FeedbackListResponse>(url)
    return response.data.data
  },

  createFeedback: async (feedback: CreateFeedbackRequest): Promise<any> => {
    const response = await http.post('/v1/feedback/create-feedback', feedback)
    return response.data
  },

  updateFeedback: async (feedbackId: number, feedback: CreateFeedbackRequest): Promise<any> => {
    const response = await http.post(`/v1/feedback/update-feedback/${feedbackId}`, feedback)
    return response.data
  },

  updateFeedbackStatus: async (feedbackId: number): Promise<any> => {
    const response = await http.post(`/v1/feedback/update-feedback-status/${feedbackId}`, {})
    return response.data
  },

  getFeedbackByProductId: async (productId: number): Promise<Feedback[]> => {
    const response = await http.get<{ data: Feedback[] }>(
      `/v1/feedback/feedback-by-product/${productId}`
    )
    return response.data.data
  },

  getFeedbackByOrderId: async (orderId: number): Promise<Feedback[]> => {
    const response = await http.get<{ data: Feedback[] }>(
      `/v1/feedback/feedback-by-order/${orderId}`
    )
    return response.data.data
  },

  getFeedbackByOrderDetailId: async (orderDetailId: number): Promise<Feedback[]> => {
    const response = await http.get<{ data: Feedback[] }>(
      `/v1/feedback/feedback-by-order-detail/${orderDetailId}`
    )
    return response.data.data
  },
}
