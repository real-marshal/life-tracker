import { View, Text, Button } from 'react-native'
import { dbName, dropDb } from '@/common/utils/db'
import { useSQLiteContext } from 'expo-sqlite'
import { reloadAppAsync } from 'expo'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'

export default function SettingsScreen() {
  const db = useSQLiteContext()

  return (
    <View className='gap-4'>
      <Text style={{ color: 'white', fontSize: 40 }}>Settings</Text>
      <Button
        onPress={() =>
          dropDb(db)
            .then(() => reloadAppAsync())
            .catch((err) => console.log(err))
        }
        title='Reset DB'
      />
      <Button
        onPress={() =>
          FileSystem.documentDirectory &&
          Sharing.shareAsync(`${FileSystem.documentDirectory}/SQLite/${dbName}`)
        }
        title='Export DB'
      />
    </View>
  )
}
