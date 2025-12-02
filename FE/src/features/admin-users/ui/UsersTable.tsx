import React from 'react'
import {
  Users,
  MoreHorizontal,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Key,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import { useAdminUsersStore } from '../store/adminUsersStore'
import { statusOptions, availableRoles } from '../model/schemas'
import type { User } from '@/shared/lib/localData'
import { Pagination } from '@/shared/ui/pagination'

interface UsersTableProps {
  onEditUser?: (user: User) => void
  onUpdatePassword?: (user: User) => void
  onViewDetails?: (user: User) => void
}

export const UsersTable: React.FC<UsersTableProps> = ({
  onEditUser,
  onUpdatePassword,
  onViewDetails,
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

  const currentPage = paginationState.page
  const pageSize = paginationState.pageSize
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1

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
              <TableHead className="w-16">STT</TableHead>
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
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
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

              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
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

              users.map((user, index) => {
                const ordinalNumber = startItem + index
                return (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{ordinalNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-semibold text-base text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
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
                                onViewDetails?.(user)
                              }, 0)
                            }}
                            className="cursor-pointer focus:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 mr-2 text-green-600" />
                            Xem chi tiết
                          </DropdownMenuItem>
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
                            <Edit className="h-4 w-4 mr-2 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">Chỉnh sửa người dùng</span>
                            </div>
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
                            Đặt lại mật khẩu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      { }
      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-end mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPagination}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  )
}
