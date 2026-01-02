import { toast } from 'sonner'

interface BackendResponse {
  status?: number
  message?: string
  Message?: string
  error?: string
  Error?: string
  detail?: string
  title?: string
  msg?: string
  [key: string]: any
}

const extractBackendMessage = (response: BackendResponse): string | null => {
  if (!response) return null

  const messageCandidates = [
    response.message,
    response.Message,
    response.error,
    response.Error,
    response.detail,
    response.title,
    response.msg,
  ]

  for (const candidate of messageCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

const extractErrorMessage = (error: unknown): string | null => {
  if (!error) return null

  const anyErr = error as any
  const tryPayload = anyErr?.data ?? anyErr?.response?.data ?? anyErr

  const message = extractBackendMessage(tryPayload)
  if (message) return message

  if (error instanceof Error && typeof error.message === 'string') {
    const msg = error.message
    const parts = msg.split(':')
    if (parts.length > 1) {
      const tail = parts.slice(1).join(':').trim()
      if (tail) return tail
    }
    if (msg.trim()) return msg.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return null
}

export const showSuccessToast = (response: BackendResponse) => {
  const message = extractBackendMessage(response)
  if (message) {
    toast.success(message, {
      duration: 5000,
      style: {
        background: '#16A34A',
        color: '#FFFFFF',
        maxWidth: '420px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      icon: undefined as unknown as string,
    })
  }
}

export const showErrorToast = (error: unknown) => {
  const message = extractErrorMessage(error)
  if (message) {
    toast.error(message, {
      duration: 5000,
      style: {
        background: '#DC2626',
        color: '#FFFFFF',
        maxWidth: '420px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      icon: undefined as unknown as string,
    })
  }
}

export const withBackendToast = async <T = void>(
  apiCall: () => Promise<T>,
  options?: {
    onSuccess?: (response: T) => void
    onError?: (error: unknown) => void
  }
): Promise<T> => {
  try {
    const response = await apiCall()

    if (response && typeof response === 'object' && 'message' in response) {
      const backendResponse = response as BackendResponse
      const message = extractBackendMessage(backendResponse)
      if (message) {
        showSuccessToast(backendResponse)
      }
    }

    options?.onSuccess?.(response)
    return response
  } catch (error) {
    showErrorToast(error)
    options?.onError?.(error)
    throw error
  }
}

export const toastManager = {
  success: (message: string) =>
    toast.success(message, {
      duration: 5000,
      style: {
        background: '#16A34A',
        color: '#FFFFFF',
        maxWidth: '420px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      icon: undefined as unknown as string,
    }),
  error: (message: string) =>
    toast.error(message, {
      duration: 5000,
      style: {
        background: '#DC2626',
        color: '#FFFFFF',
        maxWidth: '420px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      icon: undefined as unknown as string,
    }),
  info: (message: string) =>
    toast(message, {
      duration: 5000,
      style: {
        maxWidth: '420px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      icon: undefined as unknown as string,
    }),
  warning: (message: string) =>
    toast(message, {
      duration: 5000,
      style: {
        maxWidth: '420px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      },
      icon: undefined as unknown as string,
    }),
}
