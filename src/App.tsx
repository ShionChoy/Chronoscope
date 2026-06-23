import { AppShell } from './ui/shell/AppShell'
import type { AppStore } from './state'
import type { FileSync } from './data'

export default function App({ app, fileSync }: { app: AppStore; fileSync?: FileSync }) {
  return <AppShell app={app} fileSync={fileSync} />
}
