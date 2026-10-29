import { createHmac, randomBytes } from 'node:crypto'
import { database } from './_db.js'
import { appendCookie } from './_session.js'
import { passwordProof } from './_mfa-crypto.js'

const production = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
const name = production ? '__Host-akela_preauth' : 'akela_preauth'
const options = 'HttpOnly; Path=/; SameSite=Strict;' + (production ? ' Secure;' : '')
const hash = (token) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update('akela-mfa-challenge:v1:' + token).digest('hex')
export function challengeHash(req) {
  const token = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(name + '='))?.slice(name.length + 1) || ''
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? hash(token) : null
}
export const clearChallengeCookie = (res) => appendCookie(res, name + '=; ' + options + ' Max-Age=0')
export async function beginMfa(res, user) {
  const token = randomBytes(32).toString('base64url')
  const result = await database().query(`INSERT INTO buffet_mfa_challenges(token_hash,user_id,password_proof,mfa_version,stage,expires_at)
    SELECT $1,id,$2,mfa_version,CASE WHEN mfa_secret IS NULL OR mfa_enabled_at IS NULL THEN 'invite' ELSE 'verify' END,now()+interval '5 minutes'
    FROM buffet_users WHERE id=$3 AND active=TRUE AND password_hash=$4 RETURNING stage`,
  [hash(token), passwordProof(user.id,user.password_hash), user.id,user.password_hash])
  if (!result.rowCount) return null
  appendCookie(res, name + '=' + token + '; ' + options + ' Max-Age=300')
  return result.rows[0].stage
}
export async function pendingMfa(req) {
  const tokenHash = challengeHash(req)
  if (!tokenHash) return null
  const result = await database().query(`SELECT c.stage,u.username FROM buffet_mfa_challenges c
    JOIN buffet_users u ON u.id=c.user_id WHERE c.token_hash=$1 AND c.expires_at>now()
    AND c.attempts<5 AND u.active=TRUE AND c.mfa_version=u.mfa_version`,[tokenHash])
  return result.rows[0] || null
}
