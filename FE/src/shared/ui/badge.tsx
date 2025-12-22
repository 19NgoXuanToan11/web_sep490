import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20',
        secondary:
          'border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:from-slate-100 hover:to-slate-200 shadow-slate-500/10',
        teal:
          'border-transparent bg-gradient-to-r from-teal-400 to-emerald-500 text-white hover:from-teal-500 hover:to-emerald-600 shadow-teal-500/20',
        destructive:
          'border-transparent bg-red-700 text-[#fff] hover:bg-red-800 shadow-red-700/25 font-semibold',
        outline: 'text-foreground border-slate-300',
        success:
          'border-transparent bg-green-600 text-[#fff] hover:bg-green-700 shadow-green-600/25 font-semibold',
        warning:
          'border-transparent bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
        info:
          'border-transparent bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-sky-500/25',
        pending:
          'border-transparent bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 shadow-purple-500/15 border border-purple-200',
        processing:
          'border-transparent bg-blue-600 text-[#fff] hover:bg-blue-700 shadow-blue-600/25 font-semibold',
        completed:
          'border-transparent bg-teal-700 text-[#fff] hover:bg-teal-800 shadow-teal-700/25 font-semibold',
        failed:
          'border-transparent bg-gradient-to-r from-rose-50 to-red-100 text-rose-700 hover:from-rose-100 hover:to-red-200 shadow-rose-500/15 border border-rose-200',
        overdue:
          'border-transparent bg-red-600 text-[#fff] hover:bg-red-700 shadow-red-600/25 font-semibold',
        paid:
          'border-transparent bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 shadow-teal-500/25',
        shipping:
          'border-transparent bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 shadow-indigo-500/25',
        golden:
          'border-transparent bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-yellow-500/25',
        cyan:
          'border-transparent bg-[#b32b5f] text-white hover:bg-[#a02d3f] shadow-[#ba3247]/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
