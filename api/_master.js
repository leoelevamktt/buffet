import { database } from './_db.js'
import { requireAdmin, sessionTokenHash } from './_session.js'
import { passwordVerify } from './_password.js'
import { reserveAttempt, securityEvent } from './_security.js'

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store')
  try {
    const user=await requireAdmin(req,res)
    if (!user) return
    if (req.method!=='POST') return res.status(405).json({error:'Método não permitido.'})
    if (!process.env.MASTER_PASSWORD_HASH) return res.status(503).json({error:'Senha mestra não configurada.'})
    const sql=database(), attemptKey='master:'+user.id
    if (await reserveAttempt(sql,attemptKey,8)) return res.status(429).json({error:'Muitas tentativas. Aguarde 15 minutos.'})
    if (!(await passwordVerify(req.body?.password,process.env.MASTER_PASSWORD_HASH))) {
      await securityEvent(sql,req,'master_unlock_failure',user.id)
      return res.status(401).json({error:'Senha mestra incorreta.'})
    }
    const token=sessionTokenHash(req)
    const updated=await sql.query(`UPDATE buffet_sessions SET master_unlocked_until=expires_at
      WHERE token_hash=$1 AND user_id=$2 AND expires_at>now() RETURNING master_unlocked_until`,[token,user.id])
    if (!updated.rowCount) return res.status(401).json({error:'Sessão expirada.'})
    await sql.query('DELETE FROM buffet_login_attempts WHERE ip=$1',[attemptKey])
    await securityEvent(sql,req,'master_unlock_success',user.id)
    return res.status(200).json({unlockedUntil:updated.rows[0].master_unlocked_until})
  } catch(error) {
    console.error('master_auth_error',error.message)
    return res.status(500).json({error:'Não foi possível liberar os dados agora.'})
  }
}
