import React, { Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RoleGuard } from '@/shared/ui/router/RoleGuard'
import { RouteErrorElement } from '@/shared/ui/router/RouteErrorElement'

const HomePage = React.lazy(() => import('../pages/home').then(m => ({ default: m.HomePage })))
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))

const AdminUsersPage = React.lazy(() => import('@/pages/admin/users'))
const AdminDashboard = React.lazy(() => import('@/pages/admin/dashboard'))

const ManagerDashboard = React.lazy(() => import('@/pages/manager/dashboard'))
const IrrigationPage = React.lazy(() => import('@/pages/manager/irrigation'))
const ManagerCategoriesPage = React.lazy(() => import('@/pages/manager/categories'))
const ManagerCropsPage = React.lazy(() => import('@/pages/manager/crops'))
const CropManagementPage = React.lazy(() =>
  import('@/pages/manager/crop-management').catch((error) => {
    console.error('Failed to load CropManagementPage:', error)
    throw error
  })
)
const ManagerFarmActivitiesPage = React.lazy(() => import('@/pages/manager/farm-activities'))
const ManagerIoTDevicesPage = React.lazy(() => import('@/pages/manager/iot-devices'))
const RealTimeIoTDashboard = React.lazy(() => import('@/pages/manager/iot-dashboard'))
const ManagerOrdersPage = React.lazy(() => import('@/pages/manager/orders'))
const ManagerIoTLogsPage = React.lazy(() => import('@/pages/manager/iot-logs'))
const ProductsPage = React.lazy(() => import('@/features/products-management/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))

const StaffDashboard = React.lazy(() => import('@/pages/staff/dashboard'))
const StaffProductsPage = React.lazy(() => import('@/pages/staff/products'))
const StaffOrdersPage = React.lazy(() => import('@/pages/staff/orders'))
const StaffFeedbacksPage = React.lazy(() => import('@/pages/staff/feedbacks'))

const ProfilePage = React.lazy(() => import('@/pages/profile'))
const PaymentResultPage = React.lazy(() => import('@/pages/payment/PaymentResultPage'))
const Unauthorized = React.lazy(() => import('@/pages/Unauthorized'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
)

const routerConfig = [
  {
    path: '/',
    element: (
      <LazyWrapper>
        <HomePage />
      </LazyWrapper>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <LazyWrapper>
        <Unauthorized />
      </LazyWrapper>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyWrapper>
        <LoginPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/payment-result',
    element: (
      <LazyWrapper>
        <PaymentResultPage />
      </LazyWrapper>
    ),
  },

  {
    path: '/manager/dashboard',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerDashboard />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/irrigation',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <IrrigationPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/categories',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerCategoriesPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/crops',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerCropsPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/crop-management',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <CropManagementPage />
        </RoleGuard>
      </LazyWrapper>
    ),
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/manager/farm-activities',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerFarmActivitiesPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/iot-devices',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerIoTDevicesPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/iot-dashboard',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <RealTimeIoTDashboard />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/iot-logs',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerIoTLogsPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/orders',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ManagerOrdersPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/manager/products',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Manager']}>
          <ProductsPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },

  {
    path: '/admin/dashboard',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Admin']}>
          <AdminDashboard />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Admin']}>
          <AdminUsersPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },

  {
    path: '/staff/dashboard',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Staff']}>
          <StaffDashboard />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/staff/products',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Staff']}>
          <StaffProductsPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/staff/orders',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Staff']}>
          <StaffOrdersPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
  {
    path: '/staff/feedbacks',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Staff']}>
          <StaffFeedbacksPage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },

  {
    path: '/profile',
    element: (
      <LazyWrapper>
        <RoleGuard allowed={['Admin', 'Manager', 'Staff']}>
          <ProfilePage />
        </RoleGuard>
      </LazyWrapper>
    ),
  },
]

const router = createBrowserRouter(routerConfig)

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
