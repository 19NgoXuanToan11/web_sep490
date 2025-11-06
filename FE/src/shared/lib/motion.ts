import { useReducedMotion } from 'framer-motion'

export const motionDurations = {
  fast: 150,
  base: 240,
  slow: 360,
} as const

export const motionEasings = {
  standard: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  emphasized: [0.2, 0, 0, 1] as [number, number, number, number],
} as const

export const useReducedMotionSafe = () => {
  const shouldReduceMotion = useReducedMotion()
  return shouldReduceMotion ?? false
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: motionDurations.base / 1000,
      ease: motionEasings.standard,
    },
  },
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurations.base / 1000,
      ease: motionEasings.standard,
    },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: motionDurations.fast / 1000,
      ease: motionEasings.standard,
    },
  },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionDurations.base / 1000,
      ease: motionEasings.standard,
    },
  },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionDurations.base / 1000,
      ease: motionEasings.standard,
    },
  },
}

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const inViewProps = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, amount: 0.25 },
}

export const useSafeVariants = (variants: any) => {
  const shouldReduceMotion = useReducedMotionSafe()

  if (shouldReduceMotion) {
    return {
      hidden: { opacity: 1 },
      show: { opacity: 1 },
    }
  }

  return variants
}
