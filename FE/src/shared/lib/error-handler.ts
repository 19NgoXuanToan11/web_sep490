import {
  HTTP_ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGES,
  APP_ERROR_MESSAGES,
  ENGLISH_TO_VIETNAMESE_PATTERNS,
  DEFAULT_ERROR_MESSAGE,
  type ErrorMessage,
} from './error-messages'
import type { ToastProps } from '@/shared/ui/toast'

type ToastVariant = ToastProps['variant']

interface ToastFunction {
  (options: { title: string; description?: string; variant?: ToastVariant }): void
}

interface ApiError extends Error {
  status?: number
  data?: any
}

interface ErrorContext {
  operation?: string
  component?: string
  userId?: string
  timestamp?: string
}

export const mapErrorToVietnamese = (error: unknown, _context?: ErrorContext): ErrorMessage => {
  let errorMessage = DEFAULT_ERROR_MESSAGE
  let originalMessage = ''

  if (error instanceof Error) {
    originalMessage = error.message
    const apiError = error as ApiError

    if (apiError.status && HTTP_ERROR_MESSAGES[apiError.status]) {
      errorMessage = HTTP_ERROR_MESSAGES[apiError.status]
    }
    else if (originalMessage.toLowerCase().includes('network')) {
      errorMessage = NETWORK_ERROR_MESSAGES.NETWORK_ERROR
    } else if (originalMessage.toLowerCase().includes('timeout')) {
      errorMessage = NETWORK_ERROR_MESSAGES.TIMEOUT_ERROR
    } else if (originalMessage.toLowerCase().includes('abort')) {
      errorMessage = NETWORK_ERROR_MESSAGES.ABORT_ERROR
    }
    else {
      for (const [key, appError] of Object.entries(APP_ERROR_MESSAGES)) {
        if (originalMessage.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' '))) {
          errorMessage = appError
          break
        }
      }

      if (errorMessage === DEFAULT_ERROR_MESSAGE) {
        for (const pattern of ENGLISH_TO_VIETNAMESE_PATTERNS) {
          if (pattern.pattern.test(originalMessage)) {
            errorMessage = {
              code: 'PATTERN_MATCHED',
              vietnamese: pattern.vietnamese,
              context: pattern.context,
            }
            break
          }
        }
      }
    }
  }
  else if (typeof error === 'string') {
    originalMessage = error
    for (const pattern of ENGLISH_TO_VIETNAMESE_PATTERNS) {
      if (pattern.pattern.test(originalMessage)) {
        errorMessage = {
          code: 'PATTERN_MATCHED',
          vietnamese: pattern.vietnamese,
          context: pattern.context,
        }
        break
      }
    }
  }

  return errorMessage
}

export const handleApiError = (error: unknown, toast?: ToastFunction, context?: ErrorContext) => {
  const errorMessage = mapErrorToVietnamese(error, context)

  if (toast) {
    toast({
      title: 'Lỗi',
      description: errorMessage.vietnamese,
      variant: 'destructive',
    })
  }

  return errorMessage.vietnamese
}

export const handleApiSuccess = (message: string, toast?: ToastFunction) => {
  if (toast) {
    toast({
      title: 'Thành công',
      description: message,
      variant: 'success',
    })
  }
}

export const handleFetchError = (error: unknown, toast?: ToastFunction, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const contextualMessage = resourceName
    ? `Không thể tải ${resourceName.toLowerCase()}. ${errorMessage.vietnamese}`
    : errorMessage.vietnamese

  if (toast) {
    toast({
      title: 'Lỗi tải dữ liệu',
      description: contextualMessage,
      variant: 'destructive',
    })
  }

  return contextualMessage
}

export const handleCreateError = (error: unknown, toast?: ToastFunction, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const contextualMessage = resourceName
    ? `Không thể tạo ${resourceName.toLowerCase()}. ${errorMessage.vietnamese}`
    : errorMessage.vietnamese

  if (toast) {
    toast({
      title: 'Lỗi tạo mới',
      description: contextualMessage,
      variant: 'destructive',
    })
  }

  return contextualMessage
}

export const handleUpdateError = (error: unknown, toast?: ToastFunction, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const contextualMessage = resourceName
    ? `Không thể cập nhật ${resourceName.toLowerCase()}. ${errorMessage.vietnamese}`
    : errorMessage.vietnamese

  if (toast) {
    toast({
      title: 'Lỗi cập nhật',
      description: contextualMessage,
      variant: 'destructive',
    })
  }

  return contextualMessage
}

export const handleDeleteError = (error: unknown, toast?: ToastFunction, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const contextualMessage = resourceName
    ? `Không thể xóa ${resourceName.toLowerCase()}. ${errorMessage.vietnamese}`
    : errorMessage.vietnamese

  if (toast) {
    toast({
      title: 'Lỗi xóa',
      description: contextualMessage,
      variant: 'destructive',
    })
  }

  return contextualMessage
}

export const handleValidationError = (error: unknown, toast?: ToastFunction) => {
  const errorMessage = mapErrorToVietnamese(error)

  if (toast) {
    toast({
      title: 'Lỗi xác thực',
      description: errorMessage.vietnamese,
      variant: 'destructive',
    })
  }

  return errorMessage.vietnamese
}

export const handleAuthError = (error: unknown, toast?: ToastFunction) => {
  const errorMessage = mapErrorToVietnamese(error)

  if (toast) {
    toast({
      title: 'Lỗi xác thực',
      description: errorMessage.vietnamese,
      variant: 'destructive',
    })
  }

  return errorMessage.vietnamese
}
