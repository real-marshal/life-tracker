import { View, Text, Button } from 'react-native'
import { useRouter } from 'expo-router'
import { finishOnboarding } from '@/models/user'
import { useSQLiteContext } from 'expo-sqlite'
import { useMutator } from '@/hooks/useMutator'
import { stringifyError } from '@/common/utils/error'
import { useEffect } from 'react'

export default function OnboardScreen() {
  const db = useSQLiteContext()
  const router = useRouter()

  const [finishOnboardingMutator, isDone, onboardingError] = useMutator(finishOnboarding)

  useEffect(() => {
    isDone && !onboardingError && router.replace('/')
  }, [isDone, onboardingError, router])

  return (
    <View>
      <Text style={{ color: 'white', fontSize: 40 }}>Onboard</Text>
      <Button onPress={() => finishOnboardingMutator(db)} title='Finish onboarding' />
      {onboardingError && (
        <Text style={{ color: 'white', fontSize: 20 }}>{stringifyError(onboardingError)}</Text>
      )}
    </View>
  )
}
