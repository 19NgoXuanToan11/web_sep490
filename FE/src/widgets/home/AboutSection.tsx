import React from 'react'
import { motion } from 'framer-motion'
import { Target, Eye, Heart, Zap, Shield, Globe } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui'
import { fadeInUp, staggerContainer, inViewProps, useSafeVariants } from '@/shared/lib/motion'

const values = [
  {
    icon: Target,
    title: 'Real-time Monitoring',
    description: '24/7 tracking of environmental parameters and crop conditions',
  },
  {
    icon: Shield,
    title: 'Automation',
    description: 'Automated irrigation and environmental control based on sensor data',
  },
  {
    icon: Globe,
    title: 'Data Management',
    description: 'Collect, store and analyze data from multiple sources',
  },
  {
    icon: Heart,
    title: 'User-friendly Interface',
    description: 'Intuitive dashboard that is easy to use for all user types',
  },
]

const milestones = [
  {
    year: 'Q1 2024',
    title: 'Project Initiation',
    description: 'Research and technology selection phase',
  },
  {
    year: 'Q2 2024',
    title: 'System Design',
    description: 'Complete system architecture and interface design',
  },
  {
    year: 'Q3 2024',
    title: 'Backend Development',
    description: 'Build API, database and IoT integration',
  },
  {
    year: 'Q4 2024',
    title: 'Frontend Development',
    description: 'Complete user interface and user experience',
  },
  {
    year: 'Q1 2025',
    title: 'Testing & Defense',
    description: 'System testing and thesis defense preparation',
  },
]

export const AboutSection: React.FC = () => {
  const containerVariants = useSafeVariants(staggerContainer)
  const itemVariants = useSafeVariants(fadeInUp)

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div className="text-center mb-16" {...inViewProps} variants={itemVariants}>
          <motion.p
            className="text-brand font-semibold uppercase tracking-wider text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            ABOUT PROJECT
          </motion.p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Graduation Project - IoT Farm System
          </h2>
          <div className="w-24 h-1 bg-brand mx-auto rounded-full" />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left: Story & Mission */}
          <motion.div className="space-y-8" {...inViewProps} variants={itemVariants}>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">Project Overview</h3>
              <p className="text-muted-foreground leading-relaxed">
                This graduation project is developed to apply IoT (Internet of Things) technology to
                modern farm management. The project focuses on building a comprehensive system that
                helps automate and optimize agricultural processes through data collection and
                analysis from IoT sensors.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The system is designed with three main user roles: System Administrator, Farm
                Manager, and Staff. Each role has appropriate functions and permissions to ensure
                efficient farm operations.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="p-6 bg-brand/5 rounded-xl border border-brand/10"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-brand mr-3" />
                  <h4 className="font-bold text-foreground">Mission</h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  Develop a smart farm management system using IoT technology to optimize
                  agricultural production efficiency, minimize resource waste, and support
                  data-driven decision making.
                </p>
              </motion.div>

              <motion.div
                className="p-6 bg-brand/5 rounded-xl border border-brand/10"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center mb-4">
                  <Eye className="w-8 h-8 text-brand mr-3" />
                  <h4 className="font-bold text-foreground">Vision</h4>
                </div>
                <p className="text-muted-foreground text-sm">
                  Successfully apply IoT technology in agriculture, contributing to the
                  modernization of the agricultural sector and improving farmers' quality of life
                  through intelligent technology solutions.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Timeline */}
          <motion.div className="relative" {...inViewProps} variants={itemVariants}>
            <h3 className="text-2xl font-bold text-foreground mb-8">Project Timeline</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-brand/30" />

              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  className="relative flex items-start mb-8 last:mb-0"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm">
                    <Zap className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="ml-6">
                    <div className="flex items-center mb-2">
                      <span className="text-brand font-bold text-lg mr-3">{milestone.year}</span>
                      <h4 className="font-bold text-foreground">{milestone.title}</h4>
                    </div>
                    <p className="text-muted-foreground text-sm">{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div className="text-center mb-12" {...inViewProps} variants={itemVariants}>
          <h3 className="text-2xl font-bold text-foreground mb-4">Key Features</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Core features of the IoT smart farm management system.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          {...inViewProps}
          variants={containerVariants}
        >
          {values.map((value, index) => (
            <motion.div key={index} variants={itemVariants} className="group">
              <Card className="h-full border-brand/20 hover:border-brand/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/50 backdrop-blur-sm group-hover:bg-brand/5">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300">
                    <value.icon className="w-7 h-7" />
                  </div>

                  <h4 className="font-bold text-foreground group-hover:text-brand transition-colors duration-200">
                    {value.title}
                  </h4>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
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
