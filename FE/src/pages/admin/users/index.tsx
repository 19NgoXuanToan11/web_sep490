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
import { Users, UserCheck, UserX, ShieldCheck } from 'lucide-react'
import { accountApi, type AccountDto } from '@/shared/api/auth'

const AdminUsersPage: React.FC = () => {
  const { initializeData } = useAdminUsersStore()

  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [isPasswordUpdateOpen, setIsPasswordUpdateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [passwordUpdateUser, setPasswordUpdateUser] = useState<User | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    customers: 0,
    managers: 0,
    staffs: 0,
  })

  const computeStatsFromAccounts = (accounts: AccountDto[]) => {
    let active = 0
    let customers = 0
    let managers = 0
    let staffs = 0

    accounts.forEach(acc => {
      const isActive =
        (typeof acc.status === 'number' && acc.status === 1) ||
        (typeof acc.status === 'string' &&
          (acc.status === 'ACTIVE' || acc.status === 'Active'))

      if (isActive) active += 1

      const role = String(acc.role || '').toUpperCase()
      if (role === 'CUSTOMER') customers += 1
      else if (role === 'MANAGER') managers += 1
      else if (role === 'STAFF') staffs += 1
    })

    const total = accounts.length

    setStats({
      total,
      active,
      inactive: Math.max(0, total - active),
      customers,
      managers,
      staffs,
    })
  }

  useEffect(() => {
    initializeData()
  }, [initializeData])

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        // Lấy dữ liệu người dùng với pageSize lớn để thống kê càng đầy đủ càng tốt
        const res = await accountApi.getAll({ pageSize: 1000, pageIndex: 1 })
        computeStatsFromAccounts(res.items || [])
      } catch {
        // Nếu thống kê lỗi thì vẫn cho phép sử dụng bảng phía dưới
      }
    }

    loadUserStats()
  }, [])


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

        { }
        <div className="grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng người dùng</p>
                  <p className="text-2xl font-semibold mt-1">{stats.total}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tổng số tài khoản đang được quản lý trong hệ thống
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Đang hoạt động</p>
                  <p className="text-2xl font-semibold mt-1 text-green-600">{stats.active}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 text-green-600">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tài khoản có trạng thái hoạt động (ACTIVE)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Bị vô hiệu hóa</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-700">{stats.inactive}</p>
                </div>
                <div className="rounded-full bg-gray-100 p-3 text-gray-600">
                  <UserX className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tài khoản đã bị khóa hoặc không còn sử dụng
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vai trò</p>
                  <p className="text-sm mt-1 text-gray-800">
                    {stats.customers} khách hàng • {stats.managers} quản lý • {stats.staffs} nhân viên
                  </p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Phân bố người dùng theo vai trò trong hệ thống
              </p>
            </CardContent>
          </Card>
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
