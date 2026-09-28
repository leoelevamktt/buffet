import { database } from './_db.js'
import { clearSession, createSession, getSession, safeOrigin, sessionConfigured } from './_session.js'
import { passwordVerify } from './_password.js'

const anonymousMessage = 'Usuário ou senha incorretos.'
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store')
  if (!sessionConfigured()) return res.status(503).json({error:'Acesso administrativo não configurado.'})
  if (!safeOrigin(req)) return res.status(403).json({error:'Origem não autorizada.'})
  try {
    if (req.method==='GET') {
      const user=await getSession(req)
      return res.status(200).json({authenticated:Boolean(user),user})
    }
    if (req.method==='DELETE') {
      await clearSession(req,res)
      return res.status(200).json({authenticated:false})
    }
    if (req.method!=='POST') return res.status(405).json({error:'Método não permitido.'})
    const id=String(req.body?.username||'').trim().toLowerCase()
    const pass=typeof req.body?.password==='string'?req.body.password:''
    if (!id || id.length>254 || pass.length>256)
      return res.status(400).json({error:'Informe seu usuário e senha.'})
    const forwarded=req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||''
    const ip=String(Array.isArray(forwarded)?forwarded[0]:forwarded).split(',')[0].trim().slice(0,100)
    const sql=database()
    const tracked=await sql.query('SELECT failures,blocked_until FROM buffet_login_attempts WHERE ip=$1',[ip])
    if (tracked.rows[0]?.blocked_until && new Date(tracked.rows[0].blocked_until).getTime()>Date.now())
      return res.status(429).json({error:'Muitas tentativas. Aguarde 15 minutos.'})
    const found=await sql.query(`SELECT id,username,name,email,role,password_hash FROM buffet_users
      WHERE (username=$1 OR email=$1) AND active=TRUE LIMIT 1`,[id])
    const user=found.rows[0]
    const accepted=await passwordVerify(pass,user?.password_hash||'')
    if (!user || !accepted) {
      await sql.query(`INSERT INTO buffet_login_attempts(ip,failures,blocked_until,updated_at)
        VALUES($1,1,NULL,now()) ON CONFLICT(ip) DO UPDATE SET
        failures=CASE WHEN buffet_login_attempts.updated_at<now()-interval '15 minutes' THEN 1 ELSE buffet_login_attempts.failures+1 END,
        blocked_until=CASE WHEN buffet_login_attempts.failures>=7 AND buffet_login_attempts.updated_at>=now()-interval '15 minutes'
          THEN now()+interval '15 minutes' ELSE NULL END,updated_at=now()`,[ip])
      return res.status(401).json({error:anonymousMessage})
    }
    await sql.query('DELETE FROM buffet_login_attempts WHERE ip=$1',[ip])
    await sql.query('UPDATE buffet_users SET last_login_at=now() WHERE id=$1',[user.id])
    await sql.query('DELETE FROM buffet_sessions WHERE expires_at<now()')
    await createSession(res,user.id)
    const {password_hash,...safe}=user
    return res.status(200).json({authenticated:true,user:safe})
  } catch(error) {
    console.error('session_error',error.message)
    return res.status(500).json({error:'Falha temporária de autenticação.'})
  }
}
