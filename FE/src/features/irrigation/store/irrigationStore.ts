import { create } from 'zustand'
import type {
  Device,
  IrrigationSchedule,
  IrrigationRule,
  DeviceStatus,
  LoadingState,
} from '@/shared/lib/localData'
import {
  devices as initialDevices,
  irrigationSchedules as initialSchedules,
  irrigationRules as initialRules,
} from '@/shared/lib/localData/fixtures'
import { simulateLatency, simulateError, addHours, addDays } from '@/shared/lib/localData/storage'
import type { ScheduleFormData, RuleFormData } from '../model/schemas'

interface IrrigationState {

  devices: Device[]
  schedules: IrrigationSchedule[]
  rules: IrrigationRule[]

  loadingStates: Record<string, LoadingState>
  selectedTab: string

  initializeData: () => void

  updateDeviceStatus: (deviceId: string, status: DeviceStatus) => Promise<void>
  performDeviceAction: (
    deviceId: string,
    action: 'start' | 'stop' | 'pause' | 'run-now'
  ) => Promise<void>

  createSchedule: (data: ScheduleFormData) => Promise<void>
  updateSchedule: (id: string, data: Partial<IrrigationSchedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  toggleSchedule: (id: string, enabled: boolean) => Promise<void>

  createRule: (data: RuleFormData) => Promise<void>
  updateRule: (id: string, data: Partial<IrrigationRule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string, enabled: boolean) => Promise<void>

  setSelectedTab: (tab: string) => void
  setLoadingState: (key: string, state: LoadingState) => void
}

export const useIrrigationStore = create<IrrigationState>((set, get) => ({

  devices: [],
  schedules: [],
  rules: [],
  loadingStates: {},
  selectedTab: 'calendar',

  initializeData: () => {
    set({
      devices: [...initialDevices],
      schedules: [...initialSchedules],
      rules: [...initialRules],
    })

    const interval = setInterval(() => {
      const { devices } = get()

      const updatedDevices = devices.map(device => {

        if (Math.random() < 0.05) {
          const statuses: DeviceStatus[] = ['Idle', 'Running', 'Paused']
          const currentIndex = statuses.indexOf(device.status)
          const newStatus = statuses[(currentIndex + 1) % statuses.length]

          return {
            ...device,
            status: newStatus,
            nextRun:
              newStatus === 'Running' ? addHours(new Date(), 4).toISOString() : device.nextRun,
          }
        }
        return device
      })

      set({ devices: updatedDevices })
    }, 3000)

    ;(window as any).__irrigationStatusInterval = interval
  },

  updateDeviceStatus: async (deviceId: string, status: DeviceStatus) => {
    const key = `device-${deviceId}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 500)

      if (simulateError(0.1)) {
        throw new Error('Failed to update device status. Please try again.')
      }

      set(state => ({
        devices: state.devices.map(device =>
          device.id === deviceId
            ? {
                ...device,
                status,
                lastRun: status === 'Running' ? new Date().toISOString() : device.lastRun,
                nextRun:
                  status === 'Running'
                    ? addHours(new Date(), 4).toISOString()
                    : status === 'Idle'
                      ? addHours(new Date(), 8).toISOString()
                      : device.nextRun,
              }
            : device
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  performDeviceAction: async (deviceId: string, action: 'start' | 'stop' | 'pause' | 'run-now') => {
    const statusMap = {
      start: 'Running' as DeviceStatus,
      stop: 'Idle' as DeviceStatus,
      pause: 'Paused' as DeviceStatus,
      'run-now': 'Running' as DeviceStatus,
    }

    await get().updateDeviceStatus(deviceId, statusMap[action])
  },

  createSchedule: async (data: ScheduleFormData) => {
    const key = 'create-schedule'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 700)

      if (simulateError(0.1)) {
        throw new Error('Failed to create schedule. Please try again.')
      }

      const newSchedule: IrrigationSchedule = {
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
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  updateSchedule: async (id: string, data: Partial<IrrigationSchedule>) => {
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
        error: error instanceof Error ? error.message : 'Unknown error',
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
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  toggleSchedule: async (id: string, enabled: boolean) => {
    await get().updateSchedule(id, { enabled })
  },

  createRule: async (data: RuleFormData) => {
    const key = 'create-rule'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 600)

      if (simulateError(0.1)) {
        throw new Error('Failed to create rule. Please try again.')
      }

      const newRule: IrrigationRule = {
        id: `rule-${Date.now()}`,
        name: data.name,
        conditionText: data.conditionText,
        enabled: data.enabled,
        createdAt: new Date().toISOString(),
      }

      set(state => ({
        rules: [...state.rules, newRule],
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  updateRule: async (id: string, data: Partial<IrrigationRule>) => {
    const key = `update-rule-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 500)

      if (simulateError(0.1)) {
        throw new Error('Failed to update rule. Please try again.')
      }

      set(state => ({
        rules: state.rules.map(rule => (rule.id === id ? { ...rule, ...data } : rule)),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  deleteRule: async (id: string) => {
    const key = `delete-rule-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 400)

      if (simulateError(0.05)) {
        throw new Error('Failed to delete rule. Please try again.')
      }

      set(state => ({
        rules: state.rules.filter(rule => rule.id !== id),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  toggleRule: async (id: string, enabled: boolean) => {
    await get().updateRule(id, { enabled })
  },

  setSelectedTab: (tab: string) => {
    set({ selectedTab: tab })

    import('@/shared/lib/localData/storage').then(({ userPreferences }) => {
      userPreferences.set({ lastSelectedTab: { irrigation: tab } })
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

function formatTime(time: string): string {
  const [hour, minute] = time.split(':')
  const hourNum = parseInt(hour)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
  return `${displayHour}:${minute} ${ampm}`
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
