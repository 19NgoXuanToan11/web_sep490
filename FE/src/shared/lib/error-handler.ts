import {
  HTTP_ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGES,
  APP_ERROR_MESSAGES,
  ENGLISH_TO_VIETNAMESE_PATTERNS,
  DEFAULT_ERROR_MESSAGE,
  type ErrorMessage,
} from './error-messages'

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

export interface NormalizedError {
  backendMessage: string | null
  fieldErrors: Record<string, string[]>
  status?: number | null
  code?: string | number | null
  traceId?: string | null
  raw?: any
}

const coerceToStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string') as string[]
  if (typeof value === 'string') return [value]
  return []
}

const normalizeFieldKey = (rawKey: string): string => {
  if (!rawKey || typeof rawKey !== 'string') return rawKey
  const parts = rawKey.split('.')
  let key = parts[parts.length - 1]
  key = key.replace(/\[\d+\]$/, '')
  return key.charAt(0).toLowerCase() + key.slice(1)
}

export const normalizeError = (error: unknown): NormalizedError => {
  const normalized: NormalizedError = {
    backendMessage: null,
    fieldErrors: {},
    status: null,
    code: null,
    traceId: null,
    raw: error,
  }

  if (!error) return normalized

  const anyErr = error as any

  const tryPayload = anyErr?.data ?? anyErr?.response?.data ?? anyErr

  normalized.status =
    anyErr?.status ?? anyErr?.response?.status ?? (tryPayload && tryPayload.status) ?? null
  normalized.code =
    (tryPayload && (tryPayload.code ?? tryPayload.errorCode)) ?? anyErr?.code ?? null
  normalized.traceId =
    (tryPayload && (tryPayload.traceId ?? tryPayload.requestId ?? tryPayload.trace_id)) ?? null

  const msgCandidates = [
    tryPayload?.message,
    tryPayload?.Message,
    tryPayload?.error,
    tryPayload?.Error,
    tryPayload?.detail,
    tryPayload?.title,
    tryPayload?.msg,
  ]

  for (const c of msgCandidates) {
    if (typeof c === 'string' && c.trim()) {
      normalized.backendMessage = c.trim()
      break
    }
  }

  if (!normalized.backendMessage && typeof tryPayload === 'string' && tryPayload.trim()) {
    normalized.backendMessage = tryPayload.trim()
  }

  if (!normalized.backendMessage && anyErr instanceof Error && typeof anyErr.message === 'string') {
    const m = anyErr.message
    const parts = m.split(':')
    if (parts.length > 1) {
      const tail = parts.slice(1).join(':').trim()
      if (tail) normalized.backendMessage = tail
    } else if (m.trim()) {
      normalized.backendMessage = m.trim()
    }
  }

  const errs = tryPayload?.errors ?? tryPayload?.errorList ?? tryPayload?.validationErrors ?? null
  if (errs && typeof errs === 'object') {
    if (!Array.isArray(errs)) {
      for (const [k, v] of Object.entries(errs)) {
        const normalizedKey = normalizeFieldKey(k)
        normalized.fieldErrors[normalizedKey] = coerceToStringArray(v)
      }
    } else {
      for (const it of errs) {
        if (typeof it === 'string') {
          normalized.fieldErrors._general = normalized.fieldErrors._general ?? []
          normalized.fieldErrors._general.push(it)
        } else if (it && typeof it === 'object') {
          const rawField = (it as any).field ?? (it as any).key ?? '_general'
          const field = normalizeFieldKey(rawField)
          const msg = (it as any).message ?? (it as any).msg ?? (it as any).detail
          if (msg) {
            normalized.fieldErrors[field] = normalized.fieldErrors[field] ?? []
            normalized.fieldErrors[field].push(String(msg))
          }
        }
      }
    }
  }

  if (!normalized.backendMessage && Object.keys(normalized.fieldErrors).length > 0) {
    const firstField = Object.keys(normalized.fieldErrors)[0]
    const firstMsg = normalized.fieldErrors[firstField][0]
    normalized.backendMessage = `Vui lòng kiểm tra: ${firstField} — ${firstMsg}`
  }

  normalized.raw = tryPayload ?? anyErr
  return normalized
}

export const mapErrorToVietnamese = (error: unknown, _context?: ErrorContext): ErrorMessage => {
  let errorMessage = DEFAULT_ERROR_MESSAGE
  let originalMessage = ''

  const normalized = normalizeError(error)
  if (normalized.backendMessage) {
    return {
      code: 'BACKEND_MESSAGE',
      vietnamese: normalized.backendMessage,
      context:
        _context && (_context.operation || _context.component)
          ? `${_context.operation ?? ''}${_context.component ? ` / ${_context.component}` : ''}`
          : undefined,
    }
  }

  if (error instanceof Error) {
    originalMessage = error.message
    const apiError = error as ApiError

    if (apiError.status && HTTP_ERROR_MESSAGES[apiError.status]) {
      errorMessage = HTTP_ERROR_MESSAGES[apiError.status]
    } else if (originalMessage.toLowerCase().includes('network')) {
      errorMessage = NETWORK_ERROR_MESSAGES.NETWORK_ERROR
    } else if (originalMessage.toLowerCase().includes('timeout')) {
      errorMessage = NETWORK_ERROR_MESSAGES.TIMEOUT_ERROR
    } else if (originalMessage.toLowerCase().includes('abort')) {
      errorMessage = NETWORK_ERROR_MESSAGES.ABORT_ERROR
    } else {
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
  } else if (typeof error === 'string') {
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

export const handleApiError = (error: unknown, toast?: any, context?: ErrorContext) => {
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

export const handleApiSuccess = (message: string, toast?: any) => {
  if (toast) {
    toast.success(message)
  }
}

export const handleFetchError = (error: unknown, toast?: any, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const isBackend = errorMessage.code === 'BACKEND_MESSAGE'
  const contextualMessage = isBackend
    ? errorMessage.vietnamese
    : resourceName
      ? `Không thể tải ${resourceName.toLowerCase()}. ${errorMessage.vietnamese}`
      : errorMessage.vietnamese

  if (toast) {
    toast.error(contextualMessage)
  }

  return contextualMessage
}

export const handleCreateError = (error: unknown, toast?: any, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const isBackend = errorMessage.code === 'BACKEND_MESSAGE'
  const contextualMessage = isBackend
    ? errorMessage.vietnamese
    : resourceName
      ? `Không thể tạo ${resourceName.toLowerCase()}. ${errorMessage.vietnamese}`
      : errorMessage.vietnamese

  if (toast) {
    toast.error(contextualMessage)
  }

  return contextualMessage
}

export const handleUpdateError = (error: unknown, toast?: any, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const isBackend = errorMessage.code === 'BACKEND_MESSAGE'
  const contextualMessage = isBackend
    ? errorMessage.vietnamese
    : resourceName
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

export const handleDeleteError = (error: unknown, toast?: any, resourceName?: string) => {
  const errorMessage = mapErrorToVietnamese(error)
  const isBackend = errorMessage.code === 'BACKEND_MESSAGE'
  const contextualMessage = isBackend
    ? errorMessage.vietnamese
    : resourceName
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

export const handleValidationError = (error: unknown, toast?: any) => {
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

export const handleAuthError = (error: unknown, toast?: any) => {
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
