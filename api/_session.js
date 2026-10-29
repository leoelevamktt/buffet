import { createHmac, randomBytes } from 'node:crypto'
import { database } from './_db.js'
import { securityEvent } from './_security.js'
import { mfaConfigured } from './_mfa-crypto.js'

const seconds = 12 * 60 * 60
const production = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
const cookieName = production ? '__Host-akela_session' : 'akela_session'
const hash = (token) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
  .update('buffet-neon-session-v2:' + token).digest('hex')
const options = 'HttpOnly; Path=/; SameSite=Strict; Max-Age=' + seconds + (production ? '; Secure' : '')
export const sessionConfigured = () => Boolean(process.env.ADMIN_SESSION_SECRET?.length >= 32)
const extract = (req) => String(req.headers.cookie || '').split(';').map((part) => part.trim())
  .find((part) => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || ''
export const sessionTokenHash = (req) => {
  const token=extract(req)
  return sessionConfigured() && /^[a-zA-Z0-9_-]{43}$/.test(token) ? hash(token) : null
}
export const safeOrigin = (req) => {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  if (req.method === 'GET') return true
  const origin = String(req.headers.origin || '')
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
  if (!origin) return true // server-side or same-origin non-browser requests
  try { return new URL(origin).host.toLowerCase() === host.toLowerCase() } catch { return false }
}

export async function createSession(sql, userId, expectedPasswordHash, mfaVersion, masterUntil=null) {
  if (!sessionConfigured()) throw new Error('Segredo de sessão não configurado.')
  const token = randomBytes(32).toString('base64url')
  const result = await sql.query(`INSERT INTO buffet_sessions(token_hash,user_id,expires_at,mfa_version,mfa_verified_at,master_unlocked_until)
    SELECT $1,id,now()+interval '12 hours',mfa_version,now(),$5 FROM buffet_users
    WHERE id=$2 AND active=TRUE AND password_hash=$3 AND mfa_version=$4
      AND mfa_secret IS NOT NULL AND mfa_enabled_at IS NOT NULL`, [hash(token), userId, expectedPasswordHash, mfaVersion, masterUntil])
  return result.rowCount ? token : null
}
export const appendCookie = (res, value) => {
  const existing = res.getHeader?.('Set-Cookie')
  res.setHeader('Set-Cookie', existing ? [...(Array.isArray(existing) ? existing : [existing]), value] : value)
}
export const setSessionCookie = (res, token) => appendCookie(res, cookieName + '=' + token + '; ' + options)
export async function clearSession(req, res) {
  const token = extract(req)
  if (/^[a-zA-Z0-9_-]{43}$/.test(token) && sessionConfigured())
    await database().query('DELETE FROM buffet_sessions WHERE token_hash=$1',[hash(token)])
  appendCookie(res, cookieName + '=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0' + (production ? '; Secure' : ''))
}
export async function getSession(req) {
  const token = extract(req)
  if (!sessionConfigured() || !mfaConfigured() || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return null
  const result = await database().query(`SELECT u.id,u.username,u.name,u.email,u.role,u.active,s.master_unlocked_until
    FROM buffet_sessions s JOIN buffet_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=TRUE
      AND s.mfa_verified_at IS NOT NULL AND s.mfa_version=u.mfa_version
      AND u.mfa_enabled_at IS NOT NULL AND u.mfa_secret IS NOT NULL`,[hash(token)])
  return result.rows[0] || null
}
export async function requireSensitive(req,res,role) {
  const user=await requireAdmin(req,res,role)
  if (!user) return null
  if (!user.master_unlocked_until || new Date(user.master_unlocked_until).getTime()<=Date.now()) {
    res.status(403).json({error:'Informe a senha mestra para acessar os dados.',masterRequired:true})
    return null
  }
  return user
}
export async function requireAdmin(req,res,role) {
  if (!safeOrigin(req)) {res.status(403).json({error:'Origem não autorizada.'});return null}
  const user=await getSession(req)
  if (!user) {res.status(401).json({error:'Sessão ausente ou expirada. Entre novamente.'});return null}
  if (role && user.role!==role) {res.status(403).json({error:'Somente administradores podem acessar esta área.'});return null}
  await securityEvent(database(),req,'admin_request',user.id,{
    method:req.method,path:String(req.url||'').split('?')[0].slice(0,100)
  })
  return user
}
