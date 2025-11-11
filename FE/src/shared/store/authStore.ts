import { create } from 'zustand'
import { authApi } from '@/shared/api/auth'
import { abortAllRequests } from '@/shared/api/client'
import { decodeJwt, isJwtExpired } from '@/shared/lib/auth/jwt'

type Role = 'Admin' | 'Manager' | 'Staff' | null

type AuthState = {
  token: string | null
  role: Role
  email: string | null
  accountId: number | null
  initializing: boolean
  setToken: (token: string | null) => void
  loadFromStorage: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  role: null,
  email: null,
  accountId: null,
  initializing: true,
  setToken: token => {
    if (token) localStorage.setItem('ifms-token', JSON.stringify(token))
    else localStorage.removeItem('ifms-token')
    set({ token })
    const claims = token ? decodeJwt(token) : null
    const role = (claims?.role as Role) || null
    set({ role, email: claims?.email || null })
  },
  loadFromStorage: async () => {
    try {
      const raw = localStorage.getItem('ifms-token')
      const token = raw ? JSON.parse(raw) : null
      if (token && !isJwtExpired(token)) {
        const claims = decodeJwt(token)
        if (claims?.role) {
          set({
            token,
            role: claims.role as Role,
            email: claims.email || null,
            initializing: false,
          })
          return
        }
      }

      set({ token: null, role: null, email: null, accountId: null, initializing: false })
    } catch {
      set({ initializing: false })
    }
  },
  logout: () => {
    try {
      abortAllRequests()
    } catch {}
    localStorage.removeItem('ifms-token')
    set({ token: null, role: null, email: null, accountId: null })
  },
}))
