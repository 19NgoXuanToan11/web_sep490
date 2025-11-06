import React from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  X,
  ArrowRight,
  Clock
} from 'lucide-react'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'

export type AlertType = 'info' | 'warning' | 'success' | 'error'
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical'

interface AlertCardProps {
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  timestamp?: string
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
  showDismiss?: boolean
  className?: string
}

const alertConfig: Record<AlertType, {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  bgColor: string
  borderColor: string
}> = {
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
}

const priorityConfig: Record<AlertPriority, {
  label: string
  badgeColor: string
  animate: boolean
}> = {
  low: {
    label: 'Low Priority',
    badgeColor: 'bg-gray-100 text-gray-600',
    animate: false
  },
  medium: {
    label: 'Medium Priority',
    badgeColor: 'bg-blue-100 text-blue-700',
    animate: false
  },
  high: {
    label: 'High Priority',
    badgeColor: 'bg-orange-100 text-orange-700',
    animate: true
  },
  critical: {
    label: 'Critical',
    badgeColor: 'bg-red-100 text-red-700',
    animate: true
  }
}

export const AlertCard: React.FC<AlertCardProps> = ({
  type,
  priority,
  title,
  message,
  timestamp,
  actionLabel,
  onAction,
  onDismiss,
  showDismiss = true,
  className = ''
}) => {
  const alertStyle = alertConfig[type]
  const priorityStyle = priorityConfig[priority]
  const Icon = alertStyle.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={`relative overflow-hidden ${alertStyle.bgColor} ${alertStyle.borderColor} border shadow-sm`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <motion.div
                className={`p-1 rounded-full ${alertStyle.bgColor}`}
                animate={priorityStyle.animate ? { scale: [1, 1.1, 1] } : {}}
                transition={priorityStyle.animate ? { repeat: Infinity, duration: 2 } : {}}
              >
                <Icon className={`h-5 w-5 ${alertStyle.iconColor}`} />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {title}
                  </h3>
                  <Badge className={`ml-2 text-xs ${priorityStyle.badgeColor} border-0`}>
                    {priorityStyle.label}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  {message}
                </p>

                {timestamp && (
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Clock className="h-3 w-3 mr-1" />
                    {timestamp}
                  </div>
                )}

                {actionLabel && onAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAction}
                    className={`text-xs ${alertStyle.iconColor} border-current hover:bg-white/50`}
                  >
                    {actionLabel}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {showDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="ml-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {}
        {(priority === 'high' || priority === 'critical') && (
          <motion.div
            className={`absolute bottom-0 left-0 h-1 ${
              priority === 'critical' ? 'bg-red-500' : 'bg-orange-500'
            }`}
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        )}
      </Card>
    </motion.div>
  )
}
