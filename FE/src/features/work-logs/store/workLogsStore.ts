import { create } from 'zustand'
import type {
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import { simulateLatency, simulateError, userPreferences } from '@/shared/lib/localData/storage'
import type { WorkLogData, WorkLogFilterData } from '../model/schemas'

// Mock work log data
const mockWorkLogs: WorkLogData[] = [
  {
    id: 'wl-001',
    date: '2024-01-15',
    startTime: '08:00',
    endTime: '12:00',
    task: 'Quản lý tưới tiêu',
    zone: 'Zone A - Greenhouse 1',
    description:
      'Kiểm tra và điều chỉnh hệ thống tưới tiêu để phân phối nước tối ưu trong khu nhà kính A',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'John Smith',
    equipment: ['0', '11'], // Hệ thống tưới tiêu, Dụng cụ cầm tay
    notes: 'Hệ thống hoạt động tốt, điều chỉnh nhỏ ở khu vực 3',
    weather: {
      temperature: 24,
      humidity: 65,
      conditions: 'Nắng',
    },
  },
  {
    id: 'wl-002',
    date: '2024-01-15',
    startTime: '13:00',
    endTime: '16:30',
    task: 'Giám sát cây trồng',
    zone: 'Zone B - Outdoor Field',
    description: 'Đánh giá sức khỏe cây trồng hàng tuần và theo dõi tăng trưởng cây cà chua',
    status: 'completed',
    priority: 'high',
    assignedTo: 'Maria Garcia',
    equipment: ['10', '8'], // Máy bay không người lái, Máy kiểm tra đất
    notes: 'Tốc độ tăng trưởng tốt, không phát hiện dấu hiệu bệnh tật',
    weather: {
      temperature: 26,
      humidity: 58,
      conditions: 'Có mây',
    },
  },
  {
    id: 'wl-003',
    date: '2024-01-16',
    startTime: '07:00',
    endTime: '10:00',
    task: 'Kiểm soát sâu bệnh',
    zone: 'Zone C - Nursery',
    description: 'Áp dụng thuốc trừ sâu hữu cơ để ngăn ngừa sự xâm nhập của rệp',
    status: 'in-progress',
    priority: 'urgent',
    assignedTo: 'David Chen',
    equipment: ['2', '12'], // Máy phun thuốc, Thiết bị an toàn
    notes: 'Đã áp dụng thuốc điều trị, theo dõi hiệu quả trong 48 giờ tới',
  },
  {
    id: 'wl-004',
    date: '2024-01-16',
    startTime: '14:00',
    endTime: '17:00',
    task: 'Bảo trì thiết bị',
    zone: 'Zone D - Research Area',
    description: 'Bảo trì định kỳ và hiệu chuẩn thiết bị theo dõi thời tiết',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'Sarah Johnson',
    equipment: ['9', '11'], // Trạm thời tiết, Dụng cụ cầm tay
    notes: 'Tất cả cảm biến đã được hiệu chuẩn và hoạt động chính xác',
  },
  {
    id: 'wl-005',
    date: '2024-01-17',
    startTime: '09:00',
    endTime: '15:00',
    task: 'Thu hoạch',
    zone: 'Zone E - Field Extension',
    description: 'Thu hoạch rau củ chín và chuẩn bị để phân phối ra thị trường',
    status: 'in-progress',
    priority: 'high',
    assignedTo: 'Mike Wilson',
    equipment: ['3', '1'], // Máy thu hoạch, Máy kéo
    notes: 'Dự kiến năng suất: 500kg rau củ hỗn hợp',
  },
]

interface WorkLogsState {
  // Data
  workLogs: WorkLogData[]

  // UI State
  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedLogIds: string[]

  // Filters
  filters: WorkLogFilterData

  // Actions
  initializeData: () => void

  // Work log operations
  createWorkLog: (data: Omit<WorkLogData, 'id'>) => Promise<void>
  updateWorkLog: (id: string, data: Partial<WorkLogData>) => Promise<void>
  deleteWorkLog: (id: string) => Promise<void>

  // Search and filter actions
  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setFilters: (filters: Partial<WorkLogFilterData>) => void
  clearFilters: () => void
  setPagination: (page: number, pageSize?: number) => void

  // Selection actions
  toggleLogSelection: (logId: string) => void
  selectAllLogs: () => void
  clearSelection: () => void

  // UI actions
  setTableDensity: (density: TableDensity) => void
  setLoadingState: (key: string, state: LoadingState) => void

  // Computed getters
  getFilteredWorkLogs: () => WorkLogData[]
  getPaginatedWorkLogs: () => WorkLogData[]
  getTotalCount: () => number
  getWorkLogsByStatus: () => Record<string, number>
  getWorkLogsByPriority: () => Record<string, number>
  getWorkLogsByZone: () => Record<string, WorkLogData[]>
  getTodayWorkLogs: () => WorkLogData[]
  getUpcomingTasks: () => WorkLogData[]
  getOverdueTasks: () => WorkLogData[]
}

export const useWorkLogsStore = create<WorkLogsState>((set, get) => ({
  // Initial state
  workLogs: [],
  loadingStates: {},
  searchState: {
    query: '',
    sortBy: 'date',
    sortOrder: 'desc',
  },
  paginationState: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  tableDensity: 'comfortable',
  selectedLogIds: [],
  filters: {},

  // Initialize data from mock data
  initializeData: () => {
    const prefs = userPreferences.get()

    set({
      workLogs: [...mockWorkLogs],
      tableDensity: prefs.tableDensity,
    })
  },

  // Work log operations
  createWorkLog: async (data: Omit<WorkLogData, 'id'>) => {
    const key = 'create-work-log'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 800)

      if (simulateError(0.1)) {
        throw new Error('Failed to create work log. Please try again.')
      }

      const newLog: WorkLogData = {
        ...data,
        id: `wl-${Date.now()}`,
      }

      set(state => ({
        workLogs: [newLog, ...state.workLogs],
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

  updateWorkLog: async (id: string, data: Partial<WorkLogData>) => {
    const key = `update-work-log-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 600)

      if (simulateError(0.08)) {
        throw new Error('Failed to update work log. Please try again.')
      }

      set(state => ({
        workLogs: state.workLogs.map(log => (log.id === id ? { ...log, ...data } : log)),
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

  deleteWorkLog: async (id: string) => {
    const key = `delete-work-log-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 400)

      if (simulateError(0.05)) {
        throw new Error('Failed to delete work log. Please try again.')
      }

      set(state => ({
        workLogs: state.workLogs.filter(log => log.id !== id),
        selectedLogIds: state.selectedLogIds.filter(logId => logId !== id),
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

  setFilters: (filters: Partial<WorkLogFilterData>) => {
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
  toggleLogSelection: (logId: string) => {
    set(state => ({
      selectedLogIds: state.selectedLogIds.includes(logId)
        ? state.selectedLogIds.filter(id => id !== logId)
        : [...state.selectedLogIds, logId],
    }))
  },

  selectAllLogs: () => {
    const logs = get().getFilteredWorkLogs()
    set({ selectedLogIds: logs.map(l => l.id).filter(Boolean) as string[] })
  },

  clearSelection: () => {
    set({ selectedLogIds: [] })
  },

  // UI actions
  setTableDensity: (density: TableDensity) => {
    set({ tableDensity: density })
    userPreferences.set({ tableDensity: density })
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
  getFilteredWorkLogs: () => {
    const { workLogs, searchState, filters } = get()

    let filtered = workLogs

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        log =>
          log.task.toLowerCase().includes(query) ||
          log.zone.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query) ||
          (log.assignedTo && log.assignedTo.toLowerCase().includes(query)) ||
          log.status.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status)
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(log => log.priority === filters.priority)
    }

    if (filters.zone) {
      filtered = filtered.filter(log => log.zone === filters.zone)
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(log => log.assignedTo === filters.assignedTo)
    }

    if (filters.task) {
      filtered = filtered.filter(log => log.task === filters.task)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => log.date >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => log.date <= filters.dateTo!)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'date') {
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
      } else if (searchState.sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
      } else {
        aValue = a[searchState.sortBy as keyof WorkLogData] as any
        bValue = b[searchState.sortBy as keyof WorkLogData] as any
      }

      const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedWorkLogs: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredWorkLogs()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getTotalCount: () => {
    return get().getFilteredWorkLogs().length
  },

  getWorkLogsByStatus: () => {
    const workLogs = get().workLogs
    return workLogs.reduce(
      (acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  },

  getWorkLogsByPriority: () => {
    const workLogs = get().workLogs
    return workLogs.reduce(
      (acc, log) => {
        acc[log.priority] = (acc[log.priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  },

  getWorkLogsByZone: () => {
    const workLogs = get().workLogs
    return workLogs.reduce(
      (acc, log) => {
        if (!acc[log.zone]) {
          acc[log.zone] = []
        }
        acc[log.zone].push(log)
        return acc
      },
      {} as Record<string, WorkLogData[]>
    )
  },

  getTodayWorkLogs: () => {
    const today = new Date().toISOString().split('T')[0]
    const workLogs = get().workLogs
    return workLogs.filter(log => log.date === today)
  },

  getUpcomingTasks: () => {
    const today = new Date().toISOString().split('T')[0]
    const workLogs = get().workLogs
    return workLogs.filter(log => log.date > today && log.status === 'in-progress')
  },

  getOverdueTasks: () => {
    const today = new Date().toISOString().split('T')[0]
    const workLogs = get().workLogs
    return workLogs.filter(log => log.date < today && log.status === 'in-progress')
  },
}))
