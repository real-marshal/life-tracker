import { View, Text, TextInput } from 'react-native'
import { dbName, dropDb } from '@/common/db'
import { useSQLiteContext } from 'expo-sqlite'
import { reloadAppAsync } from 'expo'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import { Pressable } from 'react-native-gesture-handler'
import Feather from '@expo/vector-icons/Feather'
import { colors } from '@/common/theme'
import { useRouter } from 'expo-router'
import { ConfirmModal } from '@/components/ConfirmModal'
import { Modal, RestModalProps, useModal } from '@/components/Modal'
import { showErrorToast } from '@/common/toast'
import { stringifyError } from '@/common/utils/error'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUser, updateUserName } from '@/models/user'
import { useErrorToasts } from '@/hooks/useErrorToasts'
import { SettingsItem, SettingsSection } from '@/components/Settings/Settings'
import { useEffect, useRef, useState } from 'react'
import { AppButton } from '@/components/AppButton'

// noinspection JSUnusedGlobalSymbols
export default function SettingsScreen() {
  const db = useSQLiteContext()
  const router = useRouter()

  const {
    showModal: showUpdateNameModal,
    hideModal: hideUpdateNameModal,
    ...updateNameModalProps
  } = useModal()

  const {
    showModal: showResetDbModal,
    hideModal: hideResetDbModal,
    ...resetDbModalProps
  } = useModal()

  return (
    <>
      <View className='flex flex-col m-safe pt-3 pb-3 px-3 gap-6'>
        <View className='flex flex-row gap-4 items-center'>
          <Pressable onPress={() => router.back()}>
            <Feather name='chevron-left' size={30} color={colors.fg} />
          </Pressable>
          <Text className='text-fg text-2xl flex-1'>Settings</Text>
        </View>
        <SettingsSection title='General'>
          <SettingsItem
            text='Change display name'
            description='Update the name shown in the greeting'
            onPress={showUpdateNameModal}
            first
          />
          <SettingsItem
            text='Edit meta stats'
            description='Modify or remove existing meta stats'
            onPress={() => router.navigate('/settings/edit-metastats')}
            last
          />
        </SettingsSection>
        <SettingsSection title='Data'>
          <SettingsItem
            text='Export database'
            description='Export database as an SQLite DB file'
            onPress={() =>
              FileSystem.documentDirectory &&
              Sharing.shareAsync(`${FileSystem.documentDirectory}/SQLite/${dbName}`).catch((err) =>
                showErrorToast("Couldn't export database", stringifyError(err))
              )
            }
            first
          />
          <SettingsItem
            text='Reset database'
            description='Delete all saved data'
            color={colors.negative}
            onPress={showResetDbModal}
            last
          />
        </SettingsSection>
        <SettingsSection title='About'>
          <SettingsItem first last>
            <Text className='text-fgSecondary'>Made by Real_Marshal.</Text>
          </SettingsItem>
        </SettingsSection>
      </View>
      <UpdateNameModal modalProps={updateNameModalProps} hideModal={hideUpdateNameModal} />
      <ConfirmModal
        text='Are you absolutely sure you want to completely erase all data stored in this app?'
        hideModal={hideResetDbModal}
        modalProps={resetDbModalProps}
        onConfirm={() =>
          dropDb(db)
            .then(() => reloadAppAsync())
            .catch((err) => showErrorToast("Couldn't reset database", stringifyError(err)))
        }
        deletion
      />
    </>
  )
}

function UpdateNameModal({
  modalProps,
  hideModal,
}: {
  modalProps: RestModalProps
  hideModal: () => void
}) {
  const db = useSQLiteContext()
  const queryClient = useQueryClient()

  const { data: user, error: userError } = useQuery({
    queryKey: ['user'],
    queryFn: () => getUser(db),
  })
  const { mutate: updateUserNameMutator, error: updatingError } = useMutation({
    mutationFn: (name: string) => updateUserName(db, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  })

  useErrorToasts({ title: 'Error updating user name', errorData: updatingError })

  useErrorToasts({ title: 'Error loading user', errorData: userError })

  const textInputRef = useRef<TextInput>(null)

  const [name, setName] = useState('')

  useEffect(() => {
    user?.name && setName(user.name)
  }, [user])

  return (
    <Modal {...modalProps} onShow={() => textInputRef.current?.focus()}>
      <View className='flex flex-col gap-4'>
        <View className='flex flex-col gap-2'>
          <Text className='text-fgSecondary'>Display name:</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className='text-fg bg-bgTertiary rounded-md px-3'
            autoFocus
            ref={textInputRef}
          />
        </View>
        <View className='flex flex-row gap-4'>
          <AppButton
            text='Cancel'
            color={colors.fg}
            activeColor={colors.fgSecondary}
            onPress={() => {
              hideModal()
              user?.name && setName(user.name)
            }}
            className='px-6'
          />
          <AppButton
            text='Update'
            color={colors.positive}
            activeColor={colors.positiveActive}
            onPress={() => {
              if (!name) {
                return showErrorToast('Name is empty', 'Please enter a correct name')
              }

              if (name.length > 32) {
                return showErrorToast('Name is too long', 'Please enter a correct name')
              }
              updateUserNameMutator(name)

              hideModal()
            }}
            className='px-6'
          />
        </View>
      </View>
    </Modal>
  )
}
