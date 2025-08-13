import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { fadeInUp, staggerContainer, inViewProps, useSafeVariants } from '@/shared/lib/motion'

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  farmSize: string
  message: string
  interests: string[]
}

interface ContactInfo {
  icon: React.ComponentType<{ className?: string }>
  title: string
  details: string[]
  action?: string
}

const contactMethods: ContactInfo[] = [
  {
    icon: Phone,
    title: 'Phone Contact',
    details: ['(+84) 123-456-789', 'Monday - Friday, 8:00 - 17:00'],
    action: 'Call Now',
  },
  {
    icon: Mail,
    title: 'Email Support',
    details: ['iotfarm.project@gmail.com', 'Response within 24 hours'],
    action: 'Send Email',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    details: ['24/7 Support', 'Instant consultation'],
    action: 'Start Chat',
  },
  {
    icon: Calendar,
    title: 'Schedule Demo',
    details: ['Free 30-minute consultation', 'Detailed system introduction'],
    action: 'Book Schedule',
  },
]

const officeLocations = [
  {
    city: 'Hanoi',
    country: 'Vietnam',
    address: 'FPT University, Hoa Lac Hi-Tech Park',
    phone: '(+84) 123-456-789',
    email: 'iotfarm.hanoi@fpt.edu.vn',
  },
  {
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    address: 'FPT University HCMC, District 9',
    phone: '(+84) 987-654-321',
    email: 'iotfarm.hcm@fpt.edu.vn',
  },
  {
    city: 'Da Nang',
    country: 'Vietnam',
    address: 'FPT University Da Nang, Ngu Hanh Son',
    phone: '(+84) 456-789-123',
    email: 'iotfarm.danang@fpt.edu.vn',
  },
]

const interestOptions = [
  'Soil Moisture Sensors',
  'Temperature & Humidity Sensors',
  'Automated Irrigation System',
  'Environmental Monitoring',
  'Data Analytics',
  'Smart Alerts',
  'User Management',
  'IoT Integration',
]

const farmSizeOptions = [
  'IoT Technology in Agriculture',
  'Farm Management Systems',
  'Agricultural Data Analytics',
  'Agricultural Automation',
  'Graduation Project Research',
  'Project Development Collaboration',
]

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    farmSize: '',
    message: '',
    interests: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const containerVariants = useSafeVariants(staggerContainer)
  const itemVariants = useSafeVariants(fadeInUp)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleInterestChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        farmSize: '',
        message: '',
        interests: [],
      })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-20 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_theme(colors.brand),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div className="text-center mb-16" {...inViewProps} variants={itemVariants}>
          <motion.p
            className="text-brand font-semibold uppercase tracking-wider text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            CONTACT US
          </motion.p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Contact Information & Support
          </h2>
          <div className="w-24 h-1 bg-brand mx-auto rounded-full" />
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
            Contact the development team to learn more about the IoT Smart Farm Management System 
            graduation project or provide feedback for improvement.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div className="lg:col-span-2" {...inViewProps} variants={itemVariants}>
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">
                  Contact Development Team
                </CardTitle>
                <p className="text-muted-foreground">
                  Send your contact information and we will respond within 24 hours.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {submitStatus === 'success' && (
                  <motion.div
                    className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-green-800 font-semibold">Message sent successfully!</p>
                      <p className="text-green-700 text-sm">
                        We will contact you within 24 hours.
                      </p>
                    </div>
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-red-800 font-semibold">Failed to send message</p>
                      <p className="text-red-700 text-sm">
                        Please try again or contact us directly.
                      </p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization/University
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
                        placeholder="Enter organization or university name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Area of Interest
                    </label>
                    <select
                      name="farmSize"
                      value={formData.farmSize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200"
                    >
                      <option value="">Select area of interest</option>
                      {farmSizeOptions.map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Features of Interest
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {interestOptions.map(interest => (
                        <label
                          key={interest}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestChange(interest)}
                            className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand focus:ring-2"
                          />
                          <span className="text-sm text-foreground">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-200 resize-vertical"
                      placeholder="Describe your inquiry or questions about the project..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand hover:bg-brand-hover text-white py-4 text-lg font-semibold disabled:opacity-50"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <motion.div
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </motion.div>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Methods & Office Locations */}
          <motion.div className="space-y-8" {...inViewProps} variants={containerVariants}>
            {/* Contact Methods */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-bold text-foreground mb-6">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <motion.div key={index} variants={itemVariants} className="group">
                    <Card className="border-brand/20 hover:border-brand/40 transition-all duration-300 hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300">
                            <method.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground mb-1">{method.title}</h4>
                            {method.details.map((detail, idx) => (
                              <p key={idx} className="text-muted-foreground text-sm">
                                {detail}
                              </p>
                            ))}
                            {method.action && (
                              <button className="text-brand text-sm font-medium hover:underline mt-2">
                                {method.action}
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Office Locations */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-bold text-foreground mb-6">Project Offices</h3>
              <div className="space-y-4">
                {officeLocations.map((office, index) => (
                  <motion.div key={index} variants={itemVariants} className="group">
                    <Card className="border-brand/20 hover:border-brand/40 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-brand flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {office.city}, {office.country}
                            </h4>
                            <p className="text-muted-foreground text-sm mt-1">{office.address}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-brand text-sm">{office.phone}</p>
                              <p className="text-brand text-sm">{office.email}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Business Hours */}
            <motion.div variants={itemVariants}>
              <Card className="bg-brand/5 border-brand/20">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-brand mx-auto mb-4" />
                  <h4 className="font-semibold text-foreground mb-2">Business Hours</h4>
                  <div className="space-y-1 text-muted-foreground text-sm">
                    <p>Monday - Friday: 8:00 - 17:00</p>
                    <p>Saturday: 9:00 - 15:00</p>
                    <p>Sunday: Emergency support only</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
