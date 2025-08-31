import { useEffect } from 'react'
import { stringifyError } from '@/common/utils/error'
import { showErrorToast } from '@/common/toast'

export function useErrorToasts(...errors: { title: string; errorData: any }[]) {
  useEffect(
    () => {
      errors.forEach(({ title, errorData }) => {
        errorData && showErrorToast(title, stringifyError(errorData))
      })
    },
    // be careful with this on any interface changes!
    // eslint-disable-next-line react-hooks/exhaustive-deps
    errors.map((error) => error.errorData)
  )
}
