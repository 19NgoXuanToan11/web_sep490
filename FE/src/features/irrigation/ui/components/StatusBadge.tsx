import React from 'react'

interface StatusBadgeProps {
    status: number | string
    isActive?: boolean
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({
    status,
    isActive,
    className = '',
    size = 'md'
}: StatusBadgeProps) {
    const active = isActive !== undefined
        ? isActive
        : (typeof status === 'number' ? status === 1 : status === 'ACTIVE')

    const label = active ? 'Hoạt động' : 'Tạm dừng'

    const backgroundColor = active ? '#10b981' : '#94a3b8'
    const color = '#ffffff'

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: '2px 8px', fontSize: '10px' },
        md: { padding: '4px 12px', fontSize: '12px' },
        lg: { padding: '6px 16px', fontSize: '14px' },
    }

    const finalStyle: React.CSSProperties = {
        backgroundColor,
        color,
        borderRadius: '4px',
        fontWeight: '500',
        display: 'inline-block',
        ...sizeStyles[size],
    }

    return (
        <span
            className={className}
            style={finalStyle}
        >
            {label}
        </span>
    )
}

