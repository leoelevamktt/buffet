import { database } from './_db.js'
import { clearSession, requireAdmin } from './_session.js'
import { passwordHash, passwordVerify, validPassword } from './_password.js'

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store')
  let user
  try {user=await requireAdmin(req,res)} catch(error) {console.error('profile_auth',error.message);return res.status(500).json({error:'Falha de autenticação.'})}
  if (!user) return
  if (req.method!=='PATCH') return res.status(405).json({error:'Método não permitido.'})
  const current=String(req.body?.currentPassword||'')
  const next=String(req.body?.newPassword||'')
  if (!validPassword(next)||current.length>256)
    return res.status(400).json({error:'A nova senha deve ter entre 12 e 128 caracteres.'})
  try {
    const sql=database()
    const existing=await sql.query('SELECT password_hash FROM buffet_users WHERE id=$1',[user.id])
    if (!existing.rowCount || !(await passwordVerify(current,existing.rows[0].password_hash)))
      return res.status(400).json({error:'Senha atual incorreta.'})
    const encrypted=await passwordHash(next)
    const client=await sql.connect()
    try {
      await client.query('BEGIN')
      const result=await client.query('UPDATE buffet_users SET password_hash=$2,updated_at=now() WHERE id=$1 AND password_hash=$3',
        [user.id,encrypted,existing.rows[0].password_hash])
      if (!result.rowCount) {await client.query('ROLLBACK');return res.status(409).json({error:'Sua senha foi alterada em outra sessão. Entre novamente.'})}
      await client.query('DELETE FROM buffet_sessions WHERE user_id=$1',[user.id])
      await client.query('COMMIT')
      await clearSession(req,res)
      return res.status(200).json({changed:true})
    } catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error}
    finally {client.release()}
  } catch(error) {
    console.error('profile_api_error',error.message)
    return res.status(500).json({error:'Não foi possível alterar a senha agora.'})
  }
}
