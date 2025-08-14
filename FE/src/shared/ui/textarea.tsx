import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-200',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
