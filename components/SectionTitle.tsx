import { Text } from 'react-native'

export function SectionTitle({ children, className }: { children: string; className?: string }) {
  return (
    <Text
      className={`text-fg font-light uppercase text-md border-b-hairline border-fgSecondary pb-2 tracking-widest ${className ?? ''}`}
    >
      {children}
    </Text>
  )
}
