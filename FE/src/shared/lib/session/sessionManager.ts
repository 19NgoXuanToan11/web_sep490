import { storage } from '@/shared/lib/localData/storage'
import { useAuthStore } from '@/shared/store/authStore'
import { toastManager } from '@/shared/lib/toast-manager'

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
      const title = options.title ?? 'Phiên đăng nhập đã hết hạn'
      const description =
        options.description ??
        'Phiên làm việc đã vượt quá thời hạn 30 phút. Vui lòng đăng nhập lại để tiếp tục.'
      const message = `${title}: ${description}`

      if (options.reason === 'manual') {
        toastManager.info(message)
      } else {
        toastManager.warning(message)
      }
    }
  } finally {
    setTimeout(() => {
      terminationInProgress = false
    }, 1000)
  }
}
