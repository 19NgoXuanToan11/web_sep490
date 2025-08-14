import { create } from 'zustand'
import type {
  Role,
  Permission,
  LoadingState,
  SearchState,
  PaginationState,
  TableDensity,
} from '@/shared/lib/localData'
import {
  roles as initialRoles,
  permissions as initialPermissions,
} from '@/shared/lib/localData/fixtures'
import {
  simulateLatency,
  simulateError,
  exportToCSV,
  userPreferences,
} from '@/shared/lib/localData/storage'
import type { RoleFormData } from '../model/schemas'
import { SYSTEM_ROLES } from '../model/schemas'

interface AdminRolesState {
  // Data
  roles: Role[]
  permissions: Permission[]

  // UI State
  loadingStates: Record<string, LoadingState>
  searchState: SearchState
  paginationState: PaginationState
  tableDensity: TableDensity
  selectedRoleIds: string[]

  // Actions
  initializeData: () => void

  // Role CRUD operations
  createRole: (data: RoleFormData) => Promise<void>
  updateRole: (id: string, data: Partial<RoleFormData>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  bulkDeleteRoles: (roleIds: string[]) => Promise<void>
  exportRolesCSV: () => void

  // Search and filter actions
  setSearch: (query: string) => void
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  setPagination: (page: number, pageSize?: number) => void

  // Selection actions
  toggleRoleSelection: (roleId: string) => void
  selectAllRoles: () => void
  clearSelection: () => void

  // UI actions
  setTableDensity: (density: TableDensity) => void
  setLoadingState: (key: string, state: LoadingState) => void

  // Computed getters
  getFilteredRoles: () => Role[]
  getPaginatedRoles: () => Role[]
  getTotalCount: () => number
  getPermissionById: (permissionId: string) => Permission | undefined
  getRolesWithPermissionDetails: () => (Role & { permissionDetails: Permission[] })[]
  canDeleteRole: (role: Role) => boolean
  getSystemRolesCount: () => number
  getCustomRolesCount: () => number
}

export const useAdminRolesStore = create<AdminRolesState>((set, get) => ({
  // Initial state
  roles: [],
  permissions: [],
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
  selectedRoleIds: [],

  // Initialize data from fixtures
  initializeData: () => {
    const prefs = userPreferences.get()

    set({
      roles: [...initialRoles],
      permissions: [...initialPermissions],
      tableDensity: prefs.tableDensity,
    })
  },

  // Role CRUD operations
  createRole: async (data: RoleFormData) => {
    const key = 'create-role'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(400, 800)

      if (simulateError(0.12)) {
        throw new Error('Failed to create role. Please try again.')
      }

      // Check for role name uniqueness
      const { roles } = get()
      if (roles.some(r => r.name.toLowerCase() === data.name.toLowerCase())) {
        throw new Error('Role name already exists. Please use a unique role name.')
      }

      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set(state => ({
        roles: [...state.roles, newRole],
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

  updateRole: async (id: string, data: Partial<RoleFormData>) => {
    const key = `update-role-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(300, 600)

      if (simulateError(0.1)) {
        throw new Error('Failed to update role. Please try again.')
      }

      // Check for role name uniqueness if name is being updated
      if (data.name) {
        const { roles } = get()
        const existingRole = roles.find(
          r => r.id !== id && r.name.toLowerCase() === data.name.toLowerCase()
        )
        if (existingRole) {
          throw new Error('Role name already exists. Please use a unique role name.')
        }
      }

      set(state => ({
        roles: state.roles.map(role =>
          role.id === id ? { ...role, ...data, updatedAt: new Date().toISOString() } : role
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

  deleteRole: async (id: string) => {
    const key = `delete-role-${id}`
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(250, 500)

      if (simulateError(0.08)) {
        throw new Error('Failed to delete role. Please try again.')
      }

      const { roles } = get()
      const role = roles.find(r => r.id === id)

      if (role && SYSTEM_ROLES.includes(role.name)) {
        throw new Error('System roles cannot be deleted.')
      }

      set(state => ({
        roles: state.roles.filter(role => role.id !== id),
        selectedRoleIds: state.selectedRoleIds.filter(rid => rid !== id),
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

  bulkDeleteRoles: async (roleIds: string[]) => {
    const key = 'bulk-delete-roles'
    get().setLoadingState(key, { isLoading: true })

    try {
      await simulateLatency(500, 1000)

      if (simulateError(0.1)) {
        throw new Error('Failed to delete roles. Please try again.')
      }

      const { roles } = get()

      // Check if any of the selected roles are system roles
      const systemRoles = roles.filter(r => roleIds.includes(r.id) && SYSTEM_ROLES.includes(r.name))
      if (systemRoles.length > 0) {
        throw new Error(`Cannot delete system roles: ${systemRoles.map(r => r.name).join(', ')}`)
      }

      set(state => ({
        roles: state.roles.filter(role => !roleIds.includes(role.id)),
        selectedRoleIds: state.selectedRoleIds.filter(rid => !roleIds.includes(rid)),
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

  exportRolesCSV: () => {
    const roleData = get().getFilteredRoles()
    const csvData = roleData.map(role => ({
      Name: role.name,
      Description: role.description,
      'Permission Count': role.permissions.length,
      'System Role': SYSTEM_ROLES.includes(role.name) ? 'Yes' : 'No',
      'Created At': new Date(role.createdAt).toLocaleDateString(),
      'Updated At': new Date(role.updatedAt).toLocaleDateString(),
    }))

    exportToCSV(csvData, `roles-${new Date().toISOString().split('T')[0]}.csv`)
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
  toggleRoleSelection: (roleId: string) => {
    set(state => ({
      selectedRoleIds: state.selectedRoleIds.includes(roleId)
        ? state.selectedRoleIds.filter(id => id !== roleId)
        : [...state.selectedRoleIds, roleId],
    }))
  },

  selectAllRoles: () => {
    const roles = get().getFilteredRoles()
    set({ selectedRoleIds: roles.map(r => r.id) })
  },

  clearSelection: () => {
    set({ selectedRoleIds: [] })
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
  getFilteredRoles: () => {
    const { roles, searchState } = get()

    let filtered = roles

    // Apply search filter
    if (searchState.query) {
      const query = searchState.query.toLowerCase()
      filtered = filtered.filter(
        role =>
          role.name.toLowerCase().includes(query) || role.description.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (searchState.sortBy === 'permissionCount') {
        aValue = a.permissions.length
        bValue = b.permissions.length
      } else if (searchState.sortBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else {
        aValue = a[searchState.sortBy as keyof Role] as string
        bValue = b[searchState.sortBy as keyof Role] as string
      }

      const comparison = typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue

      return searchState.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  },

  getPaginatedRoles: () => {
    const { paginationState } = get()
    const filtered = get().getFilteredRoles()
    const startIndex = (paginationState.page - 1) * paginationState.pageSize
    const endIndex = startIndex + paginationState.pageSize

    return filtered.slice(startIndex, endIndex)
  },

  getTotalCount: () => {
    return get().getFilteredRoles().length
  },

  getPermissionById: (permissionId: string) => {
    const { permissions } = get()
    return permissions.find(permission => permission.id === permissionId)
  },

  getRolesWithPermissionDetails: () => {
    const { roles, permissions } = get()
    return roles.map(role => ({
      ...role,
      permissionDetails: role.permissions
        .map(permId => permissions.find(permission => permission.id === permId)!)
        .filter(Boolean),
    }))
  },

  canDeleteRole: (role: Role) => {
    return !SYSTEM_ROLES.includes(role.name)
  },

  getSystemRolesCount: () => {
    const { roles } = get()
    return roles.filter(role => SYSTEM_ROLES.includes(role.name)).length
  },

  getCustomRolesCount: () => {
    const { roles } = get()
    return roles.filter(role => !SYSTEM_ROLES.includes(role.name)).length
  },
}))
