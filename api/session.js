import { database } from './_db.js'
import { clearSession, createSession, isAdmin, matchesAdminPassword, requireAdmin, sessionConfigured } from './_session.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!sessionConfigured()) return res.status(503).json({ error: 'Acesso administrativo ainda não configurado.' })
  if (req.method === 'GET') return res.status(200).json({ authenticated: isAdmin(req) })
  if (req.method === 'DELETE') { clearSession(res); return res.status(200).json({ authenticated: false }) }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  const origin = req.headers.origin
  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (origin && new URL(origin).host !== host) return res.status(403).json({ error: 'Origem não autorizada.' })
  const forwarded = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
  const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim().slice(0, 100)
  try {
    const sql = database()
    const tracked = await sql.query('SELECT failures, blocked_until FROM buffet_login_attempts WHERE ip=$1', [ip])
    if (tracked.rows[0]?.blocked_until && new Date(tracked.rows[0].blocked_until).getTime() > Date.now())
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' })
    const pass = typeof req.body?.password === 'string' ? req.body.password : ''
    if (pass.length > 256 || !matchesAdminPassword(pass)) {
      await sql.query(`INSERT INTO buffet_login_attempts(ip, failures, blocked_until, updated_at)
        VALUES ($1,1,NULL,now()) ON CONFLICT(ip) DO UPDATE SET
        failures=CASE WHEN buffet_login_attempts.updated_at < now()-interval '15 minutes' THEN 1 ELSE buffet_login_attempts.failures+1 END,
        blocked_until=CASE WHEN buffet_login_attempts.failures>=7 AND buffet_login_attempts.updated_at>=now()-interval '15 minutes'
          THEN now()+interval '15 minutes' ELSE NULL END,
        updated_at=now()`, [ip])
      return res.status(401).json({ error: 'Senha incorreta.' })
    }
    await sql.query('DELETE FROM buffet_login_attempts WHERE ip=$1', [ip])
    createSession(res)
    return res.status(200).json({ authenticated: true })
  } catch (error) {
    console.error('admin_auth_failure', error.message)
    return res.status(500).json({ error: 'Falha temporária de autenticação.' })
  }
}
