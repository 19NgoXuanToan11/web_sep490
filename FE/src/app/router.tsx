import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from '../pages/home'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import ManagerDashboard from '@/pages/manager/dashboard'
import IrrigationPage from '@/pages/manager/irrigation'
import InventoryPage from '@/pages/manager/inventory'
import ReportsPage from '@/pages/manager/reports'

// Admin route imports
import AdminUsersPage from '@/pages/admin/users'
import AdminRolesPage from '@/pages/admin/roles'
import ProfilePage from '@/pages/profile'

// Staff route imports
import StaffOperationsPage from '@/pages/staff/operations'
import StaffWorkLogsPage from '@/pages/staff/work-logs'
import StaffQualityChecksPage from '@/pages/staff/quality-checks'

// RBAC components
const Unauthorized = React.lazy(() => import('@/pages/Unauthorized'))
import { RoleGuard } from '@/shared/ui/router/RoleGuard'

// Router configuration - moved to separate constant to avoid fast-refresh issues
const routerConfig = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // {
  //   path: '/register',
  //   element: <RegisterPage />,
  // },
  // Manager routes for farm management features
  {
    path: '/manager/dashboard',
    element: (
      <RoleGuard allowed={['Manager']}>
        <ManagerDashboard />
      </RoleGuard>
    ),
  },
  {
    path: '/manager/irrigation',
    element: (
      <RoleGuard allowed={['Manager']}>
        <IrrigationPage />
      </RoleGuard>
    ),
  },
  {
    path: '/manager/inventory',
    element: (
      <RoleGuard allowed={['Manager']}>
        <InventoryPage />
      </RoleGuard>
    ),
  },
  {
    path: '/manager/reports',
    element: (
      <RoleGuard allowed={['Manager']}>
        <ReportsPage />
      </RoleGuard>
    ),
  },
  // Admin routes for system administration
  {
    path: '/admin/users',
    element: (
      <RoleGuard allowed={['Admin']}>
        <AdminUsersPage />
      </RoleGuard>
    ),
  },
  {
    path: '/admin/roles',
    element: (
      <RoleGuard allowed={['Admin']}>
        <AdminRolesPage />
      </RoleGuard>
    ),
  },

  // Staff routes for field operations
  {
    path: '/staff/operations',
    element: <StaffOperationsPage />,
  },
  {
    path: '/staff/work-logs',
    element: <StaffWorkLogsPage />,
  },
  {
    path: '/staff/quality-checks',
    element: <StaffQualityChecksPage />,
  },
  // Common profile page for all authenticated roles
  {
    path: '/profile',
    element: (
      <RoleGuard allowed={['Admin', 'Manager', 'Staff']}>
        <ProfilePage />
      </RoleGuard>
    ),
  },
]

const router = createBrowserRouter(routerConfig)

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
