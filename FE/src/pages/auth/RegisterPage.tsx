import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { Mail, Lock, User, Phone, ArrowRight, Home } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1400))
    setIsSubmitting(false)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background video with subtle parallax */}
      <motion.video
        src="/videos/farm2.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2 }}
      />
      <div className="absolute inset-0" />

      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.07] bg-[size:48px_48px]" />

      {/* Back to Home Button */}
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
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </motion.div>

      <div className="container relative z-10 px-4">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-white">Create Account</CardTitle>
                <p className="text-white/70 text-sm">Join the next-gen IoT Smart Farm platform</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                          placeholder="Nguyen Van A"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                          placeholder="(+84) 912 345 678"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-white/60 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-brand text-white hover:bg-brand-hover"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating account…' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-center text-white/80 text-sm">
                    Already have an account?{' '}
                    <Link className="text-brand-foreground hover:underline" to="/login">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
