import moment from 'moment'

try {
  require('moment/locale/vi')
  moment.locale('vi', {
    week: {
      dow: 1, // Monday is the first day of the week
    },
  })
} catch {
  moment.locale('en', {
    week: {
      dow: 1,
    },
  })
}

export function parseBackendDate(value: string | null | undefined): Date | null {
  if (!value) return null

  try {
    if (value.includes('/')) {
      const parts = value.split('/')
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1 
        const day = parseInt(parts[1], 10)
        const year = parseInt(parts[2], 10)
        const date = new Date(year, month, day, 0, 0, 0, 0)
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date
    }
  } catch {
  }

  return null
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function occursOnDay(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  day: Date
): boolean {
  if (!startDate || !endDate) return false

  const start = parseBackendDate(startDate)
  const end = parseBackendDate(endDate)

  if (!start || !end) return false

  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  return start <= dayEnd && end >= dayStart
}

export function formatVNShort(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return moment().format('ddd DD/MM')
  }
  const m = moment(date)
  if (!m.isValid()) {
    return moment().format('ddd DD/MM')
  }
  return m.format('ddd DD/MM')
}

export function formatVNLong(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return moment().format('dddd, DD/MM/YYYY')
  }
  const m = moment(date)
  if (!m.isValid()) {
    return moment().format('dddd, DD/MM/YYYY')
  }
  return m.format('dddd, DD/MM/YYYY')
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseBackendDate(startDate)
  const end = parseBackendDate(endDate)

  if (!start || !end) return ''

  const startMoment = moment(start)
  const endMoment = moment(end)

  if (!startMoment.isValid() || !endMoment.isValid()) {
    return ''
  }

  return `${startMoment.format('DD/MM')} → ${endMoment.format('DD/MM')}`
}

export function rangeWeek(date: Date): Date[] {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date()
  }

  const start = moment(date).startOf('week').toDate()

  if (isNaN(start.getTime())) {
    const now = new Date()
    const fallbackStart = moment(now).startOf('week').toDate()
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(fallbackStart)
      day.setDate(fallbackStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    if (!isNaN(day.getTime())) {
      days.push(day)
    }
  }
  return days
}

export function rangeDay(date: Date): Date[] {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return [new Date()]
  }
  return [new Date(date)]
}
