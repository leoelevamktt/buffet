import type { BuffetEvent, BusinessSettings, ReceivedPayment } from './types'

export interface ReceiptRevision {
  updatedAt: string
  updatedBy: string
  reason: string
  previous: Pick<PaymentReceipt, 'issuer' | 'payer' | 'event' | 'payment' | 'description'>
}

export interface PaymentReceipt {
  id: string
  number: string
  eventId: string
  paymentId: string
  status: 'issued' | 'cancelled' | 'deleted'
  issuedAt: string
  cancelledAt?: string
  cancelReason?: string
  deletedAt?: string
  deletedReason?: string
  deletedBy?: string
  updatedAt?: string
  updatedBy?: string
  revisions?: ReceiptRevision[]
  issuer: {
    businessName: string; legalName: string; document: string
    address: string; city: string; phone: string; email: string
  }
  payer: { name: string; document: string; address: string; email: string; phone: string }
  event: { contractNumber: string; type: string; date: string; venue: string }
  payment: { date: string; amount: number; method: string; reference: string; notes: string }
  description: string
}

export const activeReceiptForPayment = (receipts: PaymentReceipt[], eventId: string, paymentId: string) =>
  receipts.find((item) => item.eventId === eventId && item.paymentId === paymentId && item.status === 'issued')

export const receiptMatchesPayment = (receipt: PaymentReceipt, payment?: ReceivedPayment) =>
  !!payment &&
  receipt.payment.amount === payment.amount &&
  receipt.payment.date === payment.date &&
  receipt.payment.method === payment.method &&
  receipt.payment.reference === (payment.reference || '')

export const nextReceiptNumber = (receipts: PaymentReceipt[], now = new Date()) => {
  const year = now.getFullYear()
  const prefix = 'REC-' + year + '-'
  const highest = receipts.reduce((max, item) => {
    const value = item.number.startsWith(prefix) ? Number(item.number.slice(prefix.length)) : 0
    return Number.isInteger(value) ? Math.max(max, value) : max
  }, 0)
  return prefix + String(highest + 1).padStart(4, '0')
}

export const defaultReceiptDescription = (event: BuffetEvent) =>
  'Pagamento referente ao evento ' + event.eventType.toLowerCase() +
  ' de ' + event.clientName + ', previsto para ' + event.eventDate.split('-').reverse().join('/') + '.'
export function createReceipt(
  receipts: PaymentReceipt[], event: BuffetEvent, payment: ReceivedPayment,
  settings: BusinessSettings, description: string, now = new Date()
): PaymentReceipt {
  if (!payment.date || !/^\d{4}-\d{2}-\d{2}$/.test(payment.date))
    throw new Error('Informe a data real do recebimento antes de emitir o recibo.')
  if (!Number.isFinite(payment.amount) || payment.amount <= 0)
    throw new Error('O pagamento precisa ter um valor positivo para emitir recibo.')
  if (!payment.method || payment.method === 'A confirmar')
    throw new Error('Confirme a forma de pagamento antes de emitir o recibo.')
  if (activeReceiptForPayment(receipts, event.id, payment.id))
    throw new Error('Este recebimento já possui um recibo ativo. Visualize-o ou cancele-o antes de reemitir.')
  if (!description.trim() || description.length > 600)
    throw new Error('Preencha a descrição do pagamento (até 600 caracteres).')
  const id = globalThis.crypto?.randomUUID?.() || 'receipt-' + now.getTime() + '-' + Math.random().toString(36).slice(2, 9)
  return {
    id, number: nextReceiptNumber(receipts, now),
    eventId: event.id, paymentId: payment.id,
    status: 'issued', issuedAt: now.toISOString(),
    issuer: {
      businessName: settings.businessName, legalName: settings.legalName,
      document: settings.document, address: settings.address,
      city: settings.city, phone: settings.phone, email: settings.email
    },
    payer: {
      name: event.clientName, document: event.clientDocument || '',
      address: event.clientAddress || '', email: event.clientEmail || '',
      phone: event.clientPhone || ''
    },
    event: {
      contractNumber: event.contractNumber, type: event.eventType,
      date: event.eventDate, venue: event.venueAddress || event.venue
    },
    payment: {
      date: payment.date, amount: payment.amount, method: payment.method,
      reference: payment.reference || '', notes: payment.notes || ''
    },
    description: description.trim()
  }
}
const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function threeDigits(value: number): string {
  if (value === 100) return 'cem'
  const parts: string[] = []
  const h = Math.floor(value / 100)
  if (h) parts.push(hundreds[h])
  const rest = value % 100
  if (rest >= 10 && rest < 20) parts.push(teens[rest - 10])
  else {
    const ten = Math.floor(rest / 10)
    if (ten) parts.push(tens[ten])
    if (rest % 10) parts.push(units[rest % 10])
  }
  return parts.join(' e ')
}

function integerWords(value: number) {
  if (value === 0) return 'zero'
  if (value > 999_999_999) return String(value)
  const parts: string[] = []
  const millions = Math.floor(value / 1_000_000)
  const thousands = Math.floor((value % 1_000_000) / 1_000)
  const rest = value % 1_000
  if (millions) parts.push(millions === 1 ? 'um milhão' : threeDigits(millions) + ' milhões')
  if (thousands) parts.push(thousands === 1 ? 'mil' : threeDigits(thousands) + ' mil')
  if (rest) {
    const glue = parts.length && (rest < 100 || rest % 100 === 0) ? ' e ' : parts.length ? ' ' : ''
    return parts.join(' ') + glue + threeDigits(rest)
  }
  return parts.join(' ')
}

export function amountInWordsBR(value: number): string {
  const cents = Math.round(value * 100)
  const integer = Math.floor(cents / 100)
  const fraction = cents % 100
  const full = integer ? integerWords(integer) + (integer === 1 ? ' real' : ' reais') : ''
  const small = fraction ? integerWords(fraction) + (fraction === 1 ? ' centavo' : ' centavos') : ''
  return full && small ? full + ' e ' + small : full || small || 'zero reais'
}

export interface ReceiptChanges {
  description: string
  payer: PaymentReceipt['payer']
  payment: PaymentReceipt['payment']
  issuer: PaymentReceipt['issuer']
  event: PaymentReceipt['event']
}

export function reviseReceipt(
  receipt: PaymentReceipt, changes: ReceiptChanges, reason: string,
  actor: string, at = new Date()
): PaymentReceipt {
  if (receipt.status !== 'issued') throw new Error('Somente recibos ativos podem ser editados.')
  if (reason.trim().length < 5 || reason.length > 500)
    throw new Error('Informe o motivo da alteração (de 5 a 500 caracteres).')
  if (!changes.payer.name.trim() || !changes.description.trim() || !changes.issuer.businessName.trim())
    throw new Error('Preencha o pagador, a descrição e os dados do emissor.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(changes.payment.date) ||
      !Number.isFinite(changes.payment.amount) || changes.payment.amount <= 0 ||
      !changes.payment.method.trim())
    throw new Error('Confirme a data, o valor positivo e a forma do pagamento.')
  const previous: ReceiptRevision['previous'] = JSON.parse(JSON.stringify({
    issuer: receipt.issuer, payer: receipt.payer, event: receipt.event,
    payment: receipt.payment, description: receipt.description
  }))
  return {
    ...receipt,
    issuer: { ...changes.issuer }, payer: { ...changes.payer },
    event: { ...changes.event }, payment: { ...changes.payment },
    description: changes.description.trim(),
    updatedAt: at.toISOString(), updatedBy: actor,
    revisions: [
      ...(receipt.revisions || []),
      { updatedAt: at.toISOString(), updatedBy: actor, reason: reason.trim(), previous }
    ]
  }
}

export function archiveReceipt(
  receipt: PaymentReceipt, reason: string, actor: string, at = new Date()
): PaymentReceipt {
  if (receipt.status === 'deleted') throw new Error('Recibo já excluído.')
  if (reason.trim().length < 5 || reason.length > 500)
    throw new Error('Informe um motivo para a exclusão (de 5 a 500 caracteres).')
  return {
    ...receipt, status: 'deleted', deletedAt: at.toISOString(),
    deletedBy: actor, deletedReason: reason.trim()
  }
}
