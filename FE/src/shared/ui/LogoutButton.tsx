import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/authStore'
import { Button } from '@/shared/ui/button'

const LogoutButton: React.FC<{ className?: string; iconOnly?: boolean }> = ({
  className,
  iconOnly,
}) => {
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  return (
    <Button
      className={className}
      variant="outline"
      onClick={() => {
        logout()
        navigate('/login', { replace: true })
      }}
      title="Đăng xuất"
    >
      {iconOnly ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      ) : (
        'Đăng xuất'
      )}
    </Button>
  )
}

export default LogoutButton
