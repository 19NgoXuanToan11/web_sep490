import React from 'react'
import { Header, HeroSection, FeaturesSection, Footer } from '@/widgets/home'

export const HomePage: React.FC = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background text-foreground">
        <div id="home">
          <HeroSection />
        </div>

        <div id="features">
          <FeaturesSection />
        </div>
      </main>

      <Footer />
    </>
  )
}

export default HomePage
