import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type GaugeTrend = 'up' | 'down' | 'stable'

interface GaugeProps {
  value: number
  min?: number
  max: number
  unit: string
  label: string
  icon?: React.ReactNode
  className?: string
  isLoading?: boolean
  dataQuality?: 'good' | 'poor' | 'error'
  lastUpdated?: Date
  trend?: GaugeTrend
}

const getGaugeColor = (percent: number, quality: GaugeProps['dataQuality']) => {
  if (quality === 'error') return '#ef4444'
  if (quality === 'poor') return '#f59e0b'
  if (percent <= 30) return '#22c55e'
  if (percent <= 70) return '#f59e0b'
  return '#ef4444'
}

const GaugeComponent: React.FC<GaugeProps> = ({
  value,
  min = 0,
  max,
  unit,
  label,
  icon,
  className = '',
  isLoading = false,
  dataQuality = 'good',
  lastUpdated,
  trend,
}): React.ReactElement => {
  const [animatedValue, setAnimatedValue] = useState(min)
  const [previousValue, setPreviousValue] = useState(min)

  useEffect(() => {
    if (value === animatedValue) return

    const timer = setTimeout(() => {
      setPreviousValue(animatedValue)
      setAnimatedValue(value)
    }, 100)

    return () => clearTimeout(timer)
  }, [value, animatedValue])

  const clampedPercentage = useMemo(() => {
    const percentage = ((animatedValue - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, percentage))
  }, [animatedValue, max, min])

  const gaugeColor = useMemo(
    () => getGaugeColor(clampedPercentage, dataQuality),
    [clampedPercentage, dataQuality],
  )

  const trendText = useMemo(() => {
    if (!trend) return null
    if (trend === 'up') return '↑ Xu hướng tăng'
    if (trend === 'down') return '↓ Xu hướng giảm'
    return '→ Ổn định'
  }, [trend])

  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = (clampedPercentage / 100) * circumference

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}
    >
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-gray-600 text-xl">{icon}</div>}
          <h3 className="text-gray-800 text-sm font-medium">{label}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(229, 231, 235, 0.8)"
            strokeWidth="12"
            fill="transparent"
            className="drop-shadow-sm"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke={gaugeColor}
            strokeWidth="12"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - strokeDasharray,
              stroke: gaugeColor,
            }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
              stroke: { duration: 0.8 },
            }}
            className="drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 8px ${gaugeColor}40)`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={animatedValue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div
                className={`text-3xl font-bold mb-1 ${dataQuality === 'error'
                  ? 'text-red-600'
                  : dataQuality === 'poor'
                    ? 'text-yellow-600'
                    : 'text-gray-900'
                  }`}
              >
                {isLoading ? '...' : animatedValue.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 font-medium">{unit}</div>
              {!isLoading && previousValue !== animatedValue && (
                <div
                  className={`text-xs mt-1 ${animatedValue > previousValue
                    ? 'text-green-600'
                    : animatedValue < previousValue
                      ? 'text-red-600'
                      : 'text-gray-500'
                    }`}
                >
                  {animatedValue > previousValue ? '+' : ''}
                  {(animatedValue - previousValue).toFixed(1)}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          <motion.div
            key={value}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: gaugeColor,
              filter: 'blur(20px)',
            }}
          />
        </AnimatePresence>
      </div>

      <div className="w-full mt-4 px-4">
        {trendText && (
          <div
            className={`text-sm font-medium text-center ${trend === 'up'
              ? 'text-green-600'
              : trend === 'down'
                ? 'text-red-600'
                : 'text-gray-500'
              }`}
          >
            {trendText}
          </div>
        )}
        {lastUpdated && (
          <div className="text-center">
            <span className="text-xs text-gray-400">
              Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(GaugeComponent)
