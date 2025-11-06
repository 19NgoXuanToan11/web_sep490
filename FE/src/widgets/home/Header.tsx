import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Leaf } from 'lucide-react'
import { Button } from '@/shared/ui'
import { useLocation, useNavigate } from 'react-router-dom'

const navigationItems: { name: string; href: string }[] = []

const roleItems = [

]

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    if (location.pathname !== '/') {
      window.location.href = `/${href}`
      return
    }
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-border/50'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-xl">
              <span className={`${isScrolled ? 'text-foreground' : 'text-white'}`}>IoT</span>
              <span className="text-brand">Farm</span>
            </div>
          </motion.div>

          {}
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => scrollToSection(item.href)}
                className={`font-medium transition-colors duration-200 hover:text-brand ${
                  isScrolled ? 'text-foreground' : 'text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {}
          <div className="hidden lg:flex items-center space-x-3 mx-6" />

          {}
          <div className="flex items-center space-x-3">
            {}
            <Button
              className="hidden lg:inline-flex bg-brand hover:bg-brand-hover text-white"
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </Button>

            {}
            <button
              className={`lg:hidden p-2 rounded-md transition-colors duration-200 ${
                isScrolled ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col space-y-4">
                  {navigationItems.map((item, index) => (
                    <motion.button
                      key={index}
                      onClick={() => scrollToSection(item.href)}
                      className="text-left font-medium text-foreground hover:text-brand transition-colors duration-200 py-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {item.name}
                    </motion.button>
                  ))}

                  {}
                  <div className="border-t border-border pt-4 mt-4" />

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navigationItems.length + roleItems.length) * 0.1 }}
                  >
                    <Button
                      className="w-full bg-brand hover:bg-brand-hover text-white mt-4"
                      onClick={() => navigate('/login')}
                    >
                      Đăng nhập
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navigationItems.length * 0.1 + 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => navigate('/register')}
                    >
                      Đăng ký
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
