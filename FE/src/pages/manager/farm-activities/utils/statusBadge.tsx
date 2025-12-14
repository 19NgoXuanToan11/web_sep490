import React from 'react'

const STATUS_COLOR_MAP: Record<string, string> = {
  ACTIVE: '#16A34A',
  IN_PROGRESS: '#3b82f6', 
  COMPLETED: '#0F766E',
  DEACTIVATED: '#B91C1C',
  OVERDUE: '#DC2626',
}

const STATUS_LABEL_MAP: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  DEACTIVATED: 'Tạm dừng',
  OVERDUE: 'Quá hạn',
}

export function getStatusBadgeStyle(status: string, isOverdue?: boolean): React.CSSProperties {
  const normalizedStatus = (status || '').toUpperCase()

  let backgroundColor: string
  if (normalizedStatus === 'IN_PROGRESS') {
    backgroundColor = STATUS_COLOR_MAP.IN_PROGRESS
  } else if (isOverdue) {
    backgroundColor = STATUS_COLOR_MAP.OVERDUE
  } else {
    backgroundColor = STATUS_COLOR_MAP[normalizedStatus] || STATUS_COLOR_MAP.ACTIVE
  }

  return {
    backgroundColor,
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    borderRadius: '9999px', 
    padding: '4px 12px',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap' as const,
  }
}

export function getStatusBadgeClassName(_status: string, _isOverdue?: boolean): string {
  const baseClasses = 'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border-none'

  return baseClasses
}

export function getStatusLabel(status: string): string {
  const normalizedStatus = (status || '').toUpperCase()
  return STATUS_LABEL_MAP[normalizedStatus] || normalizedStatus
}

export function getStatusColor(status: string, isOverdue?: boolean): string {
  const normalizedStatus = (status || '').toUpperCase()

  if (normalizedStatus === 'IN_PROGRESS') {
    return STATUS_COLOR_MAP.IN_PROGRESS
  } else if (isOverdue) {
    return STATUS_COLOR_MAP.OVERDUE
  } else {
    return STATUS_COLOR_MAP[normalizedStatus] || STATUS_COLOR_MAP.ACTIVE
  }
}

