import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import { fadeIn, inViewProps, useSafeVariants } from '@/shared/lib/motion'

const footerSections = {
  about: {
    title: 'About IoT Farm Project',
    content:
      'A graduation project developing a smart farm management system using IoT technology. Supporting farmers with real-time data, automated systems, and intelligent analytics for sustainable agriculture.',
  },
  quickLinks: [
    { name: 'About', href: '#about' },
    { name: 'System Features', href: '#features' },
    { name: 'Documentation', href: '#' },
    { name: 'Technical Support', href: '#contact' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
  contact: {
    email: 'iotfarm.project@fpt.edu.vn',
    phone: '(+84) 123-456-789',
    address: 'FPT University, Hoa Lac Hi-Tech Park, Hanoi',
  },
}

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export const Footer: React.FC = () => {
  const fadeInVariants = useSafeVariants(fadeIn)

  return (
    <footer className="bg-muted border-t border-border">
      <motion.div
        className="container mx-auto px-4 py-16"
        {...inViewProps}
        variants={fadeInVariants}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">{footerSections.about.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {footerSections.about.content}
              </p>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Follow Us</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-brand/10 hover:bg-brand hover:text-brand-foreground text-brand rounded-full flex items-center justify-center transition-all duration-200"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              {footerSections.quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-brand transition-colors duration-200 hover:underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-brand flex-shrink-0" />
                <a
                  href={`mailto:${footerSections.contact.email}`}
                  className="hover:text-brand transition-colors duration-200"
                >
                  {footerSections.contact.email}
                </a>
              </div>

              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-brand flex-shrink-0" />
                <a
                  href={`tel:${footerSections.contact.phone}`}
                  className="hover:text-brand transition-colors duration-200"
                >
                  {footerSections.contact.phone}
                </a>
              </div>

              <div className="text-muted-foreground text-sm leading-relaxed">
                {footerSections.contact.address}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <motion.div
          className="container mx-auto px-4 py-6"
          {...inViewProps}
          variants={fadeInVariants}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              © 2025 IoT Farm Project - FPT University. All rights reserved.
            </div>

            <div className="flex space-x-6 text-sm">
              <a
                href="#"
                className="text-muted-foreground hover:text-brand transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-brand transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-brand transition-colors duration-200"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
