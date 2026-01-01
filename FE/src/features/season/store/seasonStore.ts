import { create } from 'zustand'
import { mapErrorToVietnamese } from '@/shared/lib/error-handler'
import type { SeasonSchedule, LoadingState } from '@/shared/lib/localData'
import { seasonSchedules as initialSchedules } from '@/shared/lib/localData/fixtures'
import { simulateLatency, simulateError, addDays } from '@/shared/lib/localData/storage'
import type { ScheduleFormData } from '@/features/season/model/schemas'

interface SeasonState {
  schedules: SeasonSchedule[]
  loadingStates: Record<string, LoadingState>
  selectedTab: string

  initializeData: () => void

  createSchedule: (data: ScheduleFormData) => Promise<void>
  updateSchedule: (id: string, data: Partial<SeasonSchedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  toggleSchedule: (id: string, enabled: boolean) => Promise<void>

  setSelectedTab: (tab: string) => void
  setLoadingState: (key: string, state: LoadingState) => void
}

export const useSeasonStore = create<SeasonState>((set, get) => ({
  schedules: [],
  loadingStates: {},
  selectedTab: 'calendar',

  initializeData: () => {
    set({
      schedules: [...initialSchedules],
    })
  },

  createSchedule: async (data: ScheduleFormData) => {
    const key = 'create-schedule'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 700)

      if (simulateError(0.1)) {
        throw new Error('Failed to create schedule. Please try again.')
      }

      const newSchedule: SeasonSchedule = {
        id: `sched-${Date.now()}`,
        deviceId: data.deviceId,
        title: data.title,
        recurrenceText: generateRecurrenceText(data.recurrenceType, data.startTime),
        startTime: data.startTime,
        endTime: data.endTime,
        moistureThresholdPct: data.moistureThresholdPct,
        enabled: data.enabled,
        nextRun: calculateNextRun(data.recurrenceType, data.startTime),
        status: 'Scheduled',
      }

      set(state => ({
        schedules: [...state.schedules, newSchedule],
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  updateSchedule: async (id: string, data: Partial<SeasonSchedule>) => {
    const key = `update-schedule-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 500)

      if (simulateError(0.1)) {
        throw new Error('Failed to update schedule. Please try again.')
      }

      set(state => ({
        schedules: state.schedules.map(schedule =>
          schedule.id === id ? { ...schedule, ...data } : schedule
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  deleteSchedule: async (id: string) => {
    const key = `delete-schedule-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 400)

      if (simulateError(0.05)) {
        throw new Error('Failed to delete schedule. Please try again.')
      }

      set(state => ({
        schedules: state.schedules.filter(schedule => schedule.id !== id),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  toggleSchedule: async (id: string, enabled: boolean) => {
    await get().updateSchedule(id, { enabled })
  },

  setSelectedTab: (tab: string) => {
    set({ selectedTab: tab })

    import('@/shared/lib/localData/storage').then(({ userPreferences }) => {
      userPreferences.set({ lastSelectedTab: { season: tab } })
    })
  },

  setLoadingState: (key: string, state: LoadingState) => {
    set(currentState => ({
      loadingStates: {
        ...currentState.loadingStates,
        [key]: state,
      },
    }))
  },
}))

function formatTime(time: string): string {
  const [hour, minute] = time.split(':')
  const hourNum = parseInt(hour)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  return `${displayHour}:${minute} ${ampm}`
}

function generateRecurrenceText(type: string, startTime: string): string {
  switch (type) {
    case 'daily':
      return `Daily at ${formatTime(startTime)}`
    case 'weekly':
      return `Weekly at ${formatTime(startTime)}`
    case 'interval':
      return `Every 6 hours starting at ${formatTime(startTime)}`
    default:
      return `Custom schedule at ${formatTime(startTime)}`
  }
}

function calculateNextRun(_type: string, startTime: string): string {
  const now = new Date()
  const [hour, minute] = startTime.split(':').map(Number)

  let nextRun = new Date()
  nextRun.setHours(hour, minute, 0, 0)

  if (nextRun <= now) {
    nextRun = addDays(nextRun, 1)
  }

  return nextRun.toISOString()
}


