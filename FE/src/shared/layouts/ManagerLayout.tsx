import React, { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Menu,
  X,
  FolderTree,
  Wheat,
  ScanLine,
  User,
  Activity,
  Cpu,
  Monitor,
  History,
  Sprout,
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import LogoutButton from '@/shared/ui/LogoutButton'
import { Badge } from '@/shared/ui/badge'
import { APP_CONFIG } from '@/shared/constants/app'
import { accountProfileApi } from '@/shared/api/auth'
import ThresholdConfigModal from '../../features/thresholds/ThresholdConfigModal.tsx'

interface ManagerLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  description?: string
}

const navigationItems: NavItem[] = [
  {
    name: 'Bảng điều khiển',
    href: '/manager/dashboard',
    icon: LayoutDashboard,
    description: 'Tổng quan & Phân tích',
  },
  {
    name: 'Danh mục',
    href: '/manager/categories',
    icon: FolderTree,
    description: 'Quản lý danh mục sản phẩm',
  },
  {
    name: 'Thiết bị IoT',
    href: '/manager/iot-devices',
    icon: Cpu,
    description: 'Quản lý thiết bị IoT & cảm biến',
  },
  {
    name: 'Cây trồng',
    href: '/manager/crop-management',
    icon: Wheat,
    description: 'Quản lý cây trồng',
  },
  {
    name: 'Theo dõi cây trồng',
    href: '/manager/crops',
    icon: ScanLine,
    description: 'Lập kế hoạch & theo dõi',
  },
  {
    name: 'Hoạt động nông trại',
    href: '/manager/farm-activities',
    icon: Activity,
    description: 'Lập kế hoạch & quản lý hoạt động',
  },
  {
    name: 'Lịch',
    href: '/manager/irrigation',
    icon: Calendar,
    description: 'Quản lý lịch tưới',
  },
  {
    name: 'Bảng điều khiển IoT',
    href: '/manager/iot-dashboard',
    icon: Monitor,
    description: 'Giám sát cảm biến thời gian thực',
  },
  {
    name: 'Nhật ký IoT',
    href: '/manager/iot-logs',
    icon: History,
    description: 'Lịch sử dữ liệu cảm biến & đồng bộ',
  },
]

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('manager-sidebar-open')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [managerProfile, setManagerProfile] = useState<{
    fullname: string
    email: string
    images?: string
  }>({
    fullname: APP_CONFIG.DEFAULT_USER.name,
    email: APP_CONFIG.DEFAULT_USER.email,
  })
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [imageError, setImageError] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true)
        const profile = await accountProfileApi.getProfile()
        setManagerProfile({
          fullname: profile.fullname || APP_CONFIG.DEFAULT_USER.name,
          email: profile.email || APP_CONFIG.DEFAULT_USER.email,
          images: profile.images,
        })
        setImageError(false)
      } catch (error) {
        console.error('Failed to fetch manager profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSidebarToggle = useCallback((newState: boolean) => {
    setIsSidebarOpen(newState)
    localStorage.setItem('manager-sidebar-open', JSON.stringify(newState))
  }, [])

  const isActiveRoute = useCallback(
    (href: string) => {
      return location.pathname === href || location.pathname.startsWith(href + '/')
    },
    [location.pathname]
  )

  const NavLink = React.memo<{ item: NavItem; mobile?: boolean }>(({ item, mobile = false }) => {
    const isActive = isActiveRoute(item.href)

    const handleClick = useCallback(() => {
      navigate(item.href)
      if (mobile) setIsMobileSidebarOpen(false)
    }, [item.href, mobile, navigate])

    return (
      <motion.button
        onClick={handleClick}
        className={`w-full group flex items-center ${isSidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
          ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        whileHover={{ scale: mobile ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <item.icon
          className={`${isSidebarOpen ? 'mr-3' : 'mx-auto'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
            }`}
        />
        {(isSidebarOpen || mobile) && (
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span>{item.name}</span>
              {item.badge && (
                <Badge variant={isActive ? 'default' : 'secondary'} className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
            {!mobile && item.description && (
              <p className={`text-xs mt-0.5 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                {item.description}
              </p>
            )}
          </div>
        )}
      </motion.button>
    )
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      { }
      <motion.div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white shadow-lg border-r border-gray-200 h-screen ${isSidebarOpen ? 'lg:w-72' : 'lg:w-20'
          }`}
        animate={{ width: isSidebarOpen ? 288 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        { }
        <div className="relative border-b border-gray-200">
          {isSidebarOpen ? (

            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-bold text-gray-900">Quản lý nông trại</h1>
                  <p className="text-sm text-gray-500">Nông nghiệp thông minh</p>
                </motion.div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarToggle(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2"
                title="Thu nhỏ thanh bên"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          ) : (

            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSidebarToggle(!isSidebarOpen)}
                className="w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 border-gray-300 shadow-sm bg-white"
                title="Mở rộng thanh bên"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        { }
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map(item => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </nav>

        { }
        <div
          className={`border-t border-gray-200 p-4 ${isSidebarOpen ? '' : 'flex justify-center'}`}
        >
          <div
            className={`${isSidebarOpen
              ? 'flex items-center space-x-3'
              : 'flex flex-col items-center space-y-3'
              }`}
          >
            {managerProfile.images && !imageError ? (
              <img
                src={managerProfile.images}
                alt={managerProfile.fullname}
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {isLoadingProfile ? 'Đang tải...' : managerProfile.fullname}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isLoadingProfile ? '...' : managerProfile.email}
                </p>
              </div>
            )}
            <LogoutButton
              className={`text-gray-500 hover:text-gray-700 ${isSidebarOpen ? '' : 'w-10 h-10 p-2 border border-gray-300 rounded-lg shadow-sm'
                }`}
              iconOnly
            />
          </div>
        </div>
      </motion.div>

      { }
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            { }
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setIsMobileSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            { }
            <motion.nav
              className="fixed top-0 left-0 bottom-0 flex flex-col w-80 max-w-xs bg-white shadow-xl border-r border-gray-200"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sprout className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Farm Manager</h1>
                    <p className="text-sm text-gray-500">Smart Agriculture</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 px-4 py-6 overflow-y-auto">
                <div className="space-y-1">
                  {navigationItems.map(item => (
                    <NavLink key={item.href} item={item} mobile />
                  ))}
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      { }
      <div className={`transition-all duration-300 flex-1 flex flex-col lg:h-screen ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
        { }
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                { }
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-gray-50 mr-4 border-gray-300 shadow-sm"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  title="Mở menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>

              </div>

              <div className="flex items-center space-x-2 sm:space-x-4"></div>
            </div>
          </div>
        </header>

        { }
        <main className="flex-1 overflow-y-auto">
          <div className="py-8">{children}</div>
        </main>
        <ThresholdConfigModal />
      </div>
    </div>
  )
}
