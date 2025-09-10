import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'

type Role = 'Admin' | 'Manager' | 'Staff'

export const RoleGuard: React.FC<React.PropsWithChildren<{ allowed: Role[] }>> = ({
  allowed,
  children,
}) => {
  const { role, initializing } = useAuthStore()
  const location = useLocation()

  if (initializing) return null
  // Nếu chưa đăng nhập -> chuyển thẳng tới /login để tránh hiểu nhầm "hết hạn"
  if (!role) return <Navigate to="/login" state={{ from: location }} replace />
  if (!allowed.includes(role))
    return <Navigate to="/unauthorized" state={{ from: location, reason: 'forbidden' }} replace />

  return <>{children}</>
}

export default RoleGuard
