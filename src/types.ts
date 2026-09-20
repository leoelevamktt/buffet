export type ContractStatus = 'Rascunho' | 'Enviado' | 'Assinado'
export type EventStatus = 'Proposta' | 'Confirmado' | 'Concluído'

export interface MenuItem {
  id: string
  name: string
  description: string
  pricePerPerson: number
  category: string
  items: string[]
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  price: number
  pricing: 'fixed' | 'person'
}

export interface Signature {
  signerName: string
  signerDocument: string
  dataUrl?: string
  signedAt: string
}

export interface BuffetEvent {
  id: string
  contractNumber: string
  clientName: string
  clientDocument: string
  clientEmail: string
  clientPhone: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  guests: number
  menuId: string
  serviceIds: string[]
  notes: string
  discount: number
  deposit: number
  status: EventStatus
  contractStatus: ContractStatus
  createdAt: string
  signature?: Signature
}

export interface BusinessSettings {
  businessName: string
  legalName: string
  document: string
  phone: string
  email: string
  address: string
  city: string
  paymentTerms: string
  cancellationTerms: string
}

export type Section = 'dashboard' | 'events' | 'menus' | 'contracts' | 'agenda' | 'settings'
