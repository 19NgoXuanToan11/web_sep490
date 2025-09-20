import React, { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Cpu,
  Building,
  ShoppingCart,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { AdminLayout } from '@/shared/layouts/AdminLayout'
import { Button } from '@/shared/ui/button'

const AdminReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const periods = [
    { value: '7d', label: '7 ngày qua' },
    { value: '30d', label: '30 ngày qua' },
    { value: '90d', label: '3 tháng qua' },
    { value: 'custom', label: 'Tùy chọn' },
  ]

  const reportCategories = [
    {
      id: 'system',
      title: 'Hiệu suất hệ thống',
      icon: Cpu,
      description: 'Tổng quan về tình trạng và hiệu suất hệ thống',
      color: 'bg-blue-500',
    },
    {
      id: 'users',
      title: 'Hoạt động người dùng',
      icon: Users,
      description: 'Phân tích hành vi và tương tác người dùng',
      color: 'bg-green-500',
    },
    {
      id: 'devices',
      title: 'Thiết bị IoT',
      icon: Cpu,
      description: 'Trạng thái và hiệu suất thiết bị IoT',
      color: 'bg-purple-500',
    },
    {
      id: 'farms',
      title: 'Quản lý trang trại',
      icon: Building,
      description: 'Hiệu quả hoạt động các trang trại',
      color: 'bg-orange-500',
    },
    {
      id: 'orders',
      title: 'Đơn hàng & Doanh thu',
      icon: ShoppingCart,
      description: 'Phân tích doanh thu và xu hướng đặt hàng',
      color: 'bg-indigo-500',
    },
    {
      id: 'alerts',
      title: 'Cảnh báo & Sự cố',
      icon: AlertTriangle,
      description: 'Báo cáo về các cảnh báo và sự cố hệ thống',
      color: 'bg-red-500',
    },
  ]

  const keyMetrics = [
    {
      title: 'Tổng doanh thu',
      value: '₫2,847,500,000',
      change: '+12.5%',
      trend: 'up',
      period: '30 ngày qua',
    },
    {
      title: 'Người dùng hoạt động',
      value: '1,247',
      change: '+8.3%',
      trend: 'up',
      period: '30 ngày qua',
    },
    {
      title: 'Thiết bị trực tuyến',
      value: '142/156',
      change: '+2.1%',
      trend: 'up',
      period: 'Hiện tại',
    },
    {
      title: 'Trang trải hoạt động',
      value: '23/25',
      change: '-4.2%',
      trend: 'down',
      period: 'Hiện tại',
    },
  ]

  const quickReports = [
    {
      title: 'Báo cáo hiệu suất tuần',
      description: 'Tổng quan hiệu suất hệ thống trong 7 ngày qua',
      lastGenerated: '2 giờ trước',
      status: 'ready',
    },
    {
      title: 'Phân tích người dùng tháng',
      description: 'Phân tích chi tiết hoạt động người dùng tháng này',
      lastGenerated: '1 ngày trước',
      status: 'ready',
    },
    {
      title: 'Báo cáo thiết bị IoT',
      description: 'Trạng thái và hiệu suất tất cả thiết bị IoT',
      lastGenerated: 'Đang tạo...',
      status: 'generating',
    },
    {
      title: 'Báo cáo tài chính quý',
      description: 'Tổng hợp doanh thu và chi phí quý hiện tại',
      lastGenerated: '3 ngày trước',
      status: 'ready',
    },
  ]

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo & Phân tích</h1>
            <p className="text-gray-600">Tổng quan chi tiết về hiệu suất và hoạt động hệ thống</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                {periods.find(p => p.value === selectedPeriod)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                  {periods.map(period => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setSelectedPeriod(period.value)
                        setShowDatePicker(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {keyMetrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="mb-2">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metric.change}
                </span>
                <span className="text-gray-500">{metric.period}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Report Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Danh mục báo cáo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCategories.map(category => (
              <div
                key={category.id}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`${category.color} rounded-xl p-3 text-white group-hover:scale-110 transition-transform duration-300`}
                  >
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reports */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Báo cáo nhanh</h2>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm">
              <Download className="w-4 h-4" />
              Xuất tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickReports.map((report, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'ready'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {report.status === 'ready' ? 'Sẵn sàng' : 'Đang tạo'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Cập nhật: {report.lastGenerated}</span>
                  {report.status === 'ready' && (
                    <button className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Tải xuống
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminReportsPage
