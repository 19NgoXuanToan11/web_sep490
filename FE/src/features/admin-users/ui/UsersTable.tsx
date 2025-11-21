import React from 'react'
import {
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  Key,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
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
    loadingStates,
    paginationState,
    setSort,
    setPagination,
    getPaginatedUsers,
    getTotalCount,
  } = useAdminUsersStore()

  const users = getPaginatedUsers()
  const totalCount = getTotalCount()
  const isLoading = loadingStates['fetch-users']?.isLoading

  // Calculate pagination values
  const currentPage = paginationState.page
  const pageSize = paginationState.pageSize
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

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

              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2 text-gray-500">
                    <Users className="h-12 w-12" />
                    <p className="font-medium">Không có người dùng</p>
                    <p className="text-sm">
                      {searchState.query
                        ? 'Hãy điều chỉnh bộ lọc hoặc tìm kiếm'
                        : 'Chưa có dữ liệu người dùng'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (

              users.map(user => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-semibold text-base text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-0.5">
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

                        if (!open) {

                          setTimeout(() => {

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

      { }
      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Hiển thị {startItem}-{endItem} trong tổng số {totalCount} người dùng
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>

            <div className="flex items-center gap-1">
              {(() => {
                const pages = []
                const maxVisiblePages = 5
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1)
                }

                if (startPage > 1) {
                  pages.push(
                    <Button
                      key={1}
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(1)}
                      disabled={isLoading}
                      className="w-10"
                    >
                      1
                    </Button>
                  )
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis-start" className="px-2 text-gray-500">
                        ...
                      </span>
                    )
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPagination(i)}
                      disabled={isLoading}
                      className="w-10"
                    >
                      {i}
                    </Button>
                  )
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis-end" className="px-2 text-gray-500">
                        ...
                      </span>
                    )
                  }
                  pages.push(
                    <Button
                      key={totalPages}
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(totalPages)}
                      disabled={isLoading}
                      className="w-10"
                    >
                      {totalPages}
                    </Button>
                  )
                }

                return pages
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
