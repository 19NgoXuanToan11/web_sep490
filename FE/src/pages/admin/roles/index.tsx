import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Settings, Lock, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
// import { Badge } from '@/shared/ui/badge'
// import { TableDensityToggle } from '@/shared/ui/table-density-toggle'
import { useToast } from '@/shared/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import {
  useAdminRolesStore,
  RolesTable,
  RoleFormModal,
  PermissionsViewModal,
} from '@/features/admin-roles'
import type { Role } from '@/shared/lib/localData'

const AdminRolesPage: React.FC = () => {
  const {
    roles,
    // selectedRoleIds,
    loadingStates,
    initializeData,
    deleteRole,
    bulkDeleteRoles,
    clearSelection,
    getSystemRolesCount,
    getCustomRolesCount,
  } = useAdminRolesStore()

  const { toast } = useToast()

  // Modal states
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [viewPermissionsRole, setViewPermissionsRole] = useState<Role | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ role?: Role; roleIds?: string[] } | null>(
    null
  )

  // Initialize data on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Statistics
  const totalRoles = roles.length
  const systemRoles = getSystemRolesCount()
  const customRoles = getCustomRolesCount()
  const averagePermissions =
    totalRoles > 0
      ? Math.round(roles.reduce((sum, role) => sum + role.permissions.length, 0) / totalRoles)
      : 0

  // Removed: create role flow from header

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsRoleFormOpen(true)
  }

  const handleViewPermissions = (role: Role) => {
    setViewPermissionsRole(role)
  }

  const handleDeleteRole = (role: Role) => {
    setDeleteConfirm({ role })
  }

  const handleBulkAction = async (action: string, roleIds: string[]) => {
    try {
      switch (action) {
        case 'delete':
          setDeleteConfirm({ roleIds })
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
      if (deleteConfirm.role) {
        await deleteRole(deleteConfirm.role.id)
        toast({
          title: 'Role deleted',
          description: `${deleteConfirm.role.name} role has been removed from the system.`,
        })
      } else if (deleteConfirm.roleIds) {
        await bulkDeleteRoles(deleteConfirm.roleIds)
        toast({
          title: 'Roles deleted',
          description: `${deleteConfirm.roleIds.length} role${deleteConfirm.roleIds.length === 1 ? '' : 's'} removed from the system.`,
        })
      }
    } catch (error) {
      // Error handling is done in the store
    } finally {
      setDeleteConfirm(null)
      clearSelection()
    }
  }

  // Removed: export roles

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý vai trò</h1>
            <p className="text-gray-600">Cấu hình vai trò người dùng và quyền truy cập</p>
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
                <CardTitle className="text-sm font-medium">Tổng số vai trò</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRoles}</div>
                <p className="text-xs text-muted-foreground">Được cấu hình trong hệ thống</p>
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
                <CardTitle className="text-sm font-medium">Vai trò hệ thống</CardTitle>
                <Lock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{systemRoles}</div>
                <p className="text-xs text-muted-foreground">Vai trò tích hợp sẵn</p>
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
                <CardTitle className="text-sm font-medium">Vai trò tùy chỉnh</CardTitle>
                <Settings className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{customRoles}</div>
                <p className="text-xs text-muted-foreground">Theo tổ chức</p>
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
                <CardTitle className="text-sm font-medium">Quyền trung bình</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{averagePermissions}</div>
                <p className="text-xs text-muted-foreground">Trung bình mỗi vai trò</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tất cả vai trò
            </CardTitle>
            <CardDescription>
              Xem và quản lý vai trò người dùng. Vai trò hệ thống được bảo vệ và không thể xóa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RolesTable
              onEditRole={handleEditRole}
              onViewPermissions={handleViewPermissions}
              onDeleteRole={handleDeleteRole}
              onBulkAction={handleBulkAction}
            />
          </CardContent>
        </Card>

        {/* Role Form Modal */}
        <RoleFormModal
          isOpen={isRoleFormOpen}
          onClose={() => {
            setIsRoleFormOpen(false)
            setSelectedRole(null)
          }}
          role={selectedRole}
        />

        {/* Permissions View Modal */}
        <PermissionsViewModal
          isOpen={!!viewPermissionsRole}
          onClose={() => setViewPermissionsRole(null)}
          role={viewPermissionsRole}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Xác nhận xóa
              </DialogTitle>
              <DialogDescription>
                {deleteConfirm?.role ? (
                  <>
                    Bạn có chắc muốn xóa vai trò <strong>{deleteConfirm.role.name}</strong>? Hành
                    động này không thể hoàn tác và có thể ảnh hưởng tới người dùng đang được gán.
                  </>
                ) : deleteConfirm?.roleIds ? (
                  <>
                    Bạn có chắc muốn xóa {deleteConfirm.roleIds.length} vai trò đã chọn? Hành động
                    này không thể hoàn tác và có thể ảnh hưởng tới người dùng đang được gán.
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={
                  loadingStates['delete-role']?.isLoading ||
                  loadingStates['bulk-delete-roles']?.isLoading
                }
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={
                  loadingStates['delete-role']?.isLoading ||
                  loadingStates['bulk-delete-roles']?.isLoading
                }
              >
                {loadingStates['delete-role']?.isLoading ||
                loadingStates['bulk-delete-roles']?.isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Xóa vai trò
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default AdminRolesPage
