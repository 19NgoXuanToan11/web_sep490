import React from 'react'
import { motion } from 'framer-motion'
import { Activity, Database, Cpu, Monitor } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui'
import { fadeInUp, staggerContainer, inViewProps, useSafeVariants } from '@/shared/lib/motion'

const features = [
  {
    icon: Activity,
    title: 'SENSOR SYSTEM SETUP',
    description:
      'Deploy advanced IoT sensors across your farm to monitor soil moisture, temperature, humidity, and nutrient levels in real-time.',
  },
  {
    icon: Database,
    title: 'DATA CONNECTION & PROCESSING',
    description:
      'Seamlessly collect and process sensor data through secure cloud connectivity for intelligent decision making.',
  },
  {
    icon: Cpu,
    title: 'FARMING PROCESS AUTOMATION',
    description:
      'Automate irrigation, fertilization, and other farming processes based on real-time data and predictive analytics.',
  },
  {
    icon: Monitor,
    title: 'REMOTE MONITORING & ADJUSTMENT',
    description:
      'Monitor and control your entire farm operation remotely through our intuitive dashboard and mobile application.',
  },
]

export const FeaturesSection: React.FC = () => {
  const containerVariants = useSafeVariants(staggerContainer)
  const itemVariants = useSafeVariants(fadeInUp)

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section title */}
        <motion.div className="text-center mb-16" {...inViewProps} variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">HOW IT'S WORKING</h2>
          <div className="w-24 h-1 bg-brand mx-auto rounded-full" />
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          {...inViewProps}
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="group">
              <Card className="h-full border-brand/20 hover:border-brand/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-4">
                  {/* Icon */}
                  <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center group-hover:bg-brand/20 transition-colors duration-300">
                    <feature.icon className="w-8 h-8 text-brand" />
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm uppercase tracking-wider text-foreground leading-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
