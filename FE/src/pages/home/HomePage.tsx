import React from 'react'
import { HeroSection } from '@/widgets/home/HeroSection'
import { FeaturesSection } from '@/widgets/home/FeaturesSection'
import { TeamSection } from '@/widgets/home/TeamSection'
import { Footer } from '@/widgets/home/Footer'

/**
 * Public Home Page Component
 *
 * Features:
 * - Hero section with parallax animations
 * - Features section with scroll-reveal cards
 * - Team/Customer section with hover animations
 * - Footer with social links and contact info
 * - Fully responsive and accessible
 * - Respects prefers-reduced-motion
 * - No network calls - all static content
 */
export const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <FeaturesSection />
      <TeamSection />
      <Footer />
    </main>
  )
}

export default HomePage
