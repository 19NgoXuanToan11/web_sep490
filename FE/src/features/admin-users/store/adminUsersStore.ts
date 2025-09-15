import { create } from 'zustand'
import type {
  User,
  Role,
  UserRole,
  UserStatus,
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import { roles as initialRoles } from '@/shared/lib/localData/fixtures'
import { exportToCSV, userPreferences } from '@/shared/lib/localData/storage'
import { accountApi, type AccountDto } from '@/shared/api/auth'
import type { UserFormData } from '../model/schemas'

interface AdminUsersState {
  // Data
  users: User[]
  roles: Role[]

  // UI State
  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedUserIds: string[]

  // Filters
  roleFilter: string
  statusFilter: string

  // Actions
  initializeData: () => void

  // User CRUD operations
  createUser: (data: UserFormData) => Promise<void>
  updateUser: (id: string, data: Partial<UserFormData>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  bulkDeleteUsers: (userIds: string[]) => Promise<void>

  // Bulk actions
  bulkActivateUsers: (userIds: string[]) => Promise<void>
  bulkDeactivateUsers: (userIds: string[]) => Promise<void>
  bulkAssignRole: (userIds: string[], role: UserRole) => Promise<void>
  exportUsersCSV: () => void

  // Search and filter actions
  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setRoleFilter: (role: string) => void
  setStatusFilter: (status: string) => void
  setPagination: (page: number, pageSize?: number) => void

  // Selection actions
  toggleUserSelection: (userId: string) => void
  selectAllUsers: () => void
  clearSelection: () => void

  // UI actions
  setTableDensity: (density: TableDensity) => void
  setLoadingState: (key: string, state: LoadingState) => void

  // Computed getters
  getFilteredUsers: () => User[]
  getPaginatedUsers: () => User[]
  getTotalCount: () => number
  getRoleById: (roleId: string) => Role | undefined
  getUsersWithRoleDetails: () => (User & { roleDetails: Role[] })[]
  getInactiveUsersCount: () => number
}

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
  // Initial state
  users: [],
  roles: [],
  loadingStates: {},
  searchState: {
    query: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },
  paginationState: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  tableDensity: 'comfortable',
  selectedUserIds: [],
  roleFilter: '',
  statusFilter: '',

  // Initialize data from API
  initializeData: async () => {
    const prefs = userPreferences.get()
    try {
      const accounts = await accountApi.getAll()
      const users: User[] = accounts.map((a: AccountDto) => ({
        id: String(a.id),
        name: a.email,
        email: a.email,
        roles: [a.role.toUpperCase() as UserRole],
        status: a.status === 'Active' ? ('Active' as UserStatus) : ('Inactive' as UserStatus),
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
      set({ users, roles: [...initialRoles], tableDensity: prefs.tableDensity })
    } catch (error) {
      // keep state empty; UI should show toast elsewhere if needed
      set({ users: [], roles: [...initialRoles], tableDensity: prefs.tableDensity })
    }
  },

  // User CRUD operations
  createUser: async (data: UserFormData) => {
    const key = 'create-user'
    get().setLoadingState(key, { isLoading: true })

    try {
      await accountApi.create({
        email: data.email,
        password: 'Password@123',
        role: (data.roles[0] || 'Staff') as any,
      })
      // reload list
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  updateUser: async (id: string, data: Partial<UserFormData>) => {
    const key = `update-user-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await accountApi.update(Number(id), {
        email: data.email,
        role: data.roles && data.roles[0] ? (data.roles[0] as any) : undefined,
      })
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  deleteUser: async (id: string) => {
    const key = `delete-user-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      // No delete endpoint in list, emulate deactivate
      await accountApi.updateStatus(Number(id), { status: 'Inactive' })
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  bulkDeleteUsers: async (userIds: string[]) => {
    const key = 'bulk-delete-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      await Promise.all(
        userIds.map(id => accountApi.updateStatus(Number(id), { status: 'Inactive' }))
      )
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  // Bulk actions
  bulkActivateUsers: async (userIds: string[]) => {
    const key = 'bulk-activate-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      await Promise.all(
        userIds.map(id => accountApi.updateStatus(Number(id), { status: 'Active' }))
      )
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  bulkDeactivateUsers: async (userIds: string[]) => {
    const key = 'bulk-deactivate-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      await Promise.all(
        userIds.map(id => accountApi.updateStatus(Number(id), { status: 'Inactive' }))
      )
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  bulkAssignRole: async (userIds: string[], role: UserRole) => {
    const key = 'bulk-assign-role'
    get().setLoadingState(key, { isLoading: true })

    try {
      await Promise.all(
        userIds.map(async id => {
          const user = get().users.find(u => u.id === id)
          const email = user?.email || ''
          return accountApi.updateRole({ email, role: role as any })
        })
      )
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  },

  exportUsersCSV: () => {
    const userData = get().getFilteredUsers()
    const csvData = userData.map(user => ({
      Name: user.name,
      Email: user.email,
      Roles: user.roles.join(', '),
      Status: user.status,
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      'Created At': new Date(user.createdAt).toLocaleDateString(),
      'Updated At': new Date(user.updatedAt).toLocaleDateString(),
    }))

    exportToCSV(csvData, `users-${new Date().toISOString().split('T')[0]}.csv`)
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

  setRoleFilter: (role: string) => {
    set(state => ({
      roleFilter: role === '__all__' ? '' : role,
      paginationState: { ...state.paginationState, page: 1 },
    }))
  },

  setStatusFilter: (status: string) => {
    set(state => ({
      statusFilter: status === '__all__' ? '' : status,
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
  toggleUserSelection: (userId: string) => {
    set(state => ({
      selectedUserIds: state.selectedUserIds.includes(userId)
        ? state.selectedUserIds.filter(id => id !== userId)
        : [...state.selectedUserIds, userId],
    }))
  },

  selectAllUsers: () => {
    const users = get().getFilteredUsers()
    set({ selectedUserIds: users.map(u => u.id) })
  },

  clearSelection: () => {
    set({ selectedUserIds: [] })
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
  getFilteredUsers: () => {
    const { users, searchState, roleFilter, statusFilter } = get()

    let filtered = users

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.roles.some(role => role.toLowerCase().includes(query))
      )
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.roles.includes(roleFilter as UserRole))
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'lastLogin') {
        aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
        bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
      } else if (searchState.sortBy === 'roles') {
        aValue = a.roles.join(', ')
        bValue = b.roles.join(', ')
      } else {
        aValue = a[searchState.sortBy as keyof User] as string
        bValue = b[searchState.sortBy as keyof User] as string
      }

      const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedUsers: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredUsers()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getTotalCount: () => {
    return get().getFilteredUsers().length
  },

  getRoleById: (roleId: string) => {
    const { roles } = get()
    return roles.find(role => role.id === roleId)
  },

  getUsersWithRoleDetails: () => {
    const { users, roles } = get()
    return users.map(user => ({
      ...user,
      roleDetails: user.roles
        .map(roleName => roles.find(role => role.name === roleName)!)
        .filter(Boolean),
    }))
  },

  getInactiveUsersCount: () => {
    const { users } = get()
    return users.filter(user => user.status === 'Inactive').length
  },
}))
