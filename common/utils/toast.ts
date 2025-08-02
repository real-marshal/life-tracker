import Toast from 'react-native-toast-message'

interface ToastData {
  type: 'error' | 'success'
  title: string
  description?: string
}

const toastQueue: ToastData[] = []

export function showErrorToast(title: string, description?: string) {
  toastQueue.push({ type: 'error', title, description })

  toastUnwindStep(toastQueue.at(-1)!, true)
}

export function showSuccessToast(title: string, description?: string) {
  toastQueue.push({ type: 'success', title, description })

  toastUnwindStep(toastQueue.at(-1)!, true)
}

function toastUnwindStep({ type, title, description }: ToastData, isFirst: boolean = false) {
  Toast.show({
    type: type,
    text1: title,
    text2: description,
    autoHide: false,
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
