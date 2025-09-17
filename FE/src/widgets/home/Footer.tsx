import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Facebook, Instagram, MapPin } from 'lucide-react'
import { fadeIn, inViewProps, useSafeVariants } from '@/shared/lib/motion'

const footerSections = {
  about: {
    title: 'Giới thiệu về dự án IoT Farm',
    content:
      'Dự án tốt nghiệp xây dựng hệ thống quản lý nông trại thông minh ứng dụng công nghệ IoT. Hỗ trợ người nông dân với dữ liệu thời gian thực, hệ thống tự động và phân tích thông minh hướng tới nông nghiệp bền vững.',
  },
  quickLinks: [
    { name: 'Giới thiệu', href: '#about' },
    { name: 'Tính năng hệ thống', href: '#features' },
    { name: 'Tài liệu', href: '#' },
    { name: 'Hỗ trợ kỹ thuật', href: '#contact' },
    { name: 'Chính sách bảo mật', href: '#' },
    { name: 'Điều khoản dịch vụ', href: '#' },
  ],
  contact: {
    email: 'toannxse171297@fpt.edu.vn',
    phone: '0786485999',
    address: 'FPT University',
  },
}

const socialLinks = [
  { icon: Facebook, href: 'https://www.facebook.com/xuantoan.ngo.18', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/xuantoannn_30/', label: 'Instagram' },
]

export const Footer: React.FC = () => {
  const fadeInVariants = useSafeVariants(fadeIn)

  return (
    <footer className="bg-muted border-t border-border">
      <motion.div
        className="container mx-auto px-4 py-12 lg:py-16"
        {...inViewProps}
        variants={fadeInVariants}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Section */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">{footerSections.about.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {footerSections.about.content}
              </p>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Theo dõi chúng tôi</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
            <h3 className="text-lg font-semibold text-foreground">Liên kết nhanh</h3>
            <ul className="space-y-3">
              {footerSections.quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-brand transition-colors duration-200 text-sm flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${footerSections.contact.email}`}
                  className="hover:text-brand transition-colors duration-200 text-sm break-all"
                >
                  {footerSections.contact.email}
                </a>
              </div>

              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-brand flex-shrink-0" />
                <a
                  href={`tel:${footerSections.contact.phone}`}
                  className="hover:text-brand transition-colors duration-200 text-sm"
                >
                  {footerSections.contact.phone}
                </a>
              </div>

              <div className="flex items-start space-x-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{footerSections.contact.address}</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-muted-foreground text-sm text-center sm:text-left">
              © 2025 IoT Farm Project - FPT University.
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
