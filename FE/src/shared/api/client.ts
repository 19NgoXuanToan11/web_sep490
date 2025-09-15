// Lightweight HTTP client built on fetch with JSON helpers
import { env } from '@/shared/config/env'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface JsonResponse<T> {
  data: T
  status: number
}

const controllers = new Set<AbortController>()

export function abortAllRequests() {
  for (const c of controllers) c.abort()
  controllers.clear()
}

async function request<T>(
  path: string,
  options: RequestInit & { method?: HttpMethod } = {}
): Promise<JsonResponse<T>> {
  const url = `${env.API_URL}${path}`
  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')

  // Tự động đính kèm Authorization nếu có
  const raw = localStorage.getItem('ifms-token')
  const token = raw ? JSON.parse(raw) : null
  if (token) headers.set('Authorization', `Bearer ${String(token).replace(/"/g, '')}`)

  const controller = new AbortController()
  controllers.add(controller)
  const res = await fetch(url, { ...options, headers, signal: controller.signal })
  controllers.delete(controller)
  const status = res.status
  const text = await res.text()
  const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T)
  if (!res.ok) {
    // Standardize error shape for UI toasts
    const message = (data as any)?.message || (data as any)?.Message || `HTTP ${status}`
    throw Object.assign(new Error(message), { status, data })
  }
  return { data, status }
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
}

export function withAuth(headers: HeadersInit = {}): HeadersInit {
  const token = localStorage.getItem('ifms-token')
  return token ? { ...headers, Authorization: `Bearer ${token.replace(/"/g, '')}` } : headers
}
