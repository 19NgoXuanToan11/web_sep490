import { create } from 'zustand'
import type {
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import { simulateLatency, simulateError, userPreferences } from '@/shared/lib/localData/storage'
import type { QualityCheckData, QualityCheckFilterData } from '../model/schemas'

// Mock quality check data
const mockQualityChecks: QualityCheckData[] = [
  {
    id: 'qc-001',
    date: '2024-01-15',
    time: '09:00',
    zone: 'Zone A - Greenhouse 1',
    cropType: 'Cà chua',
    checkType: 'routine',
    status: 'pass',
    inspector: 'John Smith',
    overallHealth: 8,
    growthStage: 'fruiting',
    diseasePresent: false,
    pestPresent: false,
    nutrientDeficiency: false,
    plantHeight: 120,
    leafColor: 'healthy-green',
    fruitCount: 15,
    soilMoisture: 65,
    temperature: 24,
    humidity: 68,
    issues: [],
    recommendedActions: ['Theo dõi chặt chẽ'],
    notes: 'Cây trồng cho thấy sự tăng trưởng và phát triển quả tuyệt vời',
    requiresFollowUp: false,
    priority: 'low',
  },
  {
    id: 'qc-002',
    date: '2024-01-15',
    time: '11:30',
    zone: 'Zone B - Outdoor Field',
    cropType: 'Xà lách',
    checkType: 'disease',
    status: 'warning',
    inspector: 'Maria Garcia',
    overallHealth: 6,
    growthStage: 'vegetative',
    diseasePresent: true,
    pestPresent: false,
    nutrientDeficiency: false,
    plantHeight: 25,
    leafColor: 'light-green',
    soilMoisture: 45,
    temperature: 22,
    humidity: 75,
    issues: ['Lá vàng', 'Triệu chứng bệnh tật'],
    recommendedActions: ['Điều trị bệnh tật', 'Theo dõi chặt chẽ'],
    notes: 'Phát hiện dấu hiệu sớm của bệnh nấm ở lá dưới',
    requiresFollowUp: true,
    followUpDate: '2024-01-18',
    priority: 'high',
  },
  {
    id: 'qc-003',
    date: '2024-01-16',
    time: '08:15',
    zone: 'Zone C - Nursery',
    cropType: 'Ớt',
    checkType: 'pest',
    status: 'fail',
    inspector: 'David Chen',
    overallHealth: 4,
    growthStage: 'flowering',
    diseasePresent: false,
    pestPresent: true,
    nutrientDeficiency: true,
    plantHeight: 45,
    leafColor: 'yellow',
    soilMoisture: 35,
    temperature: 26,
    humidity: 55,
    issues: ['Sâu bệnh tấn công', 'Thiếu dinh dưỡng', 'Tăng trưởng chậm'],
    recommendedActions: ['Xử lý sâu bệnh', 'Bón phân', 'Tăng tần suất tưới nước'],
    notes: 'Sâu rệp tấn công nghiêm trọng ảnh hưởng đến nhiều cây',
    requiresFollowUp: true,
    followUpDate: '2024-01-17',
    priority: 'critical',
  },
  {
    id: 'qc-004',
    date: '2024-01-16',
    time: '14:00',
    zone: 'Zone F - Hydroponic Greenhouse',
    cropType: 'Dưa chuột',
    checkType: 'growth',
    status: 'pass',
    inspector: 'Sarah Johnson',
    overallHealth: 9,
    growthStage: 'fruiting',
    diseasePresent: false,
    pestPresent: false,
    nutrientDeficiency: false,
    plantHeight: 180,
    leafColor: 'healthy-green',
    fruitCount: 8,
    soilMoisture: 70,
    temperature: 25,
    humidity: 65,
    issues: [],
    recommendedActions: ['Tiếp tục quy trình chăm sóc hiện tại'],
    notes: 'Tốc độ tăng trưởng và phát triển quả tuyệt vời trong hệ thống thủy canh',
    requiresFollowUp: false,
    priority: 'low',
  },
  {
    id: 'qc-005',
    date: '2024-01-17',
    time: '10:30',
    zone: 'Zone E - Field Extension',
    cropType: 'Dâu tây',
    checkType: 'harvest-ready',
    status: 'pass',
    inspector: 'Mike Wilson',
    overallHealth: 8,
    growthStage: 'mature',
    diseasePresent: false,
    pestPresent: false,
    nutrientDeficiency: false,
    plantHeight: 20,
    leafColor: 'healthy-green',
    fruitCount: 12,
    soilMoisture: 60,
    temperature: 20,
    humidity: 70,
    issues: [],
    recommendedActions: ['Thu hoạch ngay lập tức', 'Chuẩn bị cho thị trường'],
    notes: 'Dâu tây đã đạt độ chín tối ưu để thu hoạch',
    requiresFollowUp: false,
    priority: 'medium',
  },
]

interface QualityChecksState {
  // Data
  qualityChecks: QualityCheckData[]

  // UI State
  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedCheckIds: string[]

  // Filters
  filters: QualityCheckFilterData

  // Actions
  initializeData: () => void

  // Quality check operations
  createQualityCheck: (data: Omit<QualityCheckData, 'id'>) => Promise<void>
  updateQualityCheck: (id: string, data: Partial<QualityCheckData>) => Promise<void>
  deleteQualityCheck: (id: string) => Promise<void>

  // Search and filter actions
  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setFilters: (filters: Partial<QualityCheckFilterData>) => void
  clearFilters: () => void
  setPagination: (page: number, pageSize?: number) => void

  // Selection actions
  toggleCheckSelection: (checkId: string) => void
  selectAllChecks: () => void
  clearSelection: () => void

  // UI actions
  setTableDensity: (density: TableDensity) => void
  setLoadingState: (key: string, state: LoadingState) => void

  // Computed getters
  getFilteredQualityChecks: () => QualityCheckData[]
  getPaginatedQualityChecks: () => QualityCheckData[]
  getTotalCount: () => number
  getChecksByStatus: () => Record<string, number>
  getChecksByPriority: () => Record<string, number>
  getChecksByZone: () => Record<string, QualityCheckData[]>
  getTodayChecks: () => QualityCheckData[]
  getFailedChecks: () => QualityCheckData[]
  getChecksRequiringFollowUp: () => QualityCheckData[]
  getAverageHealthScore: () => number
  getCriticalIssues: () => QualityCheckData[]
}

export const useQualityChecksStore = create<QualityChecksState>((set, get) => ({
  // Initial state
  qualityChecks: [],
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
  selectedCheckIds: [],
  filters: {},

  // Initialize data from mock data
  initializeData: () => {
    const prefs = userPreferences.get()

    set({
      qualityChecks: [...mockQualityChecks],
      tableDensity: prefs.tableDensity,
    })
  },

  // Quality check operations
  createQualityCheck: async (data: Omit<QualityCheckData, 'id'>) => {
    const key = 'create-quality-check'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 800)

      if (simulateError(0.1)) {
        throw new Error('Không thể tạo kiểm tra chất lượng. Vui lòng thử lại.')
      }

      const newCheck: QualityCheckData = {
        ...data,
        id: `qc-${Date.now()}`,
      }

      set(state => ({
        qualityChecks: [newCheck, ...state.qualityChecks],
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      })
      throw error
    }
  },

  updateQualityCheck: async (id: string, data: Partial<QualityCheckData>) => {
    const key = `update-quality-check-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 600)

      if (simulateError(0.08)) {
        throw new Error('Không thể cập nhật kiểm tra chất lượng. Vui lòng thử lại.')
      }

      set(state => ({
        qualityChecks: state.qualityChecks.map(check =>
          check.id === id ? { ...check, ...data } : check
        ),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      })
      throw error
    }
  },

  deleteQualityCheck: async (id: string) => {
    const key = `delete-quality-check-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(200, 400)

      if (simulateError(0.05)) {
        throw new Error('Không thể xóa kiểm tra chất lượng. Vui lòng thử lại.')
      }

      set(state => ({
        qualityChecks: state.qualityChecks.filter(check => check.id !== id),
        selectedCheckIds: state.selectedCheckIds.filter(checkId => checkId !== id),
      }))

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
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

  setFilters: (filters: Partial<QualityCheckFilterData>) => {
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
  toggleCheckSelection: (checkId: string) => {
    set(state => ({
      selectedCheckIds: state.selectedCheckIds.includes(checkId)
        ? state.selectedCheckIds.filter(id => id !== checkId)
        : [...state.selectedCheckIds, checkId],
    }))
  },

  selectAllChecks: () => {
    const checks = get().getFilteredQualityChecks()
    set({ selectedCheckIds: checks.map(c => c.id).filter(Boolean) as string[] })
  },

  clearSelection: () => {
    set({ selectedCheckIds: [] })
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
  getFilteredQualityChecks: () => {
    const { qualityChecks, searchState, filters } = get()

    let filtered = qualityChecks

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        check =>
          check.cropType.toLowerCase().includes(query) ||
          check.zone.toLowerCase().includes(query) ||
          check.inspector.toLowerCase().includes(query) ||
          check.status.toLowerCase().includes(query) ||
          check.checkType.toLowerCase().includes(query) ||
          (check.notes && check.notes.toLowerCase().includes(query))
      )
    }

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(check => check.status === filters.status)
    }

    if (filters.checkType && filters.checkType !== 'all') {
      filtered = filtered.filter(check => check.checkType === filters.checkType)
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(check => check.priority === filters.priority)
    }

    if (filters.zone) {
      filtered = filtered.filter(check => check.zone === filters.zone)
    }

    if (filters.cropType) {
      filtered = filtered.filter(check => check.cropType === filters.cropType)
    }

    if (filters.inspector) {
      filtered = filtered.filter(check => check.inspector === filters.inspector)
    }

    if (filters.requiresFollowUp !== undefined) {
      filtered = filtered.filter(check => check.requiresFollowUp === filters.requiresFollowUp)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(check => check.date >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      filtered = filtered.filter(check => check.date <= filters.dateTo!)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'date') {
        aValue = new Date(`${a.date} ${a.time}`).getTime()
        bValue = new Date(`${b.date} ${b.time}`).getTime()
      } else if (searchState.sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
      } else if (searchState.sortBy === 'overallHealth') {
        aValue = a.overallHealth
        bValue = b.overallHealth
      } else {
        aValue = a[searchState.sortBy as keyof QualityCheckData] as any
        bValue = b[searchState.sortBy as keyof QualityCheckData] as any
      }

      const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedQualityChecks: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredQualityChecks()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getTotalCount: () => {
    return get().getFilteredQualityChecks().length
  },

  getChecksByStatus: () => {
    const qualityChecks = get().qualityChecks
    return qualityChecks.reduce(
      (acc, check) => {
        acc[check.status] = (acc[check.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  },

  getChecksByPriority: () => {
    const qualityChecks = get().qualityChecks
    return qualityChecks.reduce(
      (acc, check) => {
        acc[check.priority] = (acc[check.priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  },

  getChecksByZone: () => {
    const qualityChecks = get().qualityChecks
    return qualityChecks.reduce(
      (acc, check) => {
        if (!acc[check.zone]) {
          acc[check.zone] = []
        }
        acc[check.zone].push(check)
        return acc
      },
      {} as Record<string, QualityCheckData[]>
    )
  },

  getTodayChecks: () => {
    const today = new Date().toISOString().split('T')[0]
    const qualityChecks = get().qualityChecks
    return qualityChecks.filter(check => check.date === today)
  },

  getFailedChecks: () => {
    const qualityChecks = get().qualityChecks
    return qualityChecks.filter(check => check.status === 'fail')
  },

  getChecksRequiringFollowUp: () => {
    const qualityChecks = get().qualityChecks
    return qualityChecks.filter(check => check.requiresFollowUp)
  },

  getAverageHealthScore: () => {
    const qualityChecks = get().qualityChecks
    if (qualityChecks.length === 0) return 0

    const totalHealth = qualityChecks.reduce((sum, check) => sum + check.overallHealth, 0)
    return Number((totalHealth / qualityChecks.length).toFixed(1))
  },

  getCriticalIssues: () => {
    const qualityChecks = get().qualityChecks
    return qualityChecks.filter(
      check =>
        check.priority === 'critical' ||
        check.status === 'fail' ||
        check.diseasePresent ||
        check.pestPresent
    )
  },
}))
