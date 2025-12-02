import React from 'react'
import { cn } from '@/shared/lib/utils'

interface ManagementPageHeaderProps {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function ManagementPageHeader({
  title,
  description,
  actions,
  className,
}: ManagementPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description ? (
          typeof description === 'string' ? (
            <p className="text-gray-600 mt-2 max-w-4xl">{description}</p>
          ) : (
            <div className="text-gray-600 mt-2 max-w-4xl">{description}</div>
          )
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}


