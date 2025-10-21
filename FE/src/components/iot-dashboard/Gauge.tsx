import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GaugeProps {
  value: number
  min?: number
  max: number
  unit: string
  label: string
  icon: React.ReactNode
  className?: string
  isLoading?: boolean
  dataQuality?: 'good' | 'poor' | 'error'
  lastUpdated?: Date
  trend?: 'up' | 'down' | 'stable'
}

const Gauge: React.FC<GaugeProps> = ({
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
  trend = 'stable',
}) => {
  const [animatedValue, setAnimatedValue] = useState(min)
  const [previousValue, setPreviousValue] = useState(min)

  // Animate value changes and track trends
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviousValue(animatedValue)
      setAnimatedValue(value)
    }, 100)

    return () => clearTimeout(timer)
  }, [value, animatedValue])

  // Calculate percentage for the gauge
  const percentage = ((animatedValue - min) / (max - min)) * 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Calculate color based on value range and data quality
  const getColor = (percent: number) => {
    if (dataQuality === 'error') return '#ef4444' // red for error
    if (dataQuality === 'poor') return '#f59e0b' // orange for poor quality

    // Normal color logic for good data
    if (percent <= 30) return '#22c55e' // green
    if (percent <= 70) return '#f59e0b' // orange
    return '#ef4444' // red
  }

  // Get trend icon
  const getTrendIcon = () => {
    if (trend === 'up') return '↗️'
    if (trend === 'down') return '↘️'
    return '➡️'
  }

  // Get data quality indicator
  const getQualityColor = () => {
    if (dataQuality === 'good') return 'bg-green-500'
    if (dataQuality === 'poor') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Calculate stroke-dasharray for the circular progress
  const radius = 85
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = (clampedPercentage / 100) * circumference

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}
    >
      {/* Icon, Label and Status */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-3">
          <div className="text-gray-600 text-xl">{icon}</div>
          <h3 className="text-gray-800 text-sm font-medium">{label}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Data Quality Indicator */}
          <div
            className={`w-2 h-2 rounded-full ${getQualityColor()}`}
            title={`Chất lượng dữ liệu: ${dataQuality}`}
          />
          {/* Trend Indicator */}
          <span className="text-xs" title={`Xu hướng: ${trend}`}>
            {getTrendIcon()}
          </span>
          {/* Loading Indicator */}
          {isLoading && (
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-48 h-48">
        {/* Background circle */}
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
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke={getColor(clampedPercentage)}
            strokeWidth="12"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - strokeDasharray,
              stroke: getColor(clampedPercentage),
            }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
              stroke: { duration: 0.8 },
            }}
            className="drop-shadow-lg"
            style={{
              filter: `drop-shadow(0 0 8px ${getColor(clampedPercentage)}40)`,
            }}
          />
        </svg>

        {/* Center value display */}
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
                className={`text-3xl font-bold mb-1 ${
                  dataQuality === 'error'
                    ? 'text-red-600'
                    : dataQuality === 'poor'
                      ? 'text-yellow-600'
                      : 'text-gray-900'
                }`}
              >
                {isLoading ? '...' : animatedValue.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 font-medium">{unit}</div>
              {/* Value Change Indicator */}
              {!isLoading && previousValue !== animatedValue && (
                <div
                  className={`text-xs mt-1 ${
                    animatedValue > previousValue
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

        {/* Pulse effect on value change */}
        <AnimatePresence>
          <motion.div
            key={value}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: getColor(clampedPercentage),
              filter: 'blur(20px)',
            }}
          />
        </AnimatePresence>
      </div>

      {/* Min-Max labels and Last Updated */}
      <div className="w-full mt-4 px-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">{min}</span>
          <span className="text-xs text-gray-500 font-medium">{max}</span>
        </div>
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

export default Gauge
