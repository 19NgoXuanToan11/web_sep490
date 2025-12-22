import React from 'react'
import { getStatusBadgeStyle, getStatusLabel } from '../utils/statusBadge'

interface StatusBadgeProps {
  status: string
  isOverdue?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ 
  status, 
  isOverdue = false, 
  className = '',
  size = 'md'
}: StatusBadgeProps) {
  const style = getStatusBadgeStyle(status, isOverdue)
  
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '2px 8px', fontSize: '10px' },
    md: { padding: '4px 12px', fontSize: '12px' },
    lg: { padding: '6px 16px', fontSize: '14px' },
  }
  
  const finalStyle = {
    ...style,
    ...sizeStyles[size],
  }

  return (
    <span 
      className={className}
      style={finalStyle}
    >
      {getStatusLabel(status)}
    </span>
  )
}

