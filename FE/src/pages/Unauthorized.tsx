import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react'

const Unauthorized: React.FC = () => {
  const location = useLocation() as any
  const reason = location.state?.reason as 'not_authenticated' | 'forbidden' | undefined

  const title =
    reason === 'not_authenticated' ? 'Phiên đăng nhập đã hết hạn' : 'Không có quyền truy cập'
  const desc =
    reason === 'not_authenticated'
      ? 'Hãy đăng nhập lại để tiếp tục sử dụng hệ thống.'
      : 'Tài khoản của bạn không có quyền vào trang này.'

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Subtle animated background */}
      <motion.div
        className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-brand/20 blur-[110px]"
        animate={{ y: [0, 20, 0], opacity: [0.55, 0.75, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full bg-emerald-400/20 blur-[110px]"
        animate={{ y: [0, -20, 0], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Glass card */}
        <div className="group rounded-2xl p-[1px] bg-gradient-to-b from-white/25 to-white/5 shadow-2xl">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-brand">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-white/75 text-sm mt-1">{desc}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default Unauthorized
