import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/shared/ui'
import { useReducedMotionSafe, fadeIn, slideInLeft } from '@/shared/lib/motion'

export const HeroSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotionSafe()
  const { scrollYProgress } = useScroll()

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
        {/* Farm background video */}
        <motion.video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-80"
          style={{ y: backgroundY }}
        >
          <source src="../../../public/videos/farm.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <div className="w-full h-full bg-gradient-to-br from-green-800 via-green-600 to-emerald-500" />
        </motion.video>
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
              WE ARE IOT FARM
            </motion.p>

            {/* Main heading */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              IOT-POWERED PRODUCE,{' '}
              <span className="text-brand-foreground block lg:inline">NATURALLY GROWN</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-white/90 text-lg md:text-xl leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Revolutionizing agriculture through intelligent IoT sensors and automated systems.
              Monitor, control, and optimize your farm operations remotely for sustainable and
              efficient crop production.
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
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 2,
          repeat: shouldReduceMotion ? 0 : Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent mx-auto mb-2" />
        <p className="text-xs uppercase tracking-wider">Scroll Down</p>
      </motion.div>
    </motion.section>
  )
}
