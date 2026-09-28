import { createHmac, randomBytes } from 'node:crypto'
import { database } from './_db.js'

const cookieName = 'akela_session'
const seconds = 12 * 60 * 60
const production = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
const hash = (token) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
  .update('buffet-neon-session-v2:' + token).digest('hex')
const options = 'HttpOnly; Path=/; SameSite=Strict; Max-Age=' + seconds + (production ? '; Secure' : '')
export const sessionConfigured = () => Boolean(process.env.ADMIN_SESSION_SECRET?.length >= 32)
const extract = (req) => String(req.headers.cookie || '').split(';').map((part) => part.trim())
  .find((part) => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || ''
export const safeOrigin = (req) => {
  if (req.method === 'GET') return true
  const origin = String(req.headers.origin || '')
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
  if (!origin) return true // server-side or same-origin non-browser requests
  try { return new URL(origin).host.toLowerCase() === host.toLowerCase() } catch { return false }
}

export async function createSession(res, userId) {
  if (!sessionConfigured()) throw new Error('Segredo de sessão não configurado.')
  const token = randomBytes(32).toString('base64url')
  await database().query(`INSERT INTO buffet_sessions(token_hash,user_id,expires_at)
    VALUES($1,$2,now()+interval '12 hours')`, [hash(token), userId])
  res.setHeader('Set-Cookie', cookieName + '=' + token + '; ' + options)
}
export async function clearSession(req, res) {
  const token = extract(req)
  if (/^[a-zA-Z0-9_-]{43}$/.test(token) && sessionConfigured())
    await database().query('DELETE FROM buffet_sessions WHERE token_hash=$1',[hash(token)])
  res.setHeader('Set-Cookie', cookieName + '=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0' + (production ? '; Secure' : ''))
}
export async function getSession(req) {
  const token = extract(req)
  if (!sessionConfigured() || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return null
  const result = await database().query(`SELECT u.id,u.username,u.name,u.email,u.role,u.active
    FROM buffet_sessions s JOIN buffet_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=TRUE`,[hash(token)])
  return result.rows[0] || null
}
export async function requireAdmin(req,res,role) {
  if (!safeOrigin(req)) {res.status(403).json({error:'Origem não autorizada.'});return null}
  const user=await getSession(req)
  if (!user) {res.status(401).json({error:'Sessão ausente ou expirada. Entre novamente.'});return null}
  if (role && user.role!==role) {res.status(403).json({error:'Somente administradores podem acessar esta área.'});return null}
  return user
}
