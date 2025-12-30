import { startOfWeek, addDays, startOfDay, addMinutes, differenceInMinutes, format } from 'date-fns'

export type ViewMode = 'day' | 'week' | 'month'

export interface EngineState {
  view: ViewMode
  anchorDate: Date
  weekStartsOn: number
  slotMinutes: number
  workHours: { start: string; end: string }
}

export const defaultEngineState: EngineState = {
  view: 'month',
  anchorDate: new Date(),
  weekStartsOn: 1,
  slotMinutes: 30,
  workHours: { start: '08:00', end: '18:00' },
}

export function getMonthMatrix(anchorDate: Date): Date[][] {
  const matrix: Date[][] = []
  const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  let cur = new Date(start)

  for (let w = 0; w < 5; w++) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur = addDays(cur, 1)
    }
    matrix.push(week)
  }
  return matrix
}

export function getWeekDays(anchorDate: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): Date[] {
  const start = startOfWeek(anchorDate, { weekStartsOn })
  const days: Date[] = []
  for (let i = 0; i < 7; i++) days.push(addDays(start, i))
  return days
}

export function buildTimeSlots(startHHmm: string, endHHmm: string, slotMinutes = 30) {
  const [sh, sm] = startHHmm.split(':').map(Number)
  const [eh, em] = endHHmm.split(':').map(Number)
  const start = addMinutes(startOfDay(new Date()), sh * 60 + sm)
  const end = addMinutes(startOfDay(new Date()), eh * 60 + em)
  const slots: Date[] = []
  let cur = start
  while (cur < end) {
    slots.push(cur)
    cur = addMinutes(cur, slotMinutes)
  }
  return slots
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date | null
  end: Date | null
  color?: string
  participants?: { id: string; name?: string; avatarUrl?: string }[]
  raw?: any
}

export function layoutDayEvents(events: CalendarEvent[]) {
  const sorted = [...events]
    .filter(e => e.start && e.end)
    .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime())
  const columns: CalendarEvent[][] = []
  sorted.forEach(ev => {
    let placed = false
    for (const col of columns) {
      const last = col[col.length - 1]
      if ((last.end as Date) <= (ev.start as Date)) {
        col.push(ev)
        placed = true
        break
      }
    }
    if (!placed) columns.push([ev])
  })
  const result = sorted.map(ev => {
    let colIndex = 0
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].includes(ev)) {
        colIndex = i
        break
      }
    }
    return { event: ev, colIndex, totalCols: columns.length }
  })
  return result
}

export function minutesBetween(a: Date, b: Date) {
  return differenceInMinutes(b, a)
}

export function formatTimeRange(start?: Date | null, end?: Date | null) {
  if (!start || !end) return ''
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
}


