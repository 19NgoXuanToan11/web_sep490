export type ToastStatus = 'info' | 'success' | 'warning' | 'error'

export const TOAST_STATUS_FALLBACKS: Record<
  ToastStatus,
  { title: string; description?: string }
> = {
  success: {
    title: 'Thành công',
    description: 'Thao tác đã được thực hiện thành công.',
  },
  error: {
    title: 'Có lỗi xảy ra',
    description: 'Vui lòng thử lại hoặc liên hệ hỗ trợ.',
  },
  warning: {
    title: 'Cảnh báo',
    description: 'Vui lòng kiểm tra lại thông tin trước khi tiếp tục.',
  },
  info: {
    title: 'Thông báo',
    description: undefined,
  },
}

export const STATUS_TO_VARIANT: Record<ToastStatus, ToastStatus | 'default' | 'destructive'> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
}

export const VARIANT_TO_STATUS: Record<string, ToastStatus> = {
  default: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  destructive: 'error',
  error: 'error',
}

