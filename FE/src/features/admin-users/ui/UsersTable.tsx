import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Mail,
} from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { Checkbox } from '@/shared/ui/checkbox'
import { useAdminUsersStore } from '../store/adminUsersStore'
import { statusOptions, availableRoles } from '../model/schemas'
import type { User, UserRole } from '@/shared/lib/localData'
import { formatDate, formatDateTime } from '@/shared/lib/localData/storage'

interface UsersTableProps {
  onEditUser?: (user: User) => void
  onDeleteUser?: (user: User) => void
  onBulkAction?: (action: string, userIds: string[], role?: UserRole) => void
}

export const UsersTable: React.FC<UsersTableProps> = ({
  onEditUser,
  onDeleteUser,
  onBulkAction,
}) => {
  const {
    searchState,
    roleFilter,
    statusFilter,
    selectedUserIds,
    tableDensity,
    loadingStates,
    setSearch,
    setSort,
    setRoleFilter,
    setStatusFilter,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    getPaginatedUsers,
    getFilteredUsers,
    getTotalCount,
  } = useAdminUsersStore()

  const [bulkActionRole, setBulkActionRole] = useState<UserRole>('VIEWER')

  const users = getPaginatedUsers()
  const filteredUsers = getFilteredUsers()
  const totalCount = getTotalCount()
  const isLoading = loadingStates['fetch-users']?.isLoading

  const isAllSelected =
    selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length
  const isIndeterminate =
    selectedUserIds.length > 0 && selectedUserIds.length < filteredUsers.length

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
      selectAllUsers()
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedUserIds.length === 0) return

    if (action === 'assign-role') {
      onBulkAction?.(action, selectedUserIds, bulkActionRole)
    } else {
      onBulkAction?.(action, selectedUserIds)
    }
  }

  const getRolesBadges = (roles: string[]) => {
    return roles.map(role => {
      const roleConfig = availableRoles.find(r => r.value === role)
      return (
        <Badge
          key={role}
          variant={role === 'ADMIN' ? 'destructive' : 'default'}
          className="text-xs"
        >
          {roleConfig?.label || role}
        </Badge>
      )
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status)
    return (
      <Badge variant={statusConfig?.variant || 'secondary'}>{statusConfig?.label || status}</Badge>
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
              placeholder="Search by name, email, or role..."
              value={searchState.query}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={roleFilter || '__all__'} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Roles</SelectItem>
              {availableRoles.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter || '__all__'} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <span className="text-sm text-green-700 font-medium">
            {selectedUserIds.length} user{selectedUserIds.length === 1 ? '' : 's'} selected
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('activate')}
              className="text-green-700 border-green-300"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Activate
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('deactivate')}
              className="text-orange-700 border-orange-300"
            >
              <UserX className="h-4 w-4 mr-1" />
              Deactivate
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300">
                  <Shield className="h-4 w-4 mr-1" />
                  Assign Role <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Role to Assign</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableRoles.map(role => (
                  <DropdownMenuItem
                    key={role.value}
                    onClick={() => {
                      setBulkActionRole(role.value)
                      handleBulkAction('assign-role')
                    }}
                  >
                    {role.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
                  User
                  {getSortIcon('name')}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('roles')}
                >
                  Roles
                  {getSortIcon('roles')}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>

              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('lastLogin')}
                >
                  Last Login
                  {getSortIcon('lastLogin')}
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
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2 text-gray-500">
                    <Users className="h-12 w-12" />
                    <p className="font-medium">No users found</p>
                    <p className="text-sm">
                      {searchState.query || roleFilter || statusFilter
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating your first user'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // User rows
              users.map(user => (
                <TableRow
                  key={user.id}
                  className={selectedUserIds.includes(user.id) ? 'bg-green-50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">{getRolesBadges(user.roles)}</div>
                  </TableCell>

                  <TableCell>{getStatusBadge(user.status)}</TableCell>

                  <TableCell>
                    {user.lastLogin ? (
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(user.lastLogin)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDateTime(user.lastLogin)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Never</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditUser?.(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteUser?.(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
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
          Showing {users.length} of {totalCount} user{totalCount === 1 ? '' : 's'}
        </span>
        {selectedUserIds.length > 0 && (
          <span className="text-green-600 font-medium">{selectedUserIds.length} selected</span>
        )}
      </div>
    </div>
  )
}
