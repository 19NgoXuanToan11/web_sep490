// Local storage utilities for persisting user preferences and data

const STORAGE_KEYS = {
  USER_PREFERENCES: 'ifms-user-preferences',
  DEVICES: 'ifms-devices',
  SCHEDULES: 'ifms-schedules',
  RULES: 'ifms-rules',
  PRODUCTS: 'ifms-products',
  INVENTORY: 'ifms-inventory',
  REPORTS_TIME_RANGE: 'ifms-reports-time-range',
} as const

export interface UserPreferences {
  tableDensity: 'compact' | 'comfortable'
  lastSelectedTab: {
    irrigation?: string
    inventory?: string
  }
  language: string
  theme: 'light' | 'dark' | 'system'
  reportsTimeRange: 'last7' | 'last30' | 'last90'
}

const defaultPreferences: UserPreferences = {
  tableDensity: 'comfortable',
  lastSelectedTab: {},
  language: 'en',
  theme: 'system',
  reportsTimeRange: 'last30',
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

// CSV export utility
export const exportToCSV = (data: any[], filename: string): void => {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
