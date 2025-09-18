import React from 'react'
import {
  Users,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  Key,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { useAdminUsersStore } from '../store/adminUsersStore'
import { statusOptions, availableRoles } from '../model/schemas'
import type { User } from '@/shared/lib/localData'

interface UsersTableProps {
  onEditUser?: (user: User) => void
  onDeleteUser?: (user: User) => void
  onUpdatePassword?: (user: User) => void
}

export const UsersTable: React.FC<UsersTableProps> = ({
  onEditUser,
  onDeleteUser,
  onUpdatePassword,
}) => {
  const {
    searchState,
    roleFilter,
    statusFilter,
    loadingStates,
    setSearch,
    setSort,
    setRoleFilter,
    setStatusFilter,
    getPaginatedUsers,
    getTotalCount,
  } = useAdminUsersStore()

  const users = getPaginatedUsers()
  const totalCount = getTotalCount()
  const isLoading = loadingStates['fetch-users']?.isLoading

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

  const getRolesBadges = (roles: string[]) => {
    // Handle single role (take first role only)
    const role = roles[0] || 'STAFF'
    const roleConfig = availableRoles.find(r => r.value === role)
    return (
      <Badge
        variant={role === 'CUSTOMER' ? 'default' : role === 'MANAGER' ? 'secondary' : 'destructive'}
        className="text-xs"
      >
        {roleConfig?.label || role}
      </Badge>
    )
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
              placeholder="Tìm theo tên, email hoặc vai trò..."
              value={searchState.query}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={roleFilter || '__all__'} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả vai trò</SelectItem>
              {availableRoles.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter || '__all__'} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('name')}
                >
                  Người dùng
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
                  Vai trò
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
                  Trạng thái
                  {getSortIcon('status')}
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
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2 text-gray-500">
                    <Users className="h-12 w-12" />
                    <p className="font-medium">Không có người dùng</p>
                    <p className="text-sm">
                      {searchState.query || roleFilter || statusFilter
                        ? 'Hãy điều chỉnh bộ lọc hoặc tìm kiếm'
                        : 'Chưa có dữ liệu người dùng'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // User rows
              users.map(user => (
                <TableRow key={user.id} className="hover:bg-gray-50">
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

                  <TableCell>{getRolesBadges(user.roles)}</TableCell>

                  <TableCell>{getStatusBadge(user.status)}</TableCell>

                  <TableCell>
                    <DropdownMenu
                      modal={false}
                      onOpenChange={open => {
                        // Ensure proper cleanup when dropdown closes
                        if (!open) {
                          // Force a small delay to ensure proper cleanup
                          setTimeout(() => {
                            // This ensures the dropdown state is properly reset
                          }, 0)
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
                        <DropdownMenuItem
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Use setTimeout to ensure the dropdown closes properly
                            setTimeout(() => {
                              onEditUser?.(user)
                            }, 0)
                          }}
                          className="cursor-pointer focus:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Sửa người dùng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Use setTimeout to ensure the dropdown closes properly
                            setTimeout(() => {
                              onUpdatePassword?.(user)
                            }, 0)
                          }}
                          className="cursor-pointer focus:bg-gray-100"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Đổi mật khẩu
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Use setTimeout to ensure the dropdown closes properly
                            setTimeout(() => {
                              onDeleteUser?.(user)
                            }, 0)
                          }}
                          className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa người dùng
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
          Hiển thị {users.length}/{totalCount}
        </span>
      </div>
    </div>
  )
}
