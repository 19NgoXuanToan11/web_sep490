import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

export interface StatItem {
  label: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
    timeframe?: string
  }
  icon?: React.ComponentType<{ className?: string }>
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red'
}

interface QuickStatsWidgetProps {
  title: string
  stats: StatItem[]
  className?: string
  compact?: boolean
}

const colorConfig = {
  green: {
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    text: 'text-green-700',
    ring: 'ring-green-500/20'
  },
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-500/20'
  },
  orange: {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    ring: 'ring-orange-500/20'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    ring: 'ring-purple-500/20'
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-700',
    ring: 'ring-red-500/20'
  }
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  down: {
    icon: TrendingDown,
    color: 'text-red-600',
    bg: 'bg-red-50'
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-500',
    bg: 'bg-gray-50'
  }
}

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  title,
  stats,
  className = '',
  compact = false
}) => {
  return (
    <Card className={`bg-white shadow-sm border border-gray-200 ${className}`}>
      <CardHeader className={`border-b border-gray-100 ${compact ? 'pb-3' : 'pb-4'}`}>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </CardHeader>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className={`grid gap-${compact ? '3' : '4'} ${
          stats.length <= 2 ? 'grid-cols-1' :
          stats.length <= 4 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {stats.map((stat, index) => {
            const colors = colorConfig[stat.color || 'green']
            const Icon = stat.icon
            const TrendIcon = stat.change ? trendConfig[stat.change.trend].icon : null
            const trendStyle = stat.change ? trendConfig[stat.change.trend] : null

            return (
              <motion.div
                key={index}
                className={`p-${compact ? '3' : '4'} rounded-lg ${colors.bg} ${colors.ring} ring-1 hover:ring-2 transition-all duration-200`}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-${compact ? 'xs' : 'sm'} font-medium text-gray-600`}>
                    {stat.label}
                  </span>
                  {Icon && (
                    <div className={`p-1 rounded-md bg-gradient-to-br ${colors.gradient} shadow-sm`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className={`text-${compact ? 'lg' : 'xl'} font-bold text-gray-900 mb-1`}>
                  {stat.value}
                </div>

                {stat.change && (
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center text-xs ${trendStyle?.color}`}>
                      {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
                      <span className="font-medium">{stat.change.value}</span>
                    </div>
                    {stat.change.timeframe && (
                      <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                        {stat.change.timeframe}
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
