import Toast from 'react-native-toast-message'

interface ToastData {
  type: 'error' | 'success'
  title: string
  description?: string
  autoHide?: boolean
}

const toastQueue: ToastData[] = []

export function showErrorToast(title: string, description?: string, autoHide = true) {
  toastQueue.push({ type: 'error', title, description, autoHide })

  toastUnwindStep(toastQueue.at(-1)!, true)
}

export function showSuccessToast(title: string, description?: string, autoHide = true) {
  toastQueue.push({ type: 'success', title, description, autoHide })

  toastUnwindStep(toastQueue.at(-1)!, true)
}

function toastUnwindStep(
  { type, title, description, autoHide }: ToastData,
  isFirst: boolean = false
) {
  Toast.show({
    type: type,
    text1: title,
    text2: description,
    autoHide,
    onHide: () => {
      if (isFirst) {
        toastQueue.pop()
      }
      const prevToast = toastQueue.pop()

      if (!prevToast) return

      setTimeout(() => toastUnwindStep(prevToast), 0)
    },
  })
}
