import { useToast } from '@/shared/ui/use-toast'
import { normalizeError } from './error-handler'

interface BackendResponse {
  status?: number
  message?: string
}

export const showSuccessToast = (response: BackendResponse, fallbackToast?: () => void) => {
  if (response.message?.trim()) {
    const { toast } = useToast()
    toast({
      title: response.message,
      variant: 'success',
    })
  } else if (fallbackToast) {
    fallbackToast()
  }
}

export const showErrorToast = (error: unknown, fallbackToast?: () => void) => {
  const normalized = normalizeError(error)
  if (normalized.backendMessage) {
    const { toast } = useToast()
    toast({
      title: normalized.backendMessage,
      variant: 'destructive',
    })
  } else if (fallbackToast) {
    fallbackToast()
  }
}

export const withBackendToast = async <T = void>(
  apiCall: () => Promise<T>,
  options?: {
    onSuccess?: (response: T) => void
    onError?: (error: unknown) => void
    fallbackSuccessToast?: () => void
    fallbackErrorToast?: () => void
  }
): Promise<T> => {
  try {
    const response = await apiCall()
    if (response && typeof response === 'object' && 'message' in response) {
      showSuccessToast(response as BackendResponse, options?.fallbackSuccessToast)
    } else if (options?.fallbackSuccessToast) {
      options.fallbackSuccessToast()
    }
    options?.onSuccess?.(response)
    return response
  } catch (error) {
    showErrorToast(error, options?.fallbackErrorToast)
    options?.onError?.(error)
    throw error
  }
}
