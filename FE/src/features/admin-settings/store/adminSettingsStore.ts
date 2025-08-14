import { create } from 'zustand'
import type { SystemSettings, LoadingState } from '@/shared/lib/localData'
import { systemSettings as initialSettings } from '@/shared/lib/localData/fixtures'
import { simulateLatency, simulateError, userPreferences } from '@/shared/lib/localData/storage'
import type {
  GeneralSettingsFormData,
  NotificationsSettingsFormData,
  IoTConfigSettingsFormData,
} from '../model/schemas'

interface AdminSettingsState {
  // Data
  settings: SystemSettings

  // UI State
  loadingStates: Record<string, LoadingState>
  activeTab: 'general' | 'notifications' | 'iot-config'
  hasUnsavedChanges: boolean

  // Actions
  initializeData: () => void

  // Settings update operations
  updateGeneralSettings: (data: GeneralSettingsFormData) => Promise<void>
  updateNotificationsSettings: (data: NotificationsSettingsFormData) => Promise<void>
  updateIoTConfigSettings: (data: IoTConfigSettingsFormData) => Promise<void>
  saveAllSettings: () => Promise<void>
  resetSettings: () => void

  // UI actions
  setActiveTab: (tab: 'general' | 'notifications' | 'iot-config') => void
  setLoadingState: (key: string, state: LoadingState) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void

  // Computed getters
  getSettingsByTab: (tab: string) => any
  isTabValid: (tab: string) => boolean
}

export const useAdminSettingsStore = create<AdminSettingsState>((set, get) => ({
  // Initial state
  settings: {
    general: {
      systemName: '',
      primaryColor: '#16a34a',
      logoUrl: null,
    },
    notifications: {
      emailEnabled: false,
      smsEnabled: false,
      alertFrequency: 'daily',
    },
    iotConfig: {
      defaultPollingInterval: 15,
      sensorThresholds: {
        temperature: { min: 10, max: 35 },
        moisture: { min: 20, max: 80 },
        ph: { min: 6.0, max: 7.5 },
      },
    },
    updatedAt: '',
  },
  loadingStates: {},
  activeTab: 'general',
  hasUnsavedChanges: false,

  // Initialize data from fixtures
  initializeData: () => {
    const prefs = userPreferences.get()

    set({
      settings: { ...initialSettings },
      activeTab: (prefs.lastSelectedTab?.adminSettings as any) || 'general',
    })
  },

  // Settings update operations
  updateGeneralSettings: async (data: GeneralSettingsFormData) => {
    const key = 'update-general-settings'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 600)

      if (simulateError(0.08)) {
        throw new Error('Failed to update general settings. Please try again.')
      }

      set(state => ({
        settings: {
          ...state.settings,
          general: {
            ...state.settings.general,
            ...data,
          },
          updatedAt: new Date().toISOString(),
        },
      }))

      get().setLoadingState(key, { isLoading: false })
      get().setHasUnsavedChanges(true)
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  updateNotificationsSettings: async (data: NotificationsSettingsFormData) => {
    const key = 'update-notifications-settings'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(250, 500)

      if (simulateError(0.06)) {
        throw new Error('Failed to update notification settings. Please try again.')
      }

      set(state => ({
        settings: {
          ...state.settings,
          notifications: {
            ...state.settings.notifications,
            ...data,
          },
          updatedAt: new Date().toISOString(),
        },
      }))

      get().setLoadingState(key, { isLoading: false })
      get().setHasUnsavedChanges(true)
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  updateIoTConfigSettings: async (data: IoTConfigSettingsFormData) => {
    const key = 'update-iot-config-settings'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 700)

      if (simulateError(0.1)) {
        throw new Error('Failed to update IoT configuration. Please try again.')
      }

      set(state => ({
        settings: {
          ...state.settings,
          iotConfig: {
            ...state.settings.iotConfig,
            ...data,
          },
          updatedAt: new Date().toISOString(),
        },
      }))

      get().setLoadingState(key, { isLoading: false })
      get().setHasUnsavedChanges(true)
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  saveAllSettings: async () => {
    const key = 'save-all-settings'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(600, 1000)

      if (simulateError(0.05)) {
        throw new Error('Failed to save settings. Please try again.')
      }

      // Simulate saving to backend
      set(state => ({
        settings: {
          ...state.settings,
          updatedAt: new Date().toISOString(),
        },
        hasUnsavedChanges: false,
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

  resetSettings: () => {
    set({
      settings: { ...initialSettings },
      hasUnsavedChanges: false,
    })

    // Clear all loading states
    set(state => ({
      loadingStates: Object.keys(state.loadingStates).reduce(
        (acc, key) => {
          acc[key] = { isLoading: false }
          return acc
        },
        {} as Record<string, LoadingState>
      ),
    }))
  },

  // UI actions
  setActiveTab: (tab: 'general' | 'notifications' | 'iot-config') => {
    set({ activeTab: tab })
    userPreferences.set({
      lastSelectedTab: {
        ...userPreferences.get().lastSelectedTab,
        adminSettings: tab,
      },
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

  setHasUnsavedChanges: (hasChanges: boolean) => {
    set({ hasUnsavedChanges: hasChanges })
  },

  // Computed getters
  getSettingsByTab: (tab: string) => {
    const { settings } = get()
    switch (tab) {
      case 'general':
        return settings.general
      case 'notifications':
        return settings.notifications
      case 'iot-config':
        return settings.iotConfig
      default:
        return null
    }
  },

  isTabValid: (tab: string) => {
    const settings = get().getSettingsByTab(tab)

    if (!settings) return false

    // Basic validation - could be enhanced with actual schema validation
    switch (tab) {
      case 'general':
        return settings.systemName && settings.primaryColor
      case 'notifications':
        return (
          typeof settings.emailEnabled === 'boolean' &&
          typeof settings.smsEnabled === 'boolean' &&
          settings.alertFrequency
        )
      case 'iot-config':
        return (
          settings.defaultPollingInterval > 0 &&
          settings.sensorThresholds &&
          settings.sensorThresholds.temperature &&
          settings.sensorThresholds.moisture &&
          settings.sensorThresholds.ph
        )
      default:
        return false
    }
  },
}))
