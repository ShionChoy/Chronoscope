import { AppShell } from './ui/shell/AppShell'
import type { AppStore } from './state'

export default function App({ app }: { app: AppStore }) {
  return <AppShell app={app} />
}
