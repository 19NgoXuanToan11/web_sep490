import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle, Clock, Zap } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'

export type StatusType = 'online' | 'warning' | 'offline' | 'pending' | 'active'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  showPulse?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig: Record<StatusType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  text: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}> = {
  online: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    text: 'Online',
    badgeVariant: 'default'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    text: 'Warning',
    badgeVariant: 'secondary'
  },
  offline: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    text: 'Offline',
    badgeVariant: 'destructive'
  },
  pending: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    text: 'Pending',
    badgeVariant: 'outline'
  },
  active: {
    icon: Zap,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    text: 'Active',
    badgeVariant: 'default'
  }
}

const sizeConfig = {
  sm: { icon: 'h-3 w-3', container: 'px-2 py-1' },
  md: { icon: 'h-4 w-4', container: 'px-3 py-1.5' },
  lg: { icon: 'h-5 w-5', container: 'px-4 py-2' }
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showPulse = false,
  size = 'md',
  className = ''
}) => {
  const config = statusConfig[status]
  const sizes = sizeConfig[size]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`rounded-full p-1 ${config.bg}`}>
          <Icon className={`${sizes.icon} ${config.color}`} />
        </div>
        {showPulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.bg} opacity-75`}
            animate={{ scale: [1, 1.5], opacity: [0.75, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      {label && (
        <Badge
          variant={config.badgeVariant}
          className={`text-xs font-medium ${sizes.container}`}
        >
          {label || config.text}
        </Badge>
      )}
    </div>
  )
}
