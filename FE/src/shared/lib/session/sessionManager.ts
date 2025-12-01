import { storage } from '@/shared/lib/localData/storage'
import { useAuthStore } from '@/shared/store/authStore'
import { toast } from '@/shared/ui/use-toast'

type SessionTerminationReason = 'expired' | 'manual'

interface TerminateSessionOptions {
  notify?: boolean
  title?: string
  description?: string
  reason?: SessionTerminationReason
}

let terminationInProgress = false

export const terminateSession = (options: TerminateSessionOptions = {}) => {
  if (terminationInProgress) return

  const authState = useAuthStore.getState()
  const hasInMemoryToken = Boolean(authState.token)
  const hasPersistedToken = Boolean(localStorage.getItem('ifms-token'))
  if (!hasInMemoryToken && !hasPersistedToken) return

  terminationInProgress = true
  const { logout } = authState
  try {
    storage.clear()
    logout()

    if (options.notify !== false) {
      toast({
        status: options.reason === 'manual' ? 'info' : 'warning',
        variant: options.reason === 'manual' ? 'info' : 'warning',
        title: options.title ?? 'Phiên đăng nhập đã hết hạn',
        description:
          options.description ??
          'Phiên làm việc đã vượt quá thời hạn 30 phút. Vui lòng đăng nhập lại để tiếp tục.',
      })
    }
  } finally {
    setTimeout(() => {
      terminationInProgress = false
    }, 1000)
  }
}
