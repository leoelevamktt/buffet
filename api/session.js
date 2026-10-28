import { database } from './_db.js'
import { clearSession, createSession, getSession, safeOrigin, sessionConfigured } from './_session.js'
import { passwordVerify } from './_password.js'
import { createHmac } from 'node:crypto'
import { getTrustedIp } from './_audit.js'
import { reserveAttempt, securityEvent } from './_security.js'

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
      const user=await getSession(req)
      await clearSession(req,res)
      if (user) await securityEvent(database(),req,'logout',user.id)
      return res.status(200).json({authenticated:false})
    }
    if (req.method!=='POST') return res.status(405).json({error:'Método não permitido.'})
    const id=String(req.body?.username||'').trim().toLowerCase()
    const pass=typeof req.body?.password==='string'?req.body.password:''
    if (!id || id.length>254 || pass.length>256)
      return res.status(400).json({error:'Informe seu usuário e senha.'})
    const sql=database()
    const ipKey='ip:'+getTrustedIp(req).ip
    if (await reserveAttempt(sql,ipKey,30)) {
      await securityEvent(sql,req,'login_throttled',null,{scope:'ip'})
      res.setHeader('Retry-After','900')
      return res.status(429).json({error:'Muitas tentativas. Aguarde 15 minutos.'})
    }
    const found=await sql.query(`SELECT id,username,name,email,role,password_hash FROM buffet_users
      WHERE (username=$1 OR email=$1) AND active=TRUE LIMIT 1`,[id])
    const user=found.rows[0]
    const accountKey='account:'+(user?.id||createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(id).digest('hex'))
    if (await reserveAttempt(sql,accountKey,8)) {
      await securityEvent(sql,req,'login_throttled',user?.id,{scope:'account'})
      res.setHeader('Retry-After','900')
      return res.status(429).json({error:'Muitas tentativas. Aguarde 15 minutos.'})
    }
    const accepted=await passwordVerify(pass,user?.password_hash||'')
    if (!user || !accepted) {
      await securityEvent(sql,req,'login_failure',user?.id)
      return res.status(401).json({error:anonymousMessage})
    }
    if (!(await createSession(res,user.id,user.password_hash)))
      return res.status(401).json({error:anonymousMessage})
    await securityEvent(sql,req,'login_success',user.id)
    await sql.query('DELETE FROM buffet_login_attempts WHERE ip=$1 OR updated_at<now()-interval \'1 day\'',[accountKey])
    await sql.query('UPDATE buffet_users SET last_login_at=now() WHERE id=$1',[user.id])
    await sql.query('DELETE FROM buffet_sessions WHERE expires_at<now()')
    const {password_hash,...safe}=user
    return res.status(200).json({authenticated:true,user:safe})
  } catch(error) {
    console.error('session_error',error.message)
    return res.status(500).json({error:'Falha temporária de autenticação.'})
  }
}
