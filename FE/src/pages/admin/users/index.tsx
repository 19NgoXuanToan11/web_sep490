import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { useToast } from '@/shared/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

import {
  useAdminUsersStore,
  UsersTable,
  UserFormModal,
  PasswordUpdateModal,
} from '@/features/admin-users'
import type { User } from '@/shared/lib/localData'

const AdminUsersPage: React.FC = () => {
  const { loadingStates, initializeData, deleteUser } =
    useAdminUsersStore()

  const { toast } = useToast()

  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [isPasswordUpdateOpen, setIsPasswordUpdateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [passwordUpdateUser, setPasswordUpdateUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ user?: User; userIds?: string[] } | null>(
    null
  )

  useEffect(() => {
    initializeData()
  }, [initializeData])


  const handleEditUser = (user: User) => {
    try {
      setSelectedUser(user)
      setIsUserFormOpen(true)
    } catch (error) {
    }
  }

  const handleDeleteUser = (user: User) => {
    try {
      setDeleteConfirm({ user })
    } catch (error) {
    }
  }

  const handleUpdatePassword = (user: User) => {
    try {
      setPasswordUpdateUser(user)
      setIsPasswordUpdateOpen(true)
    } catch (error) {
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
      }
    } catch (error) {

    }

    setDeleteConfirm(null)
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        { }
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý người dùng hệ thống, vai trò và phân quyền</p>
          </div>

          <div className="flex items-center gap-2" />
        </div>

        { }
        <Card>
          <CardContent>
            <UsersTable
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onUpdatePassword={handleUpdatePassword}
            />
          </CardContent>
        </Card>

        { }
        <UserFormModal
          isOpen={isUserFormOpen}
          onClose={() => {
            setIsUserFormOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
        />

        { }
        <PasswordUpdateModal
          isOpen={isPasswordUpdateOpen}
          onClose={() => {
            setIsPasswordUpdateOpen(false)
            setPasswordUpdateUser(null)
          }}
          user={passwordUpdateUser}
        />

        { }
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
