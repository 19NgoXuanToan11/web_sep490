import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return (format as any)(dateObj, 'dd/MM/yyyy', { locale: vi })
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return (format as any)(dateObj, 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch (error) {
    console.error('Error formatting date time:', error)
    return '-'
  }
}
  
export function formatDateTimeWithSeconds(date: string | Date | null | undefined): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return (format as any)(dateObj, 'dd/MM/yyyy HH:mm:ss', { locale: vi })
  } catch (error) {
    console.error('Error formatting date time with seconds:', error)
    return '-'
  }
}
