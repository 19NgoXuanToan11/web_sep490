import React from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  Cpu,
  Monitor,
  Thermometer,
  Droplets,
  Users,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/ui'
import { fadeInUp, staggerContainer, inViewProps, useSafeVariants } from '@/shared/lib/motion'

const features = [
  {
    icon: Thermometer,
    title: 'GIÁM SÁT MÔI TRƯỜNG',
    description:
      'Theo dõi nhiệt độ, độ ẩm không khí, độ ẩm đất và các thông số môi trường khác qua cảm biến IoT.',
  },
  {
    icon: Droplets,
    title: 'TƯỚI TIÊU TỰ ĐỘNG',
    description:
      'Hệ thống tưới thông minh hoạt động tự động dựa trên dữ liệu độ ẩm đất và nhu cầu cây trồng.',
  },
  {
    icon: BarChart3,
    title: 'PHÂN TÍCH DỮ LIỆU',
    description: 'Thu thập, xử lý và phân tích dữ liệu để đưa ra quyết định quản lý hiệu quả.',
  },
  {
    icon: Users,
    title: 'QUẢN LÝ NGƯỜI DÙNG',
    description:
      'Hệ thống phân quyền với ba vai trò: Quản trị hệ thống, Quản lý nông trại và Nhân viên.',
  },
  {
    icon: Monitor,
    title: 'BẢNG ĐIỀU KHIỂN TRỰC QUAN',
    description: 'Giao diện web thân thiện hiển thị thông tin thời gian thực và báo cáo chi tiết.',
  },
  {
    icon: Database,
    title: 'LƯU TRỮ DỮ LIỆU',
    description:
      'Cơ sở dữ liệu tập trung lưu trữ toàn bộ thông tin cảm biến và hoạt động nông trại.',
  },
  {
    icon: Activity,
    title: 'CẢNH BÁO THÔNG MINH',
    description: 'Hệ thống cảnh báo tự động khi các chỉ số vượt ngưỡng an toàn đã thiết lập.',
  },
  {
    icon: Cpu,
    title: 'TÍCH HỢP IOT',
    description: 'Kết nối và quản lý nhiều thiết bị IoT thông qua các giao thức tiêu chuẩn.',
  },
]

export const FeaturesSection: React.FC = () => {
  const containerVariants = useSafeVariants(staggerContainer)
  const itemVariants = useSafeVariants(fadeInUp)

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {}
        <motion.div className="text-center mb-16" {...inViewProps} variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            TÍNH NĂNG HỆ THỐNG
          </h2>
          <div className="w-24 h-1 bg-brand mx-auto rounded-full" />
        </motion.div>

        {}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          {...inViewProps}
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="group">
              <Card className="h-full border-brand/20 hover:border-brand/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-4">
                  {}
                  <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center group-hover:bg-brand/20 transition-colors duration-300">
                    <feature.icon className="w-8 h-8 text-brand" />
                  </div>

                  {}
                  <h3 className="font-bold text-sm uppercase tracking-wider text-foreground leading-tight">
                    {feature.title}
                  </h3>

                  {}
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
