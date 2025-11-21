import { create } from 'zustand'
import type {
  User,
  UserRole,
  UserStatus,
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
  GenderOption,
} from '@/shared/lib/localData'
import { userPreferences } from '@/shared/lib/localData/storage'
import { accountApi, type AccountDto } from '@/shared/api/auth'
import { mapErrorToVietnamese } from '@/shared/lib/error-handler'
import type { UserFormData } from '../model/schemas'

interface Role {
  id: string
  name: UserRole
  description: string
}

const initialRoles: Role[] = [
  { id: '1', name: 'CUSTOMER', description: 'Customer role' },
  { id: '2', name: 'MANAGER', description: 'Manager role' },
  { id: '3', name: 'STAFF', description: 'Staff role' },
]

const roleValueToId: Record<UserRole, number> = {
  CUSTOMER: 0,
  MANAGER: 2,
  STAFF: 3,
}

const genderValueToId: Record<GenderOption, number> = {
  Male: 0,
  Female: 1,
  Other: 2,
}

const normalizeGender = (gender?: string): GenderOption => {
  if (!gender) {
    return 'Male'
  }
  const normalized = gender.toLowerCase()
  if (normalized.startsWith('f')) return 'Female'
  if (normalized.startsWith('o')) return 'Other'
  return 'Male'
}

interface AdminUsersState {
  users: User[]
  roles: Role[]

  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedUserIds: string[]

  roleFilter: string
  statusFilter: string

  initializeData: () => void

  createUser: (data: UserFormData) => Promise<void>
  updateUser: (id: string, data: Partial<UserFormData>) => Promise<void>

  bulkActivateUsers: (userIds: string[]) => Promise<void>
  bulkDeactivateUsers: (userIds: string[]) => Promise<void>
  bulkAssignRole: (userIds: string[], role: UserRole) => Promise<void>

  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setRoleFilter: (role: string) => void
  setStatusFilter: (status: string) => void
  setPagination: (page: number, pageSize?: number) => void

  toggleUserSelection: (userId: string) => void
  selectAllUsers: () => void
  clearSelection: () => void

  setTableDensity: (density: TableDensity) => void
  setLoadingState: (key: string, state: LoadingState) => void

  getFilteredUsers: () => User[]
  getPaginatedUsers: () => User[]
  getTotalCount: () => number
  getRoleById: (roleId: string) => Role | undefined
  getUsersWithRoleDetails: () => (User & { roleDetails: Role[] })[]
  getInactiveUsersCount: () => number
}

export const useAdminUsersStore = create<AdminUsersState>((set, get) => ({
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

  initializeData: async () => {
    const prefs = userPreferences.get()
    const key = 'fetch-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      const { paginationState, statusFilter } = get()
      const response = await accountApi.getAll({
        pageSize: paginationState.pageSize,
        pageIndex: paginationState.page,
        // Omit role filter to fetch all roles by default
        role: undefined,
        status: statusFilter ? (statusFilter as 'Active' | 'Inactive') : undefined,
      })

      const users: User[] = response.items.map((a: AccountDto) => {
        if (!a.accountId) {
          throw new Error(`Account ${a.email} is missing accountId from API`)
        }

        const isActive =
          (typeof a.status === 'number' && a.status === 1) ||
          (typeof a.status === 'string' && (a.status === 'ACTIVE' || a.status === 'Active'))
        const profile = a.accountProfile

        return {
          id: String(a.accountId),
          name: profile?.fullname || a.email,
          email: a.email,
          roles: [a.role.toUpperCase() as UserRole],
          status: (isActive ? 'Active' : 'Inactive') as UserStatus,
          lastLogin: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {
            fullname: profile?.fullname || a.email,
            phone: profile?.phone || '',
            address: profile?.address || '',
            gender: normalizeGender(profile?.gender),
            images: profile?.images || '',
          },
        }
      })

      const currentPaginationState = get().paginationState
      // Keep the current page from state to ensure UI displays the correct page number
      // The API response pageIndex should match what we sent, but we trust our state more
      set({
        users,
        roles: [...initialRoles],
        tableDensity: prefs.tableDensity,
        paginationState: {
          page: currentPaginationState.page,
          pageSize: response.pageSize,
          total: response.totalItemCount,
        },
      })
      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
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

  createUser: async (data: UserFormData) => {
    const key = 'create-user'
    get().setLoadingState(key, { isLoading: true })

    try {
      const roleId = roleValueToId[data.role] ?? roleValueToId.STAFF
      const genderId = genderValueToId[data.gender] ?? genderValueToId.Male

      await accountApi.create({
        email: data.email,
        gender: genderId,
        role: roleId,
        phone: data.phone,
        fullname: data.name,
        address: data.address,
        images: data.images || undefined,
      })

      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  updateUser: async (id: string, data: Partial<UserFormData>) => {
    const key = `update-user-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      const userId = Number(id)
      if (isNaN(userId)) {
        throw new Error(`Invalid user ID: ${id}`)
      }

      const existingUser = get().users.find(u => u.id === id)
      if (!existingUser) {
        throw new Error('Không tìm thấy người dùng để cập nhật')
      }

      const currentProfile = existingUser.profile || {}
      const desiredRole: UserRole = data.role ?? existingUser.roles[0] ?? 'STAFF'
      const desiredStatus: UserStatus = data.status ?? existingUser.status
      const desiredName = data.name ?? currentProfile.fullname ?? existingUser.name
      const desiredEmail = data.email ?? existingUser.email
      const desiredGender: GenderOption = data.gender ?? currentProfile.gender ?? 'Male'
      const desiredPhone = data.phone ?? currentProfile.phone ?? ''
      const desiredAddress = data.address ?? currentProfile.address ?? ''
      const desiredImages = data.images ?? currentProfile.images ?? ''

      const updates: Promise<unknown>[] = []

      const roleChanged = desiredRole !== (existingUser.roles[0] || 'STAFF')
      if (roleChanged) {
        const roleId = roleValueToId[desiredRole]
        updates.push(accountApi.updateRole(userId, roleId))
      }

      const statusChanged = desiredStatus !== existingUser.status
      if (statusChanged) {
        updates.push(accountApi.updateStatus(userId))
      }

      const profileChanged =
        desiredName !== (currentProfile.fullname || existingUser.name) ||
        desiredEmail !== existingUser.email ||
        desiredGender !== (currentProfile.gender || 'Male') ||
        desiredPhone !== (currentProfile.phone || '') ||
        desiredAddress !== (currentProfile.address || '') ||
        desiredImages !== (currentProfile.images || '')

      if (profileChanged) {
        updates.push(
          accountApi.update(userId, {
            email: desiredEmail,
            gender: genderValueToId[desiredGender],
            role: roleValueToId[desiredRole],
            phone: desiredPhone,
            fullname: desiredName,
            address: desiredAddress,
            images: desiredImages || undefined,
          })
        )
      }

      if (updates.length === 0) {
        throw new Error('Không có thông tin được thay đổi')
      }

      await Promise.all(updates)

      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  bulkActivateUsers: async (userIds: string[]) => {
    const key = 'bulk-activate-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      const targetIds = userIds.filter(id => {
        const user = get().users.find(u => u.id === id)
        return user && user.status !== 'Active'
      })

      if (targetIds.length === 0) {
        get().setLoadingState(key, { isLoading: false })
        return
      }

      await Promise.all(targetIds.map(id => accountApi.updateStatus(Number(id))))
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  bulkDeactivateUsers: async (userIds: string[]) => {
    const key = 'bulk-deactivate-users'
    get().setLoadingState(key, { isLoading: true })

    try {
      const targetIds = userIds.filter(id => {
        const user = get().users.find(u => u.id === id)
        return user && user.status !== 'Inactive'
      })

      if (targetIds.length === 0) {
        get().setLoadingState(key, { isLoading: false })
        return
      }

      await Promise.all(targetIds.map(id => accountApi.updateStatus(Number(id))))
      await get().initializeData()

      get().setLoadingState(key, { isLoading: false })
    } catch (error) {
      get().setLoadingState(key, {
        isLoading: false,
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  bulkAssignRole: async (userIds: string[], role: UserRole) => {
    const key = 'bulk-assign-role'
    get().setLoadingState(key, { isLoading: true })

    try {
      await Promise.all(
        userIds.map(id => {
          const roleId = roleValueToId[role]
          if (roleId !== undefined) {
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
        error: mapErrorToVietnamese(error).vietnamese,
      })
      throw error
    }
  },

  setSearch: (query: string) => {
    set(state => ({
      searchState: { ...state.searchState, query },
      paginationState: { ...state.paginationState, page: 1 },
    }))
    // Trigger API refresh when search changes
    get().initializeData()
  },

  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
    set(state => ({
      searchState: { ...state.searchState, sortBy, sortOrder },
      paginationState: { ...state.paginationState, page: 1 },
    }))
    // Trigger API refresh when sort changes
    get().initializeData()
  },

  setRoleFilter: (role: string) => {
    set(state => ({
      roleFilter: role === '__all__' ? '' : role,
      paginationState: { ...state.paginationState, page: 1 },
    }))
    // Note: Role filter is now client-side only since API always fetches all roles
  },

  setStatusFilter: (status: string) => {
    set(state => ({
      statusFilter: status === '__all__' ? '' : status,
      paginationState: { ...state.paginationState, page: 1 },
    }))
    // Trigger API refresh when status filter changes
    get().initializeData()
  },

  setPagination: (page: number, pageSize?: number) => {
    set(state => ({
      paginationState: {
        ...state.paginationState,
        page,
        pageSize: pageSize || state.paginationState.pageSize,
      },
    }))

    get().initializeData()
  },

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

  getFilteredUsers: () => {
    const { users, searchState, roleFilter, statusFilter } = get()

    let filtered = users

    if (roleFilter && roleFilter !== '__all__') {
      filtered = filtered.filter(user => user.roles[0] === roleFilter)
    }

    if (statusFilter && statusFilter !== '__all__') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.roles[0] || '').toLowerCase().includes(query)
      )
    }

    filtered = filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

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

      let comparison: number

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else {
        const numericA = typeof aValue === 'number' ? aValue : Number(aValue) || 0
        const numericB = typeof bValue === 'number' ? bValue : Number(bValue) || 0
        comparison = numericA - numericB
      }

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedUsers: () => {
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
