import { create } from 'zustand'
import type {
  StaffDevice,
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import { staffDevices as initialDevices } from '@/shared/lib/localData/fixtures'
import {
  simulateLatency,
  simulateError,
  exportToCSV,
  userPreferences,
} from '@/shared/lib/localData/storage'
import type {
  DeviceActionData,
  BulkDeviceActionData,
  DeviceFilterData,
  DeviceViewMode,
} from '../model/schemas'

interface StaffOperationsState {
  // Data
  devices: StaffDevice[]

  // UI State
  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedDeviceIds: string[]
  viewMode: DeviceViewMode

  // Filters
  filters: DeviceFilterData

  // Real-time updates
  lastUpdateTime: string
  autoRefresh: boolean
  refreshInterval: number // in seconds

  // Actions
  initializeData: () => void

  // Device operations
  executeDeviceAction: (data: DeviceActionData) => Promise<void>
  executeBulkDeviceAction: (data: BulkDeviceActionData) => Promise<void>
  refreshDeviceStatus: (deviceId?: string) => Promise<void>
  exportDevicesCSV: () => void

  // Search and filter actions
  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setFilters: (filters: Partial<DeviceFilterData>) => void
  clearFilters: () => void
  setPagination: (page: number, pageSize?: number) => void

  // Selection actions
  toggleDeviceSelection: (deviceId: string) => void
  selectAllDevices: () => void
  clearSelection: () => void

  // UI actions
  setViewMode: (mode: DeviceViewMode) => void
  setTableDensity: (density: TableDensity) => void
  setAutoRefresh: (enabled: boolean) => void
  setRefreshInterval: (seconds: number) => void
  setLoadingState: (key: string, state: LoadingState) => void

  // Computed getters
  getFilteredDevices: () => StaffDevice[]
  getPaginatedDevices: () => StaffDevice[]
  getTotalCount: () => number
  getDevicesByZone: () => Record<string, StaffDevice[]>
  getDevicesByStatus: () => Record<string, number>
  getMaintenanceDevices: () => StaffDevice[]
  getLowBatteryDevices: () => StaffDevice[]
  getZonesList: () => string[]
}

export const useStaffOperationsStore = create<StaffOperationsState>((set, get) => ({
  // Initial state
  devices: [],
  loadingStates: {},
  searchState: {
    query: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },
  paginationState: {
    page: 1,
    pageSize: 12,
    total: 0,
  },
  tableDensity: 'comfortable',
  selectedDeviceIds: [],
  viewMode: 'grid',
  filters: {},
  lastUpdateTime: new Date().toISOString(),
  autoRefresh: true,
  refreshInterval: 30, // 30 seconds

  // Initialize data from fixtures
  initializeData: () => {
    const prefs = userPreferences.get()

    set({
      devices: [...initialDevices],
      tableDensity: prefs.tableDensity,
      viewMode: (prefs.lastSelectedTab?.staffOperations as DeviceViewMode) || 'grid',
      lastUpdateTime: new Date().toISOString(),
    })
  },

  // Device operations
  executeDeviceAction: async (data: DeviceActionData) => {
    const key = `device-action-${data.deviceId}-${data.type}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 800)

      if (simulateError(0.12)) {
        throw new Error(`Failed to ${data.type} device. Please try again.`)
      }

      const now = new Date().toISOString()

      set(state => ({
        devices: state.devices.map(device => {
          if (device.id === data.deviceId) {
            let newStatus = device.status
            let newNextSchedule = device.nextSchedule

            switch (data.type) {
              case 'start':
                newStatus = 'Running'
                break
              case 'stop':
                newStatus = 'Idle'
                newNextSchedule = null
                break
              case 'pause':
                newStatus = 'Paused'
                break
              case 'run-now':
                newStatus = 'Running'
                newNextSchedule = null
                break
              case 'maintenance':
                newStatus = 'Maintenance'
                newNextSchedule = null
                break
            }

            return {
              ...device,
              status: newStatus,
              lastAction: now,
              nextSchedule: newNextSchedule,
              needsMaintenance: data.type === 'maintenance' ? false : device.needsMaintenance,
            }
          }
          return device
        }),
        lastUpdateTime: now,
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

  executeBulkDeviceAction: async (data: BulkDeviceActionData) => {
    const key = `bulk-device-action-${data.type}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(600, 1200)

      if (simulateError(0.15)) {
        throw new Error(`Failed to ${data.type} devices. Please try again.`)
      }

      const now = new Date().toISOString()

      set(state => ({
        devices: state.devices.map(device => {
          if (data.deviceIds.includes(device.id)) {
            let newStatus = device.status
            let newNextSchedule = device.nextSchedule

            switch (data.type) {
              case 'start':
                newStatus = 'Running'
                break
              case 'stop':
                newStatus = 'Idle'
                newNextSchedule = null
                break
              case 'pause':
                newStatus = 'Paused'
                break
              case 'maintenance':
                newStatus = 'Maintenance'
                newNextSchedule = null
                break
            }

            return {
              ...device,
              status: newStatus,
              lastAction: now,
              nextSchedule: newNextSchedule,
              needsMaintenance: data.type === 'maintenance' ? false : device.needsMaintenance,
            }
          }
          return device
        }),
        selectedDeviceIds: [],
        lastUpdateTime: now,
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

  refreshDeviceStatus: async (deviceId?: string) => {
    const key = deviceId ? `refresh-device-${deviceId}` : 'refresh-all-devices'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 500)

      if (simulateError(0.05)) {
        throw new Error('Failed to refresh device status.')
      }

      // Simulate real-time updates with minor random changes
      set(state => ({
        devices: state.devices.map(device => {
          if (!deviceId || device.id === deviceId) {
            // Simulate battery drain for battery devices
            let newBatteryLevel = device.batteryLevel
            if (newBatteryLevel !== undefined) {
              newBatteryLevel = Math.max(0, newBatteryLevel - Math.floor(Math.random() * 3))
            }

            // Randomly update uptime percentage
            const uptimeChange = (Math.random() - 0.5) * 0.5 // ±0.25%
            const newUptimePct = Math.max(0, Math.min(100, device.uptimePct + uptimeChange))

            return {
              ...device,
              batteryLevel: newBatteryLevel,
              uptimePct: Number(newUptimePct.toFixed(1)),
            }
          }
          return device
        }),
        lastUpdateTime: new Date().toISOString(),
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

  exportDevicesCSV: () => {
    const deviceData = get().getFilteredDevices()
    const csvData = deviceData.map(device => ({
      Name: device.name,
      Zone: device.zone,
      Status: device.status,
      'Last Action': new Date(device.lastAction).toLocaleString(),
      'Next Schedule': device.nextSchedule
        ? new Date(device.nextSchedule).toLocaleString()
        : 'None',
      'Uptime %': device.uptimePct,
      'Battery Level': device.batteryLevel || 'N/A',
      'Needs Maintenance': device.needsMaintenance ? 'Yes' : 'No',
    }))

    exportToCSV(csvData, `devices-${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Search and filter actions
  setSearch: (query: string) => {
    set(state => ({
      searchState: { ...state.searchState, query },
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
    set(state => ({
      searchState: { ...state.searchState, sortBy, sortOrder },
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setFilters: (filters: Partial<DeviceFilterData>) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  clearFilters: () => {
    set(state => ({
      filters: {},
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setPagination: (page: number, pageSize?: number) => {
    set(state => ({
      paginationState: {
        ...state.paginationState,
        page,
        pageSize: pageSize || state.paginationState.pageSize,
      },
    }))
  },

  // Selection actions
  toggleDeviceSelection: (deviceId: string) => {
    set(state => ({
      selectedDeviceIds: state.selectedDeviceIds.includes(deviceId)
        ? state.selectedDeviceIds.filter(id => id !== deviceId)
        : [...state.selectedDeviceIds, deviceId],
    }))
  },

  selectAllDevices: () => {
    const devices = get().getFilteredDevices()
    set({ selectedDeviceIds: devices.map(d => d.id) })
  },

  clearSelection: () => {
    set({ selectedDeviceIds: [] })
  },

  // UI actions
  setViewMode: (mode: DeviceViewMode) => {
    set({ viewMode: mode })
    userPreferences.set({
      lastSelectedTab: {
        ...userPreferences.get().lastSelectedTab,
        staffOperations: mode,
      },
    })
  },

  setTableDensity: (density: TableDensity) => {
    set({ tableDensity: density })
    userPreferences.set({ tableDensity: density })
  },

  setAutoRefresh: (enabled: boolean) => {
    set({ autoRefresh: enabled })
  },

  setRefreshInterval: (seconds: number) => {
    set({ refreshInterval: seconds })
  },

  setLoadingState: (key: string, state: LoadingState) => {
    set(currentState => ({
      loadingStates: {
        ...currentState.loadingStates,
        [key]: state,
      },
    }))
  },

  // Computed getters
  getFilteredDevices: () => {
    const { devices, searchState, filters } = get()

    let filtered = devices

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        device =>
          device.name.toLowerCase().includes(query) ||
          device.zone.toLowerCase().includes(query) ||
          device.status.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(device => device.status === filters.status)
    }

    if (filters.zone) {
      filtered = filtered.filter(device => device.zone === filters.zone)
    }

    if (filters.needsMaintenance !== undefined) {
      filtered = filtered.filter(device => device.needsMaintenance === filters.needsMaintenance)
    }

    if (filters.batteryLevel && filters.batteryLevel !== 'all') {
      filtered = filtered.filter(device => {
        if (!device.batteryLevel) return false

        switch (filters.batteryLevel) {
          case 'low':
            return device.batteryLevel <= 25
          case 'medium':
            return device.batteryLevel > 25 && device.batteryLevel <= 75
          case 'high':
            return device.batteryLevel > 75
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'lastAction') {
        aValue = new Date(a.lastAction).getTime()
        bValue = new Date(b.lastAction).getTime()
      } else if (searchState.sortBy === 'batteryLevel') {
        aValue = a.batteryLevel || 0
        bValue = b.batteryLevel || 0
      } else {
        aValue = a[searchState.sortBy as keyof StaffDevice] as any
        bValue = b[searchState.sortBy as keyof StaffDevice] as any
      }

      const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedDevices: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredDevices()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getTotalCount: () => {
    return get().getFilteredDevices().length
  },

  getDevicesByZone: () => {
    const devices = get().devices
    return devices.reduce(
      (acc, device) => {
        if (!acc[device.zone]) {
          acc[device.zone] = []
        }
        acc[device.zone].push(device)
        return acc
      },
      {} as Record<string, StaffDevice[]>
    )
  },

  getDevicesByStatus: () => {
    const devices = get().devices
    return devices.reduce(
      (acc, device) => {
        acc[device.status] = (acc[device.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  },

  getMaintenanceDevices: () => {
    const devices = get().devices
    return devices.filter(device => device.needsMaintenance || device.status === 'Maintenance')
  },

  getLowBatteryDevices: () => {
    const devices = get().devices
    return devices.filter(device => device.batteryLevel !== undefined && device.batteryLevel <= 25)
  },

  getZonesList: () => {
    const devices = get().devices
    const zones = Array.from(new Set(devices.map(d => d.zone)))
    return zones.sort()
  },
}))
