import { env } from '@/shared/config/env'
import { trackRequest, releaseRequest } from '@/shared/api/requestTracker'
import { terminateSession } from '@/shared/lib/session/sessionManager'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface JsonResponse<T> {
  data: T
  status: number
}

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData

const serializeBody = (body: unknown) => {
  if (body === undefined) return undefined
  return isFormData(body) ? body : JSON.stringify(body)
}

async function request<T>(
  path: string,
  options: RequestInit & { method?: HttpMethod } = {}
): Promise<JsonResponse<T>> {
  const url = `${env.API_URL}${path}`
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && !isFormData(options.body)) {
    headers.set('Content-Type', 'application/json')
  }

  const raw = localStorage.getItem('ifms-token')
  const token = raw ? JSON.parse(raw) : null
  if (token) headers.set('Authorization', `Bearer ${String(token).replace(/"/g, '')}`)

  const controller = new AbortController()
  trackRequest(controller)
  const res = await fetch(url, { ...options, headers, signal: controller.signal })
  releaseRequest(controller)
  const status = res.status
  const text = await res.text()
  const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T)
  if (!res.ok) {
    if (status === 401) {
      terminateSession({ reason: 'expired' })
    }
    // Extract meaningful error message from response
    const message =
      (data as any)?.message || (data as any)?.Message || (data as any)?.error || `HTTP ${status}`

    // Create enhanced error object with status and data
    const error = Object.assign(new Error(message), {
      status,
      data,
      url: path,
      method: options.method || 'GET',
    })

    throw error
  }
  return { data, status }
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: serializeBody(body),
    }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PUT',
      body: serializeBody(body),
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: serializeBody(body),
    }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
}

export function withAuth(headers: HeadersInit = {}): HeadersInit {
  const token = localStorage.getItem('ifms-token')
  return token ? { ...headers, Authorization: `Bearer ${token.replace(/"/g, '')}` } : headers
}
