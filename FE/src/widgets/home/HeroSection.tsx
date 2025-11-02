import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/shared/ui'
import { useReducedMotionSafe, fadeIn, slideInLeft } from '@/shared/lib/motion'
import { useNavigate } from 'react-router-dom'

export const HeroSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotionSafe()
  const { scrollYProgress } = useScroll()
  const navigate = useNavigate()

  // Parallax transforms - disabled if motion should be reduced
  const backgroundY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, 80])

  const farmerY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -40])

  return (
    <motion.section
      className="relative min-h-screen flex items-center overflow-hidden"
      initial="hidden"
      animate="show"
      variants={fadeIn}
    >
      {/* Background with parallax */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-900/70 to-green-700/50"
        style={{ y: backgroundY }}
      >
        <video
          src="/videos/farm3.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </motion.div>

      {/* Farmer image with counter-parallax */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full hidden lg:block"
        style={{ y: farmerY }}
      >
        {/* Farmer placeholder - using CSS */}
        <div className="w-full h-full relative">
          <div className="absolute bottom-0 right-12 w-80 h-96 bg-gradient-to-t from-green-800/30 to-green-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-80 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          <motion.div className="space-y-6" variants={slideInLeft}>
            {/* Caption */}
            <motion.p
              className="text-brand-foreground/80 uppercase tracking-[0.2em] text-sm font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              HỆ THỐNG NÔNG TRẠI IOT
            </motion.p>

            {/* Main heading */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              HỆ THỐNG{' '}
              <span className="text-brand-foreground block lg:inline">
                QUẢN LÝ NÔNG TRẠI THÔNG MINH
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-white/90 text-lg md:text-xl leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Dự án tốt nghiệp xây dựng hệ thống quản lý nông trại thông minh dựa trên IoT. Hệ thống
              hỗ trợ ba vai trò chính: Quản trị hệ thống, Quản lý nông trại và Nhân viên, cung cấp
              giám sát thời gian thực, tưới tiêu tự động và ra quyết định dựa trên dữ liệu hướng tới
              nông nghiệp bền vững.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
              whileTap={{ scale: shouldReduceMotion ? 1 : 0.98 }}
            >
              <Button
                size="lg"
                className="bg-brand hover:bg-brand-hover text-brand-foreground px-8 py-4 text-base rounded-full transform transition-all duration-200"
                onClick={() => navigate('/login')}
              >
                Truy cập hệ thống
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
