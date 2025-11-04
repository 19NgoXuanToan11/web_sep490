interface ToastFunction {
  (options: { title: string; description?: string; variant?: 'default' | 'destructive' }): void
}

export const handleApiError = (error: unknown, toast?: ToastFunction) => {
  const message = error instanceof Error ? error.message : 'Thao tác thất bại'

  if (toast) {
    toast({
      title: 'Lỗi',
      description: message,
      variant: 'destructive',
    })
  }

  return message
}

export const handleApiSuccess = (message: string, toast?: ToastFunction) => {
  if (toast) {
    toast({
      title: 'Thành công',
      description: message,
      variant: 'default',
    })
  }
}
