import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

/**
 * Formats a date string or Date object to DD/MM/YYYY format (Vietnamese/European standard)
 * @param date - Date string (ISO format or any valid date string) or Date object
 * @returns Formatted date string in DD/MM/YYYY format, or '-' if date is invalid/null/undefined
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '-'
    }
    
    return format(dateObj, 'dd/MM/yyyy', { locale: vi })
  } catch (error) {
    console.error('Error formatting date:', error)
    return '-'
  }
}

/**
 * Formats a date string or Date object to DD/MM/YYYY HH:mm format (with time)
 * @param date - Date string (ISO format or any valid date string) or Date object
 * @returns Formatted date string in DD/MM/YYYY HH:mm format, or '-' if date is invalid/null/undefined
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '-'
    }
    
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch (error) {
    console.error('Error formatting date time:', error)
    return '-'
  }
}

/**
 * Formats a date string or Date object to DD/MM/YYYY HH:mm:ss format (with seconds)
 * @param date - Date string (ISO format or any valid date string) or Date object
 * @returns Formatted date string in DD/MM/yyyy HH:mm:ss format, or '-' if date is invalid/null/undefined
 */
export function formatDateTimeWithSeconds(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '-'
    }
    
    return format(dateObj, 'dd/MM/yyyy HH:mm:ss', { locale: vi })
  } catch (error) {
    console.error('Error formatting date time with seconds:', error)
    return '-'
  }
}

