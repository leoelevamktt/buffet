export type ContractStatus = 'Rascunho' | 'Enviado' | 'Assinado'
export type EventStatus = 'Proposta' | 'Confirmado' | 'Concluído'

export interface MenuChoiceGroup {
  id: string
  label: string
  options: string[]
  required?: boolean
  multiple?: boolean
  maxSelections?: number
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
  quantity?: number
}

export interface ReceivedPayment {
  id: string
  date: string
  amount: number
  method: string
  reference?: string
  notes?: string
}

export interface EventServiceItem {
  id: string
  serviceId?: string
  name: string
  description: string
  price: number
  quantity: number
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
  clientPhoneSecondary?: string
  venueMode?: 'buffet' | 'offsite' | 'other'
  venueAddress?: string
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
  customContractFullHtml?: string
  customContractHtml?: string
  customContractUpdatedAt?: string
  paymentMethod?: string
  paymentSchedule?: PaymentEntry[]
  receivedPayments?: ReceivedPayment[]
  signedEventSnapshot?: Partial<BuffetEvent>
  signedTotal?: number
  signedServices?: ServiceItem[]
  signedMenu?: MenuItem | null
  signedSettings?: BusinessSettings
  signedContractTemplate?: ContractTemplate
  serviceItems?: EventServiceItem[]
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
  secondaryPhone?: string
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
