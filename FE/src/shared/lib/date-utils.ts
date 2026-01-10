import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

function tryParseDate(value?: string | Date | null): Date | null {
  if (!value) return null
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return value
  }
  const s = String(value).trim()
  if (!s) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(s) || s.includes('T')) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d
  }

  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const p1 = Number(m[1])
    const p2 = Number(m[2])
    const y = Number(m[3])
    if (p1 > 12 && p2 <= 12) {
      return new Date(y, p2 - 1, p1)
    }
    if (p2 > 12 && p1 <= 12) {
      return new Date(y, p1 - 1, p2)
    }
    return new Date(y, p2 - 1, p1)
  }

  const fallback = new Date(s)
  if (!isNaN(fallback.getTime())) return fallback
  return null
}

export function formatDate(date: string | Date | null | undefined): string {
  const parsed = tryParseDate(date ?? null)
  if (!parsed) return 'Chưa xác định'
  try {
    return (format as any)(parsed, 'dd/MM/yyyy', { locale: vi })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Chưa xác định'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const parsed = tryParseDate(date ?? null)
  if (!parsed) return 'Chưa xác định'
  try {
    return (format as any)(parsed, 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch (error) {
    console.error('Error formatting date time:', error)
    return 'Chưa xác định'
  }
}

export function formatDateTimeWithSeconds(date: string | Date | null | undefined): string {
  const parsed = tryParseDate(date ?? null)
  if (!parsed) return 'Chưa xác định'
  try {
    return (format as any)(parsed, 'dd/MM/yyyy HH:mm:ss', { locale: vi })
  } catch (error) {
    console.error('Error formatting date time with seconds:', error)
    return 'Chưa xác định'
  }
}

export function formatDateRange(start?: string | Date | null, end?: string | Date | null): string {
  const s = tryParseDate(start ?? null)
  const e = tryParseDate(end ?? null)
  if (s && e) {
    return `${(format as any)(s, 'dd/MM/yyyy', { locale: vi })} đến ${(format as any)(e, 'dd/MM/yyyy', { locale: vi })}`
  }
  if (s && !e) {
    return `Bắt đầu: ${(format as any)(s, 'dd/MM/yyyy', { locale: vi })}`
  }
  if (!s && e) {
    return `Kết thúc: ${(format as any)(e, 'dd/MM/yyyy', { locale: vi })}`
  }
  return 'Chưa xác định'
}
