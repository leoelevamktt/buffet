import { randomUUID } from 'node:crypto'
import { database } from './_db.js'
import { requireAdmin } from './_session.js'
import { passwordHash, validPassword } from './_password.js'

const validUsername = (v) => typeof v==='string' && /^[a-z][a-z0-9._-]{2,39}$/.test(v)
const validName = (v) => typeof v==='string' && v.trim().length>=3 && v.trim().length<=100
const validEmail = (v) => !v || (typeof v==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length<=254)
const uuid = (v) => typeof v==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v)
const fields = 'id, username, name, email, role, active, created_at, updated_at, last_login_at'
const responseUser = (r) => r // explicit selection excludes password hash

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store')
  let user
  try { user=await requireAdmin(req,res,'admin') } catch (error) {
    console.error('user_auth_error',error.message)
    return res.status(500).json({error:'Falha temporária de autenticação.'})
  }
  if (!user) return
  const sql=database()
  try {
    if (req.method==='GET') {
      const rows=await sql.query('SELECT '+fields+' FROM buffet_users ORDER BY created_at ASC')
      return res.status(200).json({users:rows.rows.map(responseUser),currentUserId:user.id})
    }
    if (req.method==='POST') {
      const name=String(req.body?.name||'').trim()
      const username=String(req.body?.username||'').trim().toLowerCase()
      const email=String(req.body?.email||'').trim().toLowerCase()||null
      const role=req.body?.role
      const password=req.body?.password
      if (!validUsername(username)||!validName(name)||!validEmail(email)||!['admin','operador'].includes(role)||!validPassword(password))
        return res.status(400).json({error:'Preencha nome, usuário válido, senha de 12 a 128 caracteres e perfil.'})
      const encrypted=await passwordHash(password)
      const inserted=await sql.query(`INSERT INTO buffet_users(id,username,name,email,role,password_hash)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING `+fields,
        [randomUUID(),username,name,email,role,encrypted])
      return res.status(201).json({user:inserted.rows[0]})
    }
    if (req.method==='PATCH') {
      const id=req.body?.id
      if (!uuid(id)) return res.status(400).json({error:'Usuário inválido.'})
      const name=String(req.body?.name||'').trim()
      const email=String(req.body?.email||'').trim().toLowerCase()||null
      const role=req.body?.role
      const active=req.body?.active
      const password=req.body?.password
      if (!validName(name)||!validEmail(email)||!['admin','operador'].includes(role)||typeof active!=='boolean'||
          (password!==undefined && password!==''&&!validPassword(password)))
        return res.status(400).json({error:'Dados inválidos. A senha, quando informada, deve ter pelo menos 12 caracteres.'})
      const client=await sql.connect()
      try {
        await client.query('BEGIN')
        // Uma única alteração administrativa por vez para proteger o último administrador.
        await client.query('SELECT pg_advisory_xact_lock(398522105)')
        const existing=await client.query('SELECT '+fields+' FROM buffet_users WHERE id=$1 FOR UPDATE',[id])
        if (!existing.rowCount) {await client.query('ROLLBACK');return res.status(404).json({error:'Usuário não encontrado.'})}
        const previous=existing.rows[0]
        const isSelf=id===user.id
        if (isSelf && (!active||role!=='admin')) {
          await client.query('ROLLBACK')
          return res.status(400).json({error:'Não é permitido desativar nem retirar seu próprio acesso administrativo.'})
        }
        if (previous.active&&previous.role==='admin'&&(!active||role!=='admin')) {
          const count=await client.query("SELECT count(*)::integer AS total FROM buffet_users WHERE active=TRUE AND role='admin'")
          if (count.rows[0].total<=1) {
            await client.query('ROLLBACK')
            return res.status(409).json({error:'É obrigatório manter pelo menos um administrador ativo.'})
          }
        }
        if (isSelf && password) {
          await client.query('ROLLBACK')
          return res.status(400).json({error:'Para trocar sua senha, utilize a área Meu acesso e informe sua senha atual.'})
        }
        const encrypted=password?await passwordHash(password):null
        const changed=await client.query(`UPDATE buffet_users SET name=$2,email=$3,role=$4,active=$5,
          password_hash=COALESCE($6,password_hash),updated_at=now()
          WHERE id=$1 RETURNING `+fields,[id,name,email,role,active,encrypted])
        if (encrypted||previous.role!==role||previous.active!==active)
          await client.query('DELETE FROM buffet_sessions WHERE user_id=$1',[id])
        await client.query('COMMIT')
        return res.status(200).json({user:changed.rows[0]})
      } catch (error) {
        await client.query('ROLLBACK').catch(()=>{})
        throw error
      } finally {client.release()}
    }
    return res.status(405).json({error:'Método não permitido.'})
  } catch(error) {
    if (error.code==='23505') return res.status(409).json({error:'Usuário ou e-mail já cadastrado.'})
    console.error('users_api_error',error.message)
    return res.status(500).json({error:'Não foi possível executar esta alteração agora.'})
  }
}
