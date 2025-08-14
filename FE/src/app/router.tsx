import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from '../pages/home'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import ManagerDashboard from '@/pages/manager/dashboard'
import IrrigationPage from '@/pages/manager/irrigation'
import InventoryPage from '@/pages/manager/inventory'
import ReportsPage from '@/pages/manager/reports'

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
]

const router = createBrowserRouter(routerConfig)

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
