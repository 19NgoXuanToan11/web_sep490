// Local storage utilities for persisting user preferences and data

const STORAGE_KEYS = {
  USER_PREFERENCES: 'ifms-user-preferences',
  DEVICES: 'ifms-devices',
  SCHEDULES: 'ifms-schedules',
  RULES: 'ifms-rules',
} as const

export interface UserPreferences {
  tableDensity: 'compact' | 'comfortable'
  lastSelectedTab: {
    irrigation?: string
  }
  language: string
  theme: 'light' | 'dark' | 'system'
}

const defaultPreferences: UserPreferences = {
  tableDensity: 'comfortable',
  lastSelectedTab: {},
  language: 'en',
  theme: 'system',
}

// Generic storage utilities
export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silent fail for storage quota exceeded, etc.
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silent fail
    }
  },

  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch {
      // Silent fail
    }
  },
}

// Typed storage utilities for specific data
export const userPreferences = {
  get(): UserPreferences {
    const stored = storage.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES)
    return { ...defaultPreferences, ...stored }
  },

  set(preferences: Partial<UserPreferences>): void {
    const current = userPreferences.get()
    storage.set(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...preferences })
  },

  update(updater: (current: UserPreferences) => UserPreferences): void {
    const current = userPreferences.get()
    const updated = updater(current)
    storage.set(STORAGE_KEYS.USER_PREFERENCES, updated)
  },
}

// Simulation utilities
export const simulateLatency = (min: number = 200, max: number = 600): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

export const simulateError = (errorRate: number = 0.1): boolean => {
  return Math.random() < errorRate
}

// Date/time utilities for the local data
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('vi-VN')
}

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('vi-VN')
}

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const isToday = (date: string | Date): boolean => {
  const today = new Date()
  const checkDate = new Date(date)
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  )
}

export const addHours = (date: string | Date, hours: number): Date => {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

export const addDays = (date: string | Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
