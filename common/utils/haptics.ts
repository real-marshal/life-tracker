import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

export async function performContextMenuHaptics() {
  if (Platform.OS === 'ios') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } else {
    await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click)
  }
}
