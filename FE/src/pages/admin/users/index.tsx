import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/ui/card'

import { AdminLayout } from '@/shared/layouts/AdminLayout'

import {
  useAdminUsersStore,
  UsersTable,
  UserControlsPanel,
  UserFormModal,
  PasswordUpdateModal,
} from '@/features/admin-users'
import type { User } from '@/shared/lib/localData'

const AdminUsersPage: React.FC = () => {
  const { initializeData } = useAdminUsersStore()

  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [isPasswordUpdateOpen, setIsPasswordUpdateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [passwordUpdateUser, setPasswordUpdateUser] = useState<User | null>(null)
  useEffect(() => {
    initializeData()
  }, [initializeData])


  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsUserFormOpen(true)
  }

  const handleUpdatePassword = (user: User) => {
    setPasswordUpdateUser(user)
    setIsPasswordUpdateOpen(true)
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        { }
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý người dùng hệ thống, vai trò và phân quyền</p>
          </div>

          <div className="flex items-center gap-2" />
        </div>

        {/* Controls Panel */}
        <div className="mb-6">
          <UserControlsPanel
            onCreateUser={() => {
              setSelectedUser(null)
              setIsUserFormOpen(true)
            }}
          />
        </div>

        {/* Users Table */}
        <Card>
          <CardContent>
            <UsersTable
              onEditUser={handleEditUser}
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
      </div>
    </AdminLayout>
  )
}

export default AdminUsersPage
