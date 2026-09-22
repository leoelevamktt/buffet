export type ContractStatus = 'Rascunho' | 'Enviado' | 'Assinado'
export type EventStatus = 'Proposta' | 'Confirmado' | 'Concluído'

export interface MenuChoiceGroup {
  id: string
  label: string
  options: string[]
  required?: boolean
  multiple?: boolean
  note?: string
}

export interface MenuSection {
  title: string
  items: string[]
  note?: string
}

export interface MaterialContact {
  name?: string
  phone: string
  note?: string
}

export interface MaterialPaymentData {
  pixLabel?: string
  pixKey?: string
  financialEmail?: string
  proofWhatsapp?: string
  proofInstructions?: string[]
}

export interface MenuItem {
  id: string
  name: string
  description: string
  pricePerPerson: number
  category: string
  items: string[]
  active?: boolean
  sourceLabel?: string
  unitRestriction?: string
  sections?: MenuSection[]
  includedServices?: string[]
  includedNotes?: string[]
  excludedItems?: string[]
  deliveryInstructions?: string[]
  choiceGroups?: MenuChoiceGroup[]
  cakeFieldLabel?: string
  contractTemplateId?: string
  contacts?: MaterialContact[]
  socials?: string[]
  website?: string
  sourceText?: string
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  price: number
  pricing: 'fixed' | 'person'
}

export interface PaymentEntry {
  date: string
  checkNumber: string
  amount: number
}

export interface ContractTemplate {
  id: string
  name: string
  description: string
  sourceLabel: string
  type: 'services' | 'space-rental'
  financialEmail: string
  cancellationSummary: string
  paymentMethods: string[]
  paymentScheduleSlots?: number
  toleranceMinutes?: number
  extraGuestPrice?: number
  overtimePenaltyPercent?: number
  clauses: string[]
  operationalNotes?: string[]
  excludedItems?: string[]
  deliveryInstructions?: string[]
  contacts?: MaterialContact[]
  socials?: string[]
  website?: string
  paymentData?: MaterialPaymentData
  sourceText?: string
}

export interface Signature {
  signerName: string
  signerDocument: string
  dataUrl?: string
  signedAt: string
  auditHash?: string
  ip?: string
  userAgent?: string
  method?: string
  accepted?: boolean
}

export interface BuffetEvent {
  id: string
  contractNumber: string
  clientName: string
  clientDocument: string
  clientRg?: string
  clientAddress?: string
  clientEmail: string
  clientPhone: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  guests: number
  celebrantName?: string
  celebrantAge?: string
  theme?: string
  fatherName?: string
  motherName?: string
  siblings?: string
  menuId: string
  basePrice?: number
  menuPricePerPerson?: number
  menuSelections?: Record<string, string | string[]>
  cakeDescription?: string
  contractTemplateId?: string
  paymentMethod?: string
  paymentSchedule?: PaymentEntry[]
  serviceIds: string[]
  notes: string
  discount: number
  deposit: number
  status: EventStatus
  contractStatus: ContractStatus
  createdAt: string
  signature?: Signature
  shareToken?: string
  shareUrl?: string
  sharedAt?: string
  quoteToken?: string
  quoteUrl?: string
  quoteSharedAt?: string
}

export interface BusinessSettings {
  businessName: string
  legalName: string
  document: string
  phone: string
  email: string
  financeEmail?: string
  address: string
  city: string
  website?: string
  instagram?: string
  paymentTerms: string
  cancellationTerms: string
}

export type Section = 'dashboard' | 'events' | 'menus' | 'contracts' | 'agenda' | 'settings'
