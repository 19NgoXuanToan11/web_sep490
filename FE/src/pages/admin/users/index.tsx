import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserX, Shield, Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
// import { Badge } from '@/shared/ui/badge'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
// import { TableDensityToggle } from '@/shared/ui/table-density-toggle'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { useToast } from '@/shared/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
// import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { useAdminUsersStore, UsersTable, UserFormModal } from '@/features/admin-users'
import type { User, UserRole } from '@/shared/lib/localData'

const AdminUsersPage: React.FC = () => {
  const {
    users,
    // selectedUserIds,
    loadingStates,
    initializeData,
    deleteUser,
    bulkDeleteUsers,
    bulkActivateUsers,
    bulkDeactivateUsers,
    bulkAssignRole,
    clearSelection,
    getInactiveUsersCount,
  } = useAdminUsersStore()

  const { toast } = useToast()

  // Modal states
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ user?: User; userIds?: string[] } | null>(
    null
  )

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Statistics
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'Active').length
  const inactiveUsers = getInactiveUsersCount()
  const adminUsers = users.filter(u => u.roles.includes('ADMIN')).length

  // Removed: create user button/flow from header

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsUserFormOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setDeleteConfirm({ user })
  }

  const handleBulkAction = async (action: string, userIds: string[], role?: UserRole) => {
    try {
      switch (action) {
        case 'activate':
          await bulkActivateUsers(userIds)
          toast({
            title: 'Kích hoạt thành công',
            description: `${userIds.length} người dùng đã được kích hoạt.`,
          })
          break

        case 'deactivate':
          await bulkDeactivateUsers(userIds)
          toast({
            title: 'Ngưng hoạt động',
            description: `${userIds.length} người dùng đã bị ngưng hoạt động.`,
          })
          break

        case 'assign-role':
          if (role) {
            await bulkAssignRole(userIds, role)
            toast({
              title: 'Gán vai trò',
              description: `Đã gán vai trò ${role} cho ${userIds.length} người dùng.`,
            })
          }
          break

        case 'delete':
          setDeleteConfirm({ userIds })
          return // Don't clear selection yet

        default:
          break
      }

      clearSelection()
    } catch (error) {
      // Error handling is done in the store
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      if (deleteConfirm.user) {
        await deleteUser(deleteConfirm.user.id)
        toast({
          title: 'Đã xóa người dùng',
          description: `${deleteConfirm.user.name} đã được xóa khỏi hệ thống.`,
        })
      } else if (deleteConfirm.userIds) {
        await bulkDeleteUsers(deleteConfirm.userIds)
        toast({
          title: 'Đã xóa người dùng',
          description: `Đã xóa ${deleteConfirm.userIds.length} người dùng khỏi hệ thống.`,
        })
      }
    } catch (error) {
      // Error handling is done in the store
    } finally {
      setDeleteConfirm(null)
      clearSelection()
    }
  }

  // Removed: export users

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý người dùng hệ thống, vai trò và phân quyền</p>
          </div>

          <div className="flex items-center gap-2" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Đăng ký trong hệ thống</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ngưng hoạt động</CardTitle>
                <UserX className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{inactiveUsers}</div>
                <p className="text-xs text-muted-foreground">Cần xem xét</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quản trị viên</CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{adminUsers}</div>
                <p className="text-xs text-muted-foreground">Quyền truy cập cao</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tất cả người dùng
            </CardTitle>
            <CardDescription>
              Xem và quản lý tất cả người dùng. Sử dụng bộ lọc và tìm kiếm để tìm người dùng cụ thể.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onBulkAction={handleBulkAction}
            />
          </CardContent>
        </Card>

        {/* User Form Modal */}
        <UserFormModal
          isOpen={isUserFormOpen}
          onClose={() => {
            setIsUserFormOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                {deleteConfirm?.user ? (
                  <>
                    Bạn có chắc muốn xóa <strong>{deleteConfirm.user.name}</strong>? Hành động này
                    không thể hoàn tác.
                  </>
                ) : deleteConfirm?.userIds ? (
                  <>
                    Bạn có chắc muốn xóa {deleteConfirm.userIds.length} người dùng đã chọn? Hành
                    động này không thể hoàn tác.
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={
                  loadingStates['delete-user']?.isLoading ||
                  loadingStates['bulk-delete-users']?.isLoading
                }
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={
                  loadingStates['delete-user']?.isLoading ||
                  loadingStates['bulk-delete-users']?.isLoading
                }
              >
                {loadingStates['delete-user']?.isLoading ||
                loadingStates['bulk-delete-users']?.isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Xóa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default AdminUsersPage
