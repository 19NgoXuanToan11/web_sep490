import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Sprout,
  Thermometer,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useNavigate } from 'react-router-dom'
import { ManagerLayout } from '@/shared/layouts/ManagerLayout'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease'
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'increase',
  icon: Icon,
  description,
  color = 'green',
}) => {
  const colorClasses = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  }

  const changeIcon = changeType === 'increase' ? ArrowUpRight : ArrowDownRight
  const ChangeIcon = changeIcon

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[color]}`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          {change && (
            <div
              className={`flex items-center text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <ChangeIcon className="h-3 w-3 mr-1" />
              {change}
            </div>
          )}
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface ActivityItemProps {
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'info' | 'error'
  icon: React.ComponentType<{ className?: string }>
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  description,
  time,
  type,
  icon: Icon,
}) => {
  const typeClasses = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-orange-600 bg-orange-50',
    info: 'text-blue-600 bg-blue-50',
    error: 'text-red-600 bg-red-50',
  }

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`p-1.5 rounded-full ${typeClasses[type]}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  )
}

export default function ManagerDashboard() {
  const navigate = useNavigate()

  const recentActivities = [
    {
      title: 'Irrigation System Activated',
      description: 'Zone A watering cycle completed successfully',
      time: '2 min ago',
      type: 'success' as const,
      icon: Droplets,
    },
    {
      title: 'Low Stock Alert',
      description: 'Organic Tomatoes below threshold (15 units)',
      time: '5 min ago',
      type: 'warning' as const,
      icon: Package,
    },
    {
      title: 'New Order Received',
      description: 'Order #1245 - Mixed Vegetables (50 units)',
      time: '12 min ago',
      type: 'info' as const,
      icon: CheckCircle,
    },
    {
      title: 'Sensor Maintenance',
      description: 'Temperature sensor B2 requires calibration',
      time: '1 hour ago',
      type: 'warning' as const,
      icon: Thermometer,
    },
  ]

  const quickActions = [
    {
      title: 'Start Irrigation',
      description: 'Activate watering cycle',
      icon: Droplets,
      color: 'blue' as const,
      action: () => navigate('/manager/irrigation'),
    },
    {
      title: 'Add Inventory',
      description: 'Update stock levels',
      icon: Package,
      color: 'green' as const,
      action: () => navigate('/manager/inventory'),
    },
    {
      title: 'View Reports',
      description: 'Analytics & insights',
      icon: TrendingUp,
      color: 'purple' as const,
      action: () => navigate('/manager/reports'),
    },
    {
      title: 'System Settings',
      description: 'Configure parameters',
      icon: Zap,
      color: 'orange' as const,
      action: () => navigate('/manager/settings'),
    },
  ]

  return (
    <ManagerLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Farm Manager Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening on your farm today.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="System Status"
            value="Operational"
            change="+99.2% uptime"
            icon={Activity}
            color="green"
            description="All systems running smoothly"
          />
          <MetricCard
            title="Active Irrigation"
            value="3 Zones"
            change="2 scheduled"
            icon={Droplets}
            color="blue"
            description="Automated watering in progress"
          />
          <MetricCard
            title="Inventory Items"
            value="1,247"
            change="5 low stock"
            changeType="decrease"
            icon={Package}
            color="orange"
            description="Total products in stock"
          />
          <MetricCard
            title="Today's Revenue"
            value="$3,450"
            change="+12.5%"
            icon={DollarSign}
            color="purple"
            description="Sales performance today"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Metrics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Performance Overview
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <Sprout className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Crop Health</h3>
                    <p className="text-sm text-gray-600 mb-2">95% Excellent</p>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Optimal Growth
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Thermometer className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Climate Control</h3>
                    <p className="text-sm text-gray-600 mb-2">24°C / 65% RH</p>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Perfect Range
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Energy Usage</h3>
                    <p className="text-sm text-gray-600 mb-2">127 kWh today</p>
                    <Badge variant="default" className="bg-purple-100 text-purple-800">
                      Efficient
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      onClick={action.action}
                      className="p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${
                            action.color === 'blue'
                              ? 'from-blue-500 to-blue-600'
                              : action.color === 'green'
                                ? 'from-green-500 to-green-600'
                                : action.color === 'purple'
                                  ? 'from-purple-500 to-purple-600'
                                  : 'from-orange-500 to-orange-600'
                          } shadow-lg`}
                        >
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Recent Activity
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {recentActivities.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">System Health</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Irrigation System</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Temperature Sensors</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Normal
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Inventory System</span>
                    <Badge variant="default" className="bg-orange-100 text-orange-800">
                      Alerts (5)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Network Connection</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Stable
                    </Badge>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ManagerLayout>
  )
}
