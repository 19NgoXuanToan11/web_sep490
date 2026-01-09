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
    const message =
      (data as any)?.message || (data as any)?.Message || (data as any)?.error || `HTTP ${status}`

    const safeData =
      data && typeof data === 'object' ? (JSON.parse(JSON.stringify(data)) as T) : data
    const error = Object.assign(new Error(String(message)), {
      status,
      data: safeData,
      url: path,
      method: options.method || 'GET',
    })
    try {
      console.error('API error', {
        endpoint: path,
        method: options.method || 'GET',
        status,
        payload: data,
      })
    } catch (err) {}

    throw error
  }
  try {
    if (data && typeof data === 'object') {
      const maybeBody: any = data
      if (typeof maybeBody.status === 'number' && maybeBody.status !== 1) {
        const message =
          maybeBody.message ||
          maybeBody.Message ||
          maybeBody.error ||
          maybeBody.Error ||
          `Backend status ${maybeBody.status}`
        const safeData =
          maybeBody && typeof maybeBody === 'object'
            ? (JSON.parse(JSON.stringify(maybeBody)) as T)
            : maybeBody
        const error = Object.assign(new Error(String(message)), {
          status: maybeBody.status,
          data: safeData,
          url: path,
          method: options.method || 'GET',
        })
        try {
          console.error('API backend-reported error', {
            endpoint: path,
            method: options.method || 'GET',
            payload: maybeBody,
          })
        } catch (err) {}
        throw error
      }
    }
  } catch (err) {
    throw err
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
