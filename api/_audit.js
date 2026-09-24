import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

export const ALGORITHM = 'SHA-256'
export const EVIDENCE_VERSION = 2
export const VERIFICATION_POLICY = 'eletronica-simples-com-evidencias'
export const TERMS_VERSION = 'aceite-explicito-v1-2026-09'

export function canonical(value) {
  if (value === undefined) return 'null'
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map((item) => canonical(item)).join(',') + ']'
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}'
}

export const sha256 = (input) => createHash('sha256').update(input).digest('hex')
export const canonicalHash = (obj) => sha256(canonical(obj))
export const newCode = () => randomBytes(24).toString('base64url')
export const isCode = (value) => /^[a-zA-Z0-9_-]{24,64}$/.test(String(value || ''))
export const normalizeEmail = (value) => String(value || '').trim().toLowerCase()
export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')) && String(value).length <= 254
export const signedDocumentPayload = (contract) => ({
  event: contract.event,
  menu: contract.menu,
  services: contract.services,
  settings: contract.settings,
  total: contract.total,
  contractTemplate: contract.contractTemplate
})

export function documentIntegrity(contract) {
  if (!contract.document || !contract.documentHash) return { valid: false, reason: 'legacy' }
  return {
    valid: canonicalHash(contract.document) === contract.documentHash,
    calculatedHash: canonicalHash(contract.document),
    reason: 'snapshot'
  }
}

export function getTrustedIp(req) {
  const vercel = req.headers['x-vercel-forwarded-for']
  const forwarded = req.headers['x-forwarded-for']
  const real = req.headers['x-real-ip']
  const value = vercel || forwarded || real || ''
  const ip = String(Array.isArray(value) ? value[0] : value).split(',')[0].trim().slice(0, 64)
  return {
    ip: ip || 'não disponível',
    source: vercel ? 'x-vercel-forwarded-for' : forwarded ? 'x-forwarded-for (informação de proxy)' : real ? 'x-real-ip (informação de proxy)' : 'indisponível'
  }
}
export function auditSeal(hash, secret = process.env.SIGNATURE_AUDIT_SECRET) {
  if (!secret || secret.length < 32) throw new Error('SIGNATURE_AUDIT_SECRET ausente ou insuficiente')
  return createHmac('sha256', secret).update('buffet-akela-audit-v2:' + hash).digest('hex')
}

export function verifyAudit(receipt, receiptHash, seal, secret = process.env.SIGNATURE_AUDIT_SECRET) {
  if (!receipt || !/^[a-f0-9]{64}$/.test(receiptHash || '') || !/^[a-f0-9]{64}$/.test(seal || '')) return false
  const hash = canonicalHash(receipt)
  const validHash = timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(receiptHash, 'hex'))
  if (!validHash) return false
  const expected = auditSeal(receiptHash, secret)
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(seal, 'hex'))
}

export function maskedEmail(input) {
  const address = normalizeEmail(input)
  const [local, domain] = address.split('@')
  return domain ? local.slice(0, 2) + '***@' + domain : ''
}

export function browserInfo(req) {
  const ua = String(req.headers['user-agent'] || 'indisponível').slice(0, 500)
  const language = String(req.headers['accept-language'] || '').slice(0, 120)
  return { userAgent: ua, acceptLanguage: language }
}
