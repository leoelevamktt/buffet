import { uid } from './storage'
import type { BuffetEvent, Client } from './types'

const clean = (value?: string) => String(value || '').trim()
const digits = (value?: string) => clean(value).replace(/\D/g, '')
const emailKey = (value?: string) => clean(value).toLowerCase()

export const clientMatchesEvent = (client: Client, event: BuffetEvent) => {
  if (event.clientId && client.id === event.clientId) return true
  const doc = digits(event.clientDocument)
  if (doc && digits(client.document) === doc) return true
  const phone = digits(event.clientPhone)
  if (phone && digits(client.phone) === phone) return true
  const email = emailKey(event.clientEmail)
  if (email && emailKey(client.email) === email) return true
  return false
}

export const eventFromClient = (event: BuffetEvent, client: Client): BuffetEvent => ({
  ...event,
  clientId: client.id,
  clientName: client.name,
  clientDocument: client.document,
  clientRg: client.rg || '',
  clientAddress: client.address || '',
  clientEmail: client.email,
  clientPhone: client.phone,
  clientPhoneSecondary: client.phoneSecondary || ''
})

export const clientFromEvent = (event: BuffetEvent, existing?: Client): Client => {
  const now = new Date().toISOString()
  return {
    id: existing?.id || event.clientId || uid('client'),
    name: clean(event.clientName),
    document: clean(event.clientDocument),
    rg: clean(event.clientRg) || undefined,
    address: clean(event.clientAddress) || undefined,
    email: clean(event.clientEmail),
    phone: clean(event.clientPhone),
    phoneSecondary: clean(event.clientPhoneSecondary) || undefined,
    notes: existing?.notes,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

export const ensureClientForEvent = (event: BuffetEvent, clients: Client[]) => {
  const existing = clients.find((client) => clientMatchesEvent(client, event))
  const client = clientFromEvent(event, existing)
  const nextEvent = { ...event, clientId: client.id }
  const nextClients = existing
    ? clients.map((item) => item.id === existing.id ? client : item)
    : [client, ...clients]
  return { event: nextEvent, clients: nextClients, client }
}
