import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  Lock,
  Settings,
} from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { Checkbox } from '@/shared/ui/checkbox'
import { useAdminRolesStore } from '../store/adminRolesStore'
import { SYSTEM_ROLES } from '../model/schemas'
import type { Role } from '@/shared/lib/localData'
import { formatDate } from '@/shared/lib/localData/storage'

interface RolesTableProps {
  onEditRole?: (role: Role) => void
  onViewPermissions?: (role: Role) => void
  onDeleteRole?: (role: Role) => void
  onBulkAction?: (action: string, roleIds: string[]) => void
}

export const RolesTable: React.FC<RolesTableProps> = ({
  onEditRole,
  onViewPermissions,
  onDeleteRole,
  onBulkAction,
}) => {
  const {
    searchState,
    selectedRoleIds,
    tableDensity,
    loadingStates,
    setSearch,
    setSort,
    toggleRoleSelection,
    selectAllRoles,
    clearSelection,
    getPaginatedRoles,
    getFilteredRoles,
    getTotalCount,
    canDeleteRole,
  } = useAdminRolesStore()

  const roles = getPaginatedRoles()
  const filteredRoles = getFilteredRoles()
  const totalCount = getTotalCount()
  const isLoading = loadingStates['fetch-roles']?.isLoading

  // Filter out system roles from selection for bulk operations
  const selectableRoles = filteredRoles.filter(role => canDeleteRole(role))
  const isAllSelected =
    selectedRoleIds.length > 0 && selectedRoleIds.length === selectableRoles.length
  const isIndeterminate =
    selectedRoleIds.length > 0 && selectedRoleIds.length < selectableRoles.length

  const handleSort = (column: string) => {
    const newOrder =
      searchState.sortBy === column && searchState.sortOrder === 'asc' ? 'desc' : 'asc'
    setSort(column, newOrder)
  }

  const getSortIcon = (column: string) => {
    if (searchState.sortBy !== column) return <ArrowUpDown className="h-4 w-4" />
    return searchState.sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection()
    } else {
      // Only select non-system roles
      const selectableIds = selectableRoles.map(r => r.id)
      selectableIds.forEach(id => {
        if (!selectedRoleIds.includes(id)) {
          toggleRoleSelection(id)
        }
      })
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedRoleIds.length === 0) return
    onBulkAction?.(action, selectedRoleIds)
  }

  const getRoleBadge = (role: Role) => {
    const isSystemRole = SYSTEM_ROLES.includes(role.name)
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant={isSystemRole ? 'default' : 'secondary'}
          className={`${isSystemRole ? 'bg-blue-100 text-blue-800' : ''}`}
        >
          {isSystemRole && <Lock className="h-3 w-3 mr-1" />}
          {role.name}
        </Badge>
        {isSystemRole && (
          <Badge variant="outline" className="text-xs">
            System
          </Badge>
        )}
      </div>
    )
  }

  const getPermissionsBadge = (permissionCount: number) => {
    let variant: 'default' | 'secondary' | 'destructive' = 'secondary'
    let color = 'text-gray-600'

    if (permissionCount >= 8) {
      variant = 'destructive'
      color = 'text-red-600'
    } else if (permissionCount >= 5) {
      variant = 'default'
      color = 'text-green-600'
    }

    return (
      <Badge variant={variant} className="text-xs">
        <Settings className={`h-3 w-3 mr-1 ${color}`} />
        {permissionCount} permission{permissionCount === 1 ? '' : 's'}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by role name or description..."
              value={searchState.query}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRoleIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <span className="text-sm text-green-700 font-medium">
            {selectedRoleIds.length} custom role{selectedRoleIds.length === 1 ? '' : 's'} selected
          </span>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('name')}
                >
                  Role Name
                  {getSortIcon('name')}
                </Button>
              </TableHead>

              <TableHead>Description</TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('permissionCount')}
                >
                  Permissions
                  {getSortIcon('permissionCount')}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  {getSortIcon('createdAt')}
                </Button>
              </TableHead>

              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : roles.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2 text-gray-500">
                    <Shield className="h-12 w-12" />
                    <p className="font-medium">No roles found</p>
                    <p className="text-sm">
                      {searchState.query
                        ? 'Try adjusting your search terms'
                        : 'Get started by creating your first custom role'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Role rows
              roles.map(role => (
                <TableRow
                  key={role.id}
                  className={selectedRoleIds.includes(role.id) ? 'bg-green-50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRoleSelection(role.id)}
                      disabled={!canDeleteRole(role)}
                    />
                  </TableCell>

                  <TableCell>{getRoleBadge(role)}</TableCell>

                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm text-gray-900 line-clamp-2">{role.description}</p>
                    </div>
                  </TableCell>

                  <TableCell>{getPermissionsBadge(role.permissions.length)}</TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(role.createdAt)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewPermissions?.(role)}>
                          <Users className="h-4 w-4 mr-2" />
                          View Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRole?.(role)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        {canDeleteRole(role) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteRole?.(role)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {roles.length} of {totalCount} role{totalCount === 1 ? '' : 's'}
        </span>
        {selectedRoleIds.length > 0 && (
          <span className="text-green-600 font-medium">{selectedRoleIds.length} selected</span>
        )}
      </div>
    </div>
  )
}
