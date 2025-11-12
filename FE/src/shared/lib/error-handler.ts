import {
  HTTP_ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGES,
  APP_ERROR_MESSAGES,
  ENGLISH_TO_VIETNAMESE_PATTERNS,
  DEFAULT_ERROR_MESSAGE,
  type ErrorMessage
} from './error-messages'

interface ToastFunction {
  (options: { title: string; description?: string; variant?: 'default' | 'destructive' }): void
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

// Enhanced error mapping function
export const mapErrorToVietnamese = (error: unknown, context?: ErrorContext): ErrorMessage => {
  let errorMessage = DEFAULT_ERROR_MESSAGE
  let originalMessage = ''

  // Extract error information
  if (error instanceof Error) {
    originalMessage = error.message
    const apiError = error as ApiError

    // Check for HTTP status codes first
    if (apiError.status && HTTP_ERROR_MESSAGES[apiError.status]) {
      errorMessage = HTTP_ERROR_MESSAGES[apiError.status]
    }
    // Check for network errors
    else if (originalMessage.toLowerCase().includes('network')) {
      errorMessage = NETWORK_ERROR_MESSAGES.NETWORK_ERROR
    }
    else if (originalMessage.toLowerCase().includes('timeout')) {
      errorMessage = NETWORK_ERROR_MESSAGES.TIMEOUT_ERROR
    }
    else if (originalMessage.toLowerCase().includes('abort')) {
      errorMessage = NETWORK_ERROR_MESSAGES.ABORT_ERROR
    }
    // Check for application-specific errors
    else {
      // Try to match against known app error patterns
      for (const [key, appError] of Object.entries(APP_ERROR_MESSAGES)) {
        if (originalMessage.toLowerCase().includes(key.toLowerCase().replace(/_/g, ' '))) {
          errorMessage = appError
          break
        }
      }

      // If no app error matched, try English patterns
      if (errorMessage === DEFAULT_ERROR_MESSAGE) {
        for (const pattern of ENGLISH_TO_VIETNAMESE_PATTERNS) {
          if (pattern.pattern.test(originalMessage)) {
            errorMessage = {
              code: 'PATTERN_MATCHED',
              vietnamese: pattern.vietnamese,
              context: pattern.context
            }
            break
          }
        }
      }
    }
  }
  // Handle non-Error objects
  else if (typeof error === 'string') {
    originalMessage = error
    // Try to match string errors against patterns
    for (const pattern of ENGLISH_TO_VIETNAMESE_PATTERNS) {
      if (pattern.pattern.test(originalMessage)) {
        errorMessage = {
          code: 'PATTERN_MATCHED',
          vietnamese: pattern.vietnamese,
          context: pattern.context
        }
        break
      }
    }
  }

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Handler Debug')
    console.log('Original Error:', error)
    console.log('Original Message:', originalMessage)
    console.log('Mapped Message:', errorMessage)
    console.log('Context:', context)
    console.groupEnd()
  }

  return errorMessage
}

// Enhanced API error handler
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

// Success message handler
export const handleApiSuccess = (message: string, toast?: ToastFunction) => {
  if (toast) {
    toast({
      title: 'Thành công',
      description: message,
      variant: 'default',
    })
  }
}

// Specific error handlers for common operations
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

// Validation error handler
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

// Authentication error handler
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
