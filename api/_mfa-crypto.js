import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'

export const mfaConfigured = () => /^[a-f0-9]{64}$/i.test(process.env.MFA_ENCRYPTION_KEY || '')
const key = () => {
  if (!mfaConfigured()) throw new Error('Chave de autenticação indisponível.')
  return Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex')
}
const hash = (value) => createHash('sha256').update(value).digest('hex')
export const passwordProof = (userId, passwordHash) => hash('akela-mfa-password:v1:' + userId + ':' + passwordHash)
export const invitationHash = (userId, token) => hash('akela-mfa-invitation:v1:' + userId + ':' + token)
export const newSecret = () => new OTPAuth.Secret({ size: 20 }).base32

export function encryptSecret(userId, secret) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from('akela-mfa-secret:v1:' + userId))
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return 'v1:' + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}
export function decryptSecret(userId, value) {
  if (typeof value !== 'string' || !/^v1:[a-zA-Z0-9_-]{40,200}$/.test(value)) throw new Error('Fator inválido.')
  const data = Buffer.from(value.slice(3), 'base64url')
  const cipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12))
  cipher.setAAD(Buffer.from('akela-mfa-secret:v1:' + userId))
  cipher.setAuthTag(data.subarray(12, 28))
  const secret = Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8')
  if (!/^[A-Z2-7]{32}$/.test(secret)) throw new Error('Fator inválido.')
  return secret
}
export function totpCounter(secret, code, lastCounter, timestamp = Date.now()) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null
  const delta = new OTPAuth.TOTP({ secret, algorithm: 'SHA1', digits: 6, period: 30 }).validate({ token: code, window: 1, timestamp })
  if (delta === null) return null
  const counter = Math.floor(timestamp / 30000) + delta
  return counter > Number(lastCounter ?? -1) ? counter : null
}
export async function enrollmentDisplay(username, secret) {
  const uri = new OTPAuth.TOTP({ issuer: 'Buffet Akela', label: username, secret, algorithm: 'SHA1', digits: 6, period: 30 }).toString()
  return { secret, qrImage: await QRCode.toDataURL(uri, { width: 240, margin: 2, errorCorrectionLevel: 'M' }) }
}
export const newRecoveryCodes = () => Array.from({ length: 8 }, () => randomBytes(12).toString('hex').toUpperCase().match(/.{6}/g).join('-'))
export function recoveryHash(userId, code) {
  if (typeof code !== 'string' || code.length > 64) return null
  const normalized = code.replace(/[\s-]/g, '').toLowerCase()
  return /^[a-f0-9]{24}$/.test(normalized) ? hash('akela-mfa-recovery:v1:' + userId + ':' + normalized) : null
}
