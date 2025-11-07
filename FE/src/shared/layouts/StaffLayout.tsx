import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, FileText, Shield, Menu, X, Bell, ChevronRight, Home, Package, ShoppingCart, MessageSquare, BarChart3 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import LogoutButton from '@/shared/ui/LogoutButton'
import { Badge } from '@/shared/ui/badge'
import { User } from 'lucide-react'

interface StaffLayoutProps {
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
    href: '/staff/dashboard',
    icon: BarChart3,
    description: 'Tổng quan & báo cáo',
  },
  {
    name: 'Nhật ký công việc',
    href: '/staff/work-logs',
    icon: FileText,
    description: 'Theo dõi nhiệm vụ hàng ngày',
  },
  {
    name: 'Kiểm tra chất lượng',
    href: '/staff/quality-checks',
    icon: Shield,
    badge: 2,
    description: 'Giám sát chất lượng cây trồng',
  },
  {
    name: 'Quản lý sản phẩm',
    href: '/staff/products',
    icon: Package,
    description: 'Quản lý sản phẩm nông nghiệp',
  },
  {
    name: 'Quản lý đơn hàng',
    href: '/staff/orders',
    icon: ShoppingCart,
    description: 'Theo dõi & xử lý đơn hàng',
  },
  {
    name: 'Quản lý đánh giá',
    href: '/staff/feedbacks',
    icon: MessageSquare,
    description: 'Xem & quản lý đánh giá khách hàng',
  },
]

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('staff-sidebar-open')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSidebarToggle = (newState: boolean) => {
    setIsSidebarOpen(newState)
    localStorage.setItem('staff-sidebar-open', JSON.stringify(newState))
  }

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    if (pathSegments[0] === 'staff') {
      breadcrumbs.push({ name: 'Cổng nhân viên', href: '/staff/dashboard' })

      if (pathSegments[1]) {
        const currentPage = navigationItems.find(item => item.href.includes(pathSegments[1]))
        if (currentPage) {
          breadcrumbs.push({ name: currentPage.name, href: currentPage.href })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const NavLink: React.FC<{ item: NavItem; mobile?: boolean }> = ({ item, mobile = false }) => {
    const isActive = isActiveRoute(item.href)

    return (
      <motion.button
        onClick={() => {
          navigate(item.href)
          if (mobile) setIsMobileSidebarOpen(false)
        }}
        className={`w-full group flex items-center ${isSidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive
          ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        whileHover={{ scale: mobile ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <item.icon
          className={`${isSidebarOpen ? 'mr-3' : 'mx-auto'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'
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
              <p className={`text-xs mt-0.5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                {item.description}
              </p>
            )}
          </div>
        )}
      </motion.button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      { }
      <motion.div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white shadow-lg border-r border-gray-200 ${isSidebarOpen ? 'lg:w-72' : 'lg:w-20'
          }`}
        animate={{ width: isSidebarOpen ? 288 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        { }
        <div className="relative border-b border-gray-200">
          {isSidebarOpen ? (
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-bold text-gray-900">Cổng nhân viên</h1>
                  <p className="text-sm text-gray-500">Hoạt động thực địa</p>
                </motion.div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarToggle(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSidebarToggle(!isSidebarOpen)}
                className="w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 border-gray-300 shadow-sm bg-white"
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
          <div className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Nhân viên thực địa</p>
                <p className="text-xs text-gray-500 truncate">staff@farm.com</p>
              </div>
            )}
            {isSidebarOpen && (
              <LogoutButton className="text-gray-500 hover:text-gray-700" iconOnly />
            )}
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
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-25"
              onClick={() => setIsMobileSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.nav
              className="fixed top-0 left-0 bottom-0 flex flex-col w-80 max-w-xs bg-white shadow-xl border-r border-gray-200"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Cổng nhân viên</h1>
                    <p className="text-sm text-gray-500">Hoạt động thực địa</p>
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
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
        { }
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-gray-50 mr-4 border-gray-300 shadow-sm"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                { }
                <nav className="hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="text-gray-500 hover:text-gray-700 p-2 flex-shrink-0"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                  {breadcrumbs.map(crumb => (
                    <React.Fragment key={crumb.href}>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <button
                        onClick={() => navigate(crumb.href)}
                        className="text-gray-500 hover:text-gray-700 font-medium truncate"
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-2 border-white">
                    5
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
