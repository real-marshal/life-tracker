import { View, Text, Button } from 'react-native'
import { dropDb } from '@/common/utils/db'
import { useSQLiteContext } from 'expo-sqlite'
import { reloadAppAsync } from 'expo'

export default function SettingsScreen() {
  const db = useSQLiteContext()

  return (
    <View>
      <Text style={{ color: 'white', fontSize: 40 }}>Settings</Text>
      <Button
        onPress={() =>
          dropDb(db)
            .then(() => reloadAppAsync())
            .catch((err) => console.log(err))
        }
        title='Reset DB'
      />
    </View>
  )
}
