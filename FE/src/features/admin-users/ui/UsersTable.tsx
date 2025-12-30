import React from 'react'
import { Users, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { StaffDataTable, type StaffDataTableColumn } from '@/shared/ui/staff-data-table'
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

  const getRolesBadges = (roles: string[]) => {

    const role = roles[0] || 'STAFF'
    const roleConfig = availableRoles.find(r => r.value === role)
    return (
      <Badge
        variant={role === 'CUSTOMER' ? 'secondary' : role === 'MANAGER' ? 'golden' : 'sage'}
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
      {isLoading ? (
        <div className="border rounded-lg overflow-hidden pt-4 mt-4 px-4 sm:px-6 pb-6">
          <table className="w-full text-sm">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="text-center px-4 py-3">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : users.length === 0 ? (
        <div className="border rounded-lg overflow-hidden pt-8 pb-10 mt-4 flex flex-col items-center space-y-2 text-gray-500">
          <Users className="h-12 w-12" />
          <p className="font-medium">Không có người dùng</p>
          <p className="text-sm">
            {searchState.query ? 'Hãy điều chỉnh bộ lọc hoặc tìm kiếm' : 'Chưa có dữ liệu người dùng'}
          </p>
        </div>
      ) : (
        <>
          <StaffDataTable<User>
            className="px-4 sm:px-6 pb-6"
            data={users}
            getRowKey={user => user.id}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={page => setPagination(page)}
            emptyTitle="Không có người dùng"
            emptyDescription={
              searchState.query
                ? 'Hãy điều chỉnh bộ lọc hoặc tìm kiếm'
                : 'Chưa có dữ liệu người dùng'
            }
            columns={[
              {
                id: 'user',
                header: 'Người dùng',
                render: user => (
                  <div className="flex flex-col">
                    <div className="font-semibold text-base text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
                  </div>
                ),
              },
              {
                id: 'roles',
                header: 'Vai trò',
                render: user => getRolesBadges(user.roles),
              },
              {
                id: 'status',
                header: 'Trạng thái',
                render: user => getStatusBadge(user.status),
              },
              {
                id: 'actions',
                header: '',
                render: user => (
                  <DropdownMenu
                    modal={false}
                    onOpenChange={open => {
                      if (!open) {
                        setTimeout(() => { }, 0)
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
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">Chỉnh sửa</span>
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
                        Đặt lại mật khẩu
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ] satisfies StaffDataTableColumn<User>[]}
          />
        </>
      )}
    </div>
  )
}
