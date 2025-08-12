import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/shared/ui'
import { fadeInUp, staggerContainer, inViewProps, useSafeVariants } from '@/shared/lib/motion'

const teamMembers = [
  {
    name: 'LE QUANG HUY',
    role: 'Customer',
    bio: 'Organic vegetable farmer using IoT for precision agriculture',
    image: '../../../public/images/client1.png',
  },
  {
    name: 'LE VAN TAM',
    role: 'Customer',
    bio: 'Greenhouse specialist leveraging smart sensors for optimal growth',
    image: '../../../public/images/client2.png',
  },
  {
    name: 'NGUYEN VAN HOA',
    role: 'Customer',
    bio: 'Livestock farmer monitoring pasture conditions with IoT technology',
    image: '../../../public/images/client3.png',
  },
]

export const TeamSection: React.FC = () => {
  const containerVariants = useSafeVariants(staggerContainer)
  const itemVariants = useSafeVariants(fadeInUp)

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">  
        {/* Section title */}
        <motion.div className="text-center mb-16" {...inViewProps} variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            MEET OUR CUSTOMERS
          </h2>
          <div className="w-24 h-1 bg-brand mx-auto rounded-full" />
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
            Discover how farmers around the world are transforming their operations with our
            IoT-based farm management solutions.
          </p>
        </motion.div>

        {/* Team grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          {...inViewProps}
          variants={containerVariants}
        >
          {teamMembers.map((member, index) => (
            <motion.div key={index} variants={itemVariants} className="group">
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card">
                <div className="relative overflow-hidden">
                  {/* Member image */}
                  <motion.img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardContent className="p-6 text-center">
                  {/* Name */}
                  <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-brand transition-colors duration-200">
                    {member.name}
                  </h3>

                  {/* Role */}
                  <p className="text-brand font-semibold text-sm uppercase tracking-wider mb-3">
                    {member.role}
                  </p>

                  {/* Bio */}
                  <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
