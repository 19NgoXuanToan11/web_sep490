import type { ComponentType } from 'react'
import { AlertTriangle, CheckCircle2, Info, Octagon } from 'lucide-react'
import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastViewport,
} from './toast'
import { useToast } from './use-toast'
import type { ToastStatus } from './toast-status'
import { TOAST_STATUS_FALLBACKS } from './toast-status'
import { cn } from '@/shared/lib/utils'

const STATUS_VISUAL_CONFIG: Record<
  ToastStatus,
  {
    icon: ComponentType<{ className?: string }>
    iconWrapper: string
    closeButton: string
    body?: string
  }
> = {
  success: {
    icon: CheckCircle2,
    iconWrapper: 'bg-emerald-100 text-emerald-700',
    closeButton: 'text-emerald-700 hover:text-emerald-900',
    body: '',
  },
  error: {
    icon: Octagon,
    iconWrapper: 'bg-red-100 text-red-700',
    closeButton: 'text-red-700 hover:text-red-900',
    body: '',
  },
  warning: {
    icon: AlertTriangle,
    iconWrapper: 'bg-amber-100 text-amber-700',
    closeButton: 'text-amber-700 hover:text-amber-900',
    body: '',
  },
  info: {
    icon: Info,
    iconWrapper: 'bg-blue-100 text-blue-700',
    closeButton: 'text-blue-700 hover:text-blue-900',
    body: '',
  },
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={Number.POSITIVE_INFINITY}>
      {toasts.map(function ({ id, title, description, action, status = 'info', className, ...props }) {
        const config = STATUS_VISUAL_CONFIG[status]
        const Icon = config.icon
        const fallbackTitle = TOAST_STATUS_FALLBACKS[status].title
        const fallbackDescription = TOAST_STATUS_FALLBACKS[status].description
        const resolvedDescription = description ?? fallbackDescription

        return (
          <Toast key={id} status={status} className={cn(config.body, className)} {...props}>
            <div className="flex items-start gap-3">
              <span className={cn('mt-0.5 flex h-10 w-10 items-center justify-center rounded-full', config.iconWrapper)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold leading-5 text-gray-900">
                  {title ?? fallbackTitle}
                </p>
                {resolvedDescription && (
                  <p className="text-sm text-gray-700">{resolvedDescription}</p>
                )}
              </div>
            </div>
            {action}
            <ToastClose aria-label="Đóng thông báo" className={cn('ml-2', config.closeButton)} />
          </Toast>
        )
      })}
      <ToastViewport className="max-w-full sm:max-w-md" />
    </ToastProvider>
  )
}
