import type { BuffetEvent, BusinessSettings, Client, MenuItem, ServiceItem } from './types'
import type { PaymentReceipt } from './receipts'
import { defaultMenus, defaultServices, defaultSettings } from './data'

export interface WorkspaceData {
  events: BuffetEvent[]
  clients: Client[]
  menus: MenuItem[]
  services: ServiceItem[]
  settings: BusinessSettings
  receipts: PaymentReceipt[]
}

function read<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback }
  catch { return fallback }
}

const clean = (value?: string) => String(value || '').trim()
const digits = (value?: string) => clean(value).replace(/\D/g, '')
const emailKey = (value?: string) => clean(value).toLowerCase()
const textKey = (value?: string) => clean(value).toLowerCase().replace(/\s+/g, ' ')

const stableLegacyId = (event: BuffetEvent) => {
  const source = digits(event.clientDocument) || digits(event.clientPhone) ||
    emailKey(event.clientEmail) || textKey(event.clientName) || event.id
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return 'client-' + (hash >>> 0).toString(36)
}

const clientMatchesEvent = (client: Client, event: BuffetEvent) => {
  if (event.clientId && client.id === event.clientId) return true
  const doc = digits(event.clientDocument)
  if (doc && digits(client.document) === doc) return true
  const phone = digits(event.clientPhone)
  if (phone && digits(client.phone) === phone) return true
  const email = emailKey(event.clientEmail)
  if (email && emailKey(client.email) === email) return true
  return Boolean(textKey(event.clientName) && textKey(client.name) === textKey(event.clientName))
}

const clientFromEvent = (event: BuffetEvent, id = stableLegacyId(event)): Client => ({
  id,
  name: clean(event.clientName),
  document: clean(event.clientDocument),
  rg: clean(event.clientRg) || undefined,
  address: clean(event.clientAddress) || undefined,
  email: clean(event.clientEmail),
  phone: clean(event.clientPhone),
  phoneSecondary: clean(event.clientPhoneSecondary) || undefined,
  createdAt: event.createdAt || new Date().toISOString(),
  updatedAt: event.createdAt || new Date().toISOString()
})

export function normalizeWorkspace(input: Partial<WorkspaceData> & { events?: BuffetEvent[] }): WorkspaceData {
  const events = Array.isArray(input.events) ? input.events.map((event) => ({ ...event })) : []
  const clients: Client[] = Array.isArray(input.clients)
    ? input.clients.filter(Boolean).map((client) => ({
        ...client,
        name: clean(client.name),
        document: clean(client.document),
        email: clean(client.email),
        phone: clean(client.phone),
        createdAt: client.createdAt || new Date().toISOString(),
        updatedAt: client.updatedAt || client.createdAt || new Date().toISOString()
      }))
    : []

  events.forEach((event) => {
    if (!clean(event.clientName)) return
    let client = clients.find((item) => clientMatchesEvent(item, event))
    if (!client) {
      client = clientFromEvent(event)
      while (clients.some((item) => item.id === client!.id)) client = { ...client, id: client.id + '-1' }
      clients.push(client)
    }
    event.clientId = client.id
  })

  return {
    events,
    clients,
    menus: Array.isArray(input.menus) && input.menus.length ? input.menus : defaultMenus,
    services: Array.isArray(input.services)
      ? [...input.services, ...defaultServices.filter((service) => !input.services!.some((item) => item.id === service.id))]
      : defaultServices,
    settings: input.settings && typeof input.settings === 'object'
      ? (input.settings.businessName === 'Maison Buffet' ? defaultSettings : input.settings)
      : defaultSettings,
    receipts: Array.isArray(input.receipts) ? input.receipts : []
  }
}

export function browserSnapshot(): WorkspaceData {
  const menus = read<MenuItem[]>('maison-menus', defaultMenus)
  const services = read<ServiceItem[]>('maison-services', defaultServices)
  const settings = read<BusinessSettings>('maison-settings', defaultSettings)
  return normalizeWorkspace({
    events: read<BuffetEvent[]>('maison-events', []),
    clients: read<Client[]>('akela-clients', []),
    menus,
    services,
    settings,
    receipts: read<PaymentReceipt[]>('akela-receipts', [])
  })
}

export const initialWorkspace = (): WorkspaceData => normalizeWorkspace({
  events: [], clients: [], menus: defaultMenus, services: defaultServices,
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
