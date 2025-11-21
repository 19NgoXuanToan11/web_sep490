import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ToastStatus } from './toast-status'
import { VARIANT_TO_STATUS } from './toast-status'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const baseToastClasses =
  'group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border-2 p-5 shadow-xl ring-1 ring-black/5 transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full'

const toastVariants = cva(baseToastClasses, {
  variants: {
    variant: {
      info: 'border-blue-200 bg-blue-50 text-blue-900',
      default: 'border-blue-200 bg-blue-50 text-blue-900',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-900',
      error: 'border-red-200 bg-red-50 text-red-900',
      destructive: 'border-red-200 bg-red-50 text-red-900',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
})

type ToastVariantProps = VariantProps<typeof toastVariants>

type ToastRootProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
  'variant'
>

interface ExtendedToastProps extends ToastRootProps, ToastVariantProps {
  status?: ToastStatus
}

const DEFAULT_TOAST_DURATION = 5000

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ExtendedToastProps>(
  ({ className, variant, status, duration, ...props }, ref) => {
    const resolvedVariant = (
      variant ??
      (status as ToastVariantProps['variant']) ??
      'info'
    ) as ToastVariantProps['variant']
    const resolvedStatus =
      status ?? (resolvedVariant ? VARIANT_TO_STATUS[resolvedVariant] : 'info') ?? 'info'

    return (
      <ToastPrimitives.Root
        ref={ref}
        data-status={resolvedStatus}
        className={cn(toastVariants({ variant: resolvedVariant }), className)}
        duration={duration ?? DEFAULT_TOAST_DURATION}
        {...props}
      />
    )
  }
)
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-70 transition-opacity hover:text-gray-900 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-data-[status=error]:text-red-600 group-data-[status=error]:hover:text-red-800 group-data-[status=error]:focus:ring-red-400 group-data-[status=success]:text-emerald-700 group-data-[status=warning]:text-amber-700',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn('text-sm font-bold', className)} {...props} />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm font-medium', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
