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
          'border-transparent bg-[#8B0000] text-white hover:bg-[#7B0000] shadow-[#8B0000]/25',
        outline: 'text-foreground border-slate-300',
        success:
          'border-transparent bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/25',
        warning:
          'border-transparent bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
        info:
          'border-transparent bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-sky-500/25',
        pending:
          'border-transparent bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 shadow-purple-500/15 border border-purple-200',
        processing:
          'border-transparent bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-700 hover:from-blue-100 hover:to-indigo-200 shadow-blue-500/15 border border-blue-200',
        completed:
          'border-transparent bg-gradient-to-r from-emerald-50 to-green-100 text-green-700 hover:from-emerald-100 hover:to-green-200 shadow-emerald-500/15 border border-emerald-200',
        failed:
          'border-transparent bg-gradient-to-r from-rose-50 to-red-100 text-rose-700 hover:from-rose-100 hover:to-red-200 shadow-rose-500/15 border border-rose-200',
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
