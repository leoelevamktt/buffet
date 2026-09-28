import type { BuffetEvent, BusinessSettings, MenuItem, ServiceItem } from './types'
import type { PaymentReceipt } from './receipts'
import { defaultMenus, defaultServices, defaultSettings } from './data'

export interface WorkspaceData {
  events: BuffetEvent[]
  menus: MenuItem[]
  services: ServiceItem[]
  settings: BusinessSettings
  receipts: PaymentReceipt[]
}
function read<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback }
  catch { return fallback }
}
export function browserSnapshot(): WorkspaceData {
  const menus = read<MenuItem[]>('maison-menus', defaultMenus)
  const services = read<ServiceItem[]>('maison-services', defaultServices)
  const settings = read<BusinessSettings>('maison-settings', defaultSettings)
  return {
    events: read<BuffetEvent[]>('maison-events', []),
    menus: menus.length ? menus : defaultMenus,
    services: [...services, ...defaultServices.filter((s) => !services.some((x) => x.id === s.id))],
    settings: settings.businessName === 'Maison Buffet' ? defaultSettings : settings,
    receipts: read<PaymentReceipt[]>('akela-receipts', [])
  }
}
export const initialWorkspace = (): WorkspaceData => ({
  events: [], menus: defaultMenus, services: defaultServices,
  settings: defaultSettings, receipts: []
})
export const downloadWorkspace = (data: WorkspaceData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'buffet-akela-backup-' + new Date().toISOString().slice(0, 10) + '.json'
  link.click()
  URL.revokeObjectURL(url)
}
