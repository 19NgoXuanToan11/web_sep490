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
import AdminSettingsPage from '@/pages/admin/settings'

// Staff route imports
import StaffOperationsPage from '@/pages/staff/operations'
import StaffWorkLogsPage from '@/pages/staff/work-logs'
import StaffQualityChecksPage from '@/pages/staff/quality-checks'

// Router configuration - moved to separate constant to avoid fast-refresh issues
const routerConfig = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  // Manager routes for farm management features
  {
    path: '/manager/dashboard',
    element: <ManagerDashboard />,
  },
  {
    path: '/manager/irrigation',
    element: <IrrigationPage />,
  },
  {
    path: '/manager/inventory',
    element: <InventoryPage />,
  },
  {
    path: '/manager/reports',
    element: <ReportsPage />,
  },
  // Admin routes for system administration
  {
    path: '/admin/users',
    element: <AdminUsersPage />,
  },
  {
    path: '/admin/roles',
    element: <AdminRolesPage />,
  },
  {
    path: '/admin/settings',
    element: <AdminSettingsPage />,
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
]

const router = createBrowserRouter(routerConfig)

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
