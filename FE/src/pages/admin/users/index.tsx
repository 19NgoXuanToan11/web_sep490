import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  Download,
  UserX,
  Shield,
  Activity,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { TableDensityToggle } from '@/shared/ui/table-density-toggle'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { useToast } from '@/shared/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'
import { useAdminUsersStore, UsersTable, UserFormModal } from '@/features/admin-users'
import type { User, UserRole } from '@/shared/lib/localData'

const AdminUsersPage: React.FC = () => {
  const {
    users,
    selectedUserIds,
    tableDensity,
    loadingStates,
    initializeData,
    deleteUser,
    bulkDeleteUsers,
    bulkActivateUsers,
    bulkDeactivateUsers,
    bulkAssignRole,
    exportUsersCSV,
    clearSelection,
    setTableDensity,
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

  const handleCreateUser = () => {
    setSelectedUser(null)
    setIsUserFormOpen(true)
  }

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
            title: 'Users activated',
            description: `${userIds.length} user${userIds.length === 1 ? '' : 's'} activated successfully.`,
          })
          break

        case 'deactivate':
          await bulkDeactivateUsers(userIds)
          toast({
            title: 'Users deactivated',
            description: `${userIds.length} user${userIds.length === 1 ? '' : 's'} deactivated successfully.`,
          })
          break

        case 'assign-role':
          if (role) {
            await bulkAssignRole(userIds, role)
            toast({
              title: 'Role assigned',
              description: `${role} role assigned to ${userIds.length} user${userIds.length === 1 ? '' : 's'}.`,
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
          title: 'User deleted',
          description: `${deleteConfirm.user.name} has been removed from the system.`,
        })
      } else if (deleteConfirm.userIds) {
        await bulkDeleteUsers(deleteConfirm.userIds)
        toast({
          title: 'Users deleted',
          description: `${deleteConfirm.userIds.length} user${deleteConfirm.userIds.length === 1 ? '' : 's'} removed from the system.`,
        })
      }
    } catch (error) {
      // Error handling is done in the store
    } finally {
      setDeleteConfirm(null)
      clearSelection()
    }
  }

  const handleExport = () => {
    exportUsersCSV()
    toast({
      title: 'Export started',
      description: 'User data is being downloaded as CSV.',
    })
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users, roles, and permissions</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <TableDensityToggle density={tableDensity} onDensityChange={setTableDensity} />

            <Button onClick={handleCreateUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
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
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered in system</p>
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
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
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
                <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                <UserX className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{inactiveUsers}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
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
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{adminUsers}</div>
                <p className="text-xs text-muted-foreground">High-level access</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
            <CardDescription>
              View and manage all system users. Use filters and search to find specific users.
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
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                {deleteConfirm?.user ? (
                  <>
                    Are you sure you want to delete <strong>{deleteConfirm.user.name}</strong>? This
                    action cannot be undone.
                  </>
                ) : deleteConfirm?.userIds ? (
                  <>
                    Are you sure you want to delete {deleteConfirm.userIds.length} selected user
                    {deleteConfirm.userIds.length === 1 ? '' : 's'}? This action cannot be undone.
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
                Cancel
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
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

export default AdminUsersPage
