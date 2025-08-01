import { SuccessToast, BaseToastProps } from 'react-native-toast-message'
import { borderRadius, colors } from '@/common/theme'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'

const toast = StyleSheet.create({
  style: {
    backgroundColor: colors.bgSecondary,
    borderRadius,
  },
  contentContainerStyle: {
    paddingHorizontal: 15,
  },
  text1Style: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.fg,
  },
  text2Style: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.fgSecondary,
  },
})

const successToast = StyleSheet.create({
  style: {
    borderLeftColor: colors.positive,
  },
})

const errorToast = StyleSheet.create({
  style: {
    borderLeftColor: colors.negative,
  },
})

const successToastStyle: StyleProp<ViewStyle> = StyleSheet.compose(toast.style, successToast.style)
const errorToastStyle: StyleProp<ViewStyle> = StyleSheet.compose(toast.style, errorToast.style)

export function AppSuccessToast(props: BaseToastProps) {
  return (
    <SuccessToast
      {...props}
      style={successToastStyle}
      contentContainerStyle={toast.contentContainerStyle}
      text1Style={toast.text1Style}
      text2Style={toast.text2Style}
    />
  )
}

export function AppErrorToast(props: BaseToastProps) {
  return (
    <SuccessToast
      {...props}
      style={errorToastStyle}
      contentContainerStyle={toast.contentContainerStyle}
      text1Style={toast.text1Style}
      text2Style={toast.text2Style}
    />
  )
}
