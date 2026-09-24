import type { BuffetEvent, EventServiceItem, MenuItem, ReceivedPayment, ServiceItem } from './types'

export const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export const dateBR = (value: string) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value + 'T12:00:00'))
}

export const shortDate = (value: string) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value + 'T12:00:00'))
}

export const eventServiceItems = (event: BuffetEvent, services: ServiceItem[]): EventServiceItem[] =>
  event.serviceItems ?? event.serviceIds.flatMap((id) => {
    const service = services.find((item) => item.id === id)
    return service ? [{ ...service, quantity: 1, serviceId: id }] : []
  })

export const eventServices = (event: BuffetEvent, services: ServiceItem[]): ServiceItem[] =>
  eventServiceItems(event, services).map(({ id, name, description, price, pricing, quantity }) =>
    ({ id, name, description, price, pricing, quantity }))

export const receivedTotal = (event: BuffetEvent): number =>
  event.receivedPayments !== undefined
    ? event.receivedPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    : (event.deposit || 0)

export const initialReceivedPayments = (event: BuffetEvent): ReceivedPayment[] =>
  event.receivedPayments !== undefined
    ? [...event.receivedPayments]
    : (event.deposit > 0 ? [{
        id: 'legacy-' + event.id, date: '',
        amount: event.deposit, method: event.paymentMethod || 'A confirmar',
        notes: 'Sinal anteriormente registrado; confirme a data e a forma de pagamento.'
      }] : [])

export const eventTotal = (event: BuffetEvent, menus: MenuItem[], services: ServiceItem[]) => {
  const menu = menus.find((item) => item.id === event.menuId)
  const menuTotal = event.menuId ? (event.menuPricePerPerson ?? menu?.pricePerPerson ?? 0) * event.guests : (event.basePrice || 0)
  const servicesTotal = eventServiceItems(event, services).reduce((sum, service) =>
    sum + (service.pricing === 'person' ? service.price * event.guests * service.quantity : service.price * service.quantity), 0)
  return Math.max(0, menuTotal + servicesTotal - (event.discount || 0))
}

export const contractSequence = (events: BuffetEvent[]) => {
  const year = new Date().getFullYear()
  const sequence = String(events.length + 1).padStart(3, '0')
  return 'CTR-' + year + '-' + sequence
}

export const phoneDigits = (value: string) => value.replace(/\D/g, '')

export const statusClass = (status: string) =>
  status === 'Assinado' || status === 'Confirmado'
    ? 'status status--success'
    : status === 'Enviado'
      ? 'status status--info'
      : 'status status--neutral'
