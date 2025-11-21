import * as React from 'react'
import type { ToastActionElement, ToastProps } from './toast'
import { localizeToastText } from '@/shared/lib/toast-localization'
import {
  TOAST_STATUS_FALLBACKS,
  VARIANT_TO_STATUS,
  STATUS_TO_VARIANT,
  type ToastStatus,
} from './toast-status'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000

const TEXT_STATUS_PATTERNS: Array<{ status: ToastStatus; pattern: RegExp }> = [
  {
    status: 'success',
    pattern:
      /(thành công|success|đã\s+(?:được\s+)?(?:thêm|tạo|cập\s*nhật|xóa|xoá|lưu|kích hoạt|khôi phục|phê duyệt))/i,
  },
  { status: 'error', pattern: /(thất bại|lỗi|error|failed)/i },
  { status: 'warning', pattern: /(cảnh báo|warning|chú ý)/i },
]

const inferStatusFromContent = (options: Toast): ToastStatus | undefined => {
  const texts = [options.title, options.description]
    .map((value) => (typeof value === 'string' ? value : undefined))
    .filter((value): value is string => Boolean(value))

  if (texts.length === 0) {
    return undefined
  }

  const combinedText = texts.join(' ')
  const matchedPattern = TEXT_STATUS_PATTERNS.find(({ pattern }) => pattern.test(combinedText))

  return matchedPattern?.status
}

type BaseToastProps = Omit<ToastProps, 'title' | 'description'>

type ToasterToast = BaseToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  status?: ToastStatus
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
    type: ActionType['ADD_TOAST']
    toast: ToasterToast
  }
  | {
    type: ActionType['UPDATE_TOAST']
    toast: Partial<ToasterToast>
  }
  | {
    type: ActionType['DISMISS_TOAST']
    toastId?: ToasterToast['id']
  }
  | {
    type: ActionType['REMOVE_TOAST']
    toastId?: ToasterToast['id']
  }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
              ...t,
              open: false,
            }
            : t
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, 'id'>

const resolveStatusAndVariant = (options: Toast) => {
  const inferredStatus = inferStatusFromContent(options)
  const status =
    options.status ??
    (options.variant ? VARIANT_TO_STATUS[options.variant] : undefined) ??
    inferredStatus ??
    'info'

  const variant = options.variant ?? STATUS_TO_VARIANT[status] ?? 'info'

  return { status, variant }
}

const prepareToastContent = (options: Toast & { id: string }) => {
  const { status, variant } = resolveStatusAndVariant(options)
  const fallback = TOAST_STATUS_FALLBACKS[status]

  return {
    ...options,
    id: options.id,
    status,
    variant,
    title: localizeToastText(options.title, fallback.title),
    description: localizeToastText(
      options.description,
      options.description === undefined ? fallback.description : undefined
    ),
  }
}

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (newProps: Toast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: prepareToastContent({ ...newProps, id }),
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...prepareToastContent({ ...props, id }),
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }
