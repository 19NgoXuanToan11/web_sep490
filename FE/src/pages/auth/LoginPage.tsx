import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { showErrorToast } from '@/shared/lib/toast-manager'
import { Mail, Lock } from 'lucide-react'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/store/authStore'
import { APP_CONFIG, ROUTES } from '@/shared/constants/app'

const ROLE_REDIRECTS: Record<string, string> = {
  [APP_CONFIG.ROLES.ADMIN]: ROUTES.ADMIN.DASHBOARD,
  [APP_CONFIG.ROLES.MANAGER]: ROUTES.MANAGER.DASHBOARD,
  [APP_CONFIG.ROLES.STAFF]: ROUTES.STAFF.DASHBOARD,
}

export const LoginPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const setToken = useAuthStore(s => s.setToken)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await authApi.login({ email: form.email, password: form.password })
      const token = (res as any).token || (res as any).Token
      if (token) {
        setToken(token)

        const role = useAuthStore.getState().role
        const redirectPath = role ? ROLE_REDIRECTS[role] : undefined
        navigate(redirectPath ?? ROUTES.HOME)
      }
    } catch (err) {
      showErrorToast(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      <video
        src="/videos/farm1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      <div className="absolute inset-0" />

      <motion.div
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 -right-16 w-[28rem] h-[28rem] rounded-full"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-8 left-8 z-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </Button>
      </motion.div>

      <div className="container relative z-10 px-4">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-white">Chào mừng trở lại</CardTitle>
                <p className="text-white/70 text-sm">Đăng nhập để quản lý nông trại thông minh</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-brand text-white hover:bg-brand-hover relative overflow-hidden group transition-all duration-700 ease-out hover:bg-transparent hover:backdrop-blur-md hover:border-white/30 hover:shadow-2xl hover:shadow-white/10 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000 before:ease-out after:absolute after:inset-0 after:bg-gradient-to-r after:from-white/10 after:via-white/30 after:to-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500 after:blur-sm"
                    disabled={isSubmitting}
                  >
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white/90">
                      {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
                    </span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
