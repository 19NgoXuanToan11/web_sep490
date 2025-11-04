import { create } from 'zustand'
import type {
  User,
  UserRole,
  UserStatus,
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import { userPreferences } from '@/shared/lib/localData/storage'
import { accountApi, type AccountDto } from '@/shared/api/auth'
import type { UserFormData } from '../model/schemas'

// Define Role interface locally
interface Role {
  id: string
  name: UserRole
  description: string
}

// Define initial roles
const initialRoles: Role[] = [
  { id: '1', name: 'CUSTOMER', description: 'Customer role' },
  { id: '2', name: 'MANAGER', description: 'Manager role' },
  { id: '3', name: 'STAFF', description: 'Staff role' },
]

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
    const key = 'fetch-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      const { paginationState, roleFilter, statusFilter } = get()
      const response = await accountApi.getAll({
        pageSize: paginationState.pageSize,
        pageIndex: paginationState.page,
        role: roleFilter ? (roleFilter as 'Customer' | 'Manager' | 'Staff') : undefined,
        status: statusFilter ? (statusFilter as 'Active' | 'Inactive') : undefined,
      })

      const users: User[] = response.items.map((a: AccountDto) => {
        // Ensure we have a valid ID from the API
        if (!a.accountId) {
          throw new Error(`Account ${a.email} is missing accountId from API`)
        }

        return {
          id: String(a.accountId),
          name: a.email,
          email: a.email,
          roles: [a.role.toUpperCase() as UserRole],
          status:
            (a.status as any) === 1 || a.status === 'ACTIVE' || a.status === 'Active'
              ? ('Active' as UserStatus)
              : ('Inactive' as UserStatus),
          lastLogin: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })

      set({
        users,
        roles: [...initialRoles],
        tableDensity: prefs.tableDensity,
        paginationState: {
          page: response.pageIndex,
          pageSize: response.pageSize,
          total: response.totalItemCount,
        },
      })
      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      // keep state empty; UI should show toast elsewhere if needed
      set({
        users: [],
        roles: [...initialRoles],
        tableDensity: prefs.tableDensity,
      })
      get().setLoadingState(key, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load users',
      })
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
        role: (data.role || 'Staff') as any,
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
      // Validate user ID
      const userId = Number(id)
      if (isNaN(userId)) {
        throw new Error(`Invalid user ID: ${id}`)
      }

      // Map role names to role IDs (based on backend enum: Customer=0, Admin=1, Manager=2, Staff=3)
      const roleMap = {
        CUSTOMER: 0,
        ADMIN: 1,
        MANAGER: 2,
        STAFF: 3,
      } as const

      if (data.role) {
        const roleId = roleMap[data.role as keyof typeof roleMap]
        if (roleId !== undefined) {
          await accountApi.updateRole(userId, roleId)
        } else {
          throw new Error(`Invalid role: ${data.role}`)
        }
      } else {
        throw new Error('No role specified')
      }

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
      // Map role names to role IDs (based on backend enum: Customer=0, Admin=1, Manager=2, Staff=3)
      const roleMap = {
        CUSTOMER: 0,
        MANAGER: 2,
        STAFF: 3,
      } as const

      await Promise.all(
        userIds.map(id => {
          const roleId = roleMap[role as keyof typeof roleMap]
          if (roleId) {
            return accountApi.updateRole(Number(id), roleId)
          }
          throw new Error(`Invalid role: ${role}`)
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
    // Reload data with new pagination
    get().initializeData()
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

    // Apply role filter
    if (roleFilter && roleFilter !== '__all__') {
      filtered = filtered.filter(user => user.roles[0] === roleFilter)
    }

    // Apply status filter
    if (statusFilter && statusFilter !== '__all__') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    // Only apply frontend search filter if we have a local search query
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.roles[0] || '').toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'lastLogin') {
        aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
        bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
      } else if (searchState.sortBy === 'roles') {
        aValue = a.roles[0] || 'STAFF'
        bValue = b.roles[0] || 'STAFF'
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
    // Since pagination is handled by backend, just return filtered users
    return get().getFilteredUsers()
  },

  getTotalCount: () => {
    return get().paginationState.total
  },

  getRoleById: (roleId: string) => {
    const { roles } = get()
    return roles.find(role => role.id === roleId)
  },

  getUsersWithRoleDetails: () => {
    const { users, roles } = get()
    return users.map(user => ({
      ...user,
      roleDetails: [roles.find(role => role.name === user.roles[0])].filter(Boolean) as Role[],
    }))
  },

  getInactiveUsersCount: () => {
    const { users } = get()
    return users.filter(user => user.status === 'Inactive').length
  },
}))
