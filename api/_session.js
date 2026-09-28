import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const cookieName = 'akela_admin'
const ttl = 14 * 24 * 60 * 60
const production = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
const hash = (value) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update('buffet-admin-v1:' + value).digest('hex')
const cookieOptions = 'HttpOnly; Path=/; SameSite=Strict; Max-Age=' + ttl + (production ? '; Secure' : '')
const safeEquals = (a, b) => {
  const left = Buffer.from(String(a || ''))
  const right = Buffer.from(String(b || ''))
  return left.length === right.length && timingSafeEqual(left, right)
}
export const sessionConfigured = () =>
  Boolean(process.env.ADMIN_PASSWORD?.length >= 16 && process.env.ADMIN_SESSION_SECRET?.length >= 32)

export function createSession(res) {
  if (!sessionConfigured()) throw new Error('Autenticação administrativa não configurada.')
  const exp = Math.floor(Date.now() / 1000) + ttl
  const nonce = randomBytes(24).toString('base64url')
  const raw = exp + '.' + nonce
  const token = raw + '.' + hash(raw)
  res.setHeader('Set-Cookie', cookieName + '=' + token + '; ' + cookieOptions)
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', cookieName + '=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0' + (production ? '; Secure' : ''))
}

export function isAdmin(req) {
  if (!sessionConfigured()) return false
  const raw = String(req.headers.cookie || '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1)
  if (!raw || !/^\d+\.[a-zA-Z0-9_-]+\.[a-f0-9]{64}$/.test(raw)) return false
  const [exp, nonce, actual] = raw.split('.')
  const expiry = Number(exp)
  if (!Number.isSafeInteger(expiry) || expiry < Date.now() / 1000 || expiry > Date.now() / 1000 + ttl) return false
  return safeEquals(actual, hash(exp + '.' + nonce))
}
export function requireAdmin(req, res) {
  if (!isAdmin(req)) { res.status(401).json({ error: 'Sessão administrativa ausente ou expirada.' }); return false }
  const origin = String(req.headers.origin || '')
  const forwarded = req.headers['x-forwarded-host'] || req.headers.host
  if (req.method !== 'GET' && origin && new URL(origin).host !== forwarded) {
    res.status(403).json({ error: 'Origem não autorizada.' })
    return false
  }
  return true
}
export const matchesAdminPassword = (candidate) =>
  sessionConfigured() && safeEquals(candidate, process.env.ADMIN_PASSWORD)
