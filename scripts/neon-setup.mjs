import pg from 'pg'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { passwordHash, validPassword } from '../api/_password.js'

const config=fs.readFileSync('.env.local','utf8')
const read=(key)=>config.match(new RegExp('^'+key+'=(.+)$','m'))?.[1]?.trim()
const url=read('DATABASE_URL')
if (!url) throw new Error('DATABASE_URL não encontrada')
const uri=new URL(url);uri.searchParams.set('sslmode','verify-full')
const db=new pg.Client({connectionString:uri.toString(),connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true}})
try {
  await db.connect()
  const ddl=fs.readFileSync('scripts/neon-schema.sql','utf8')
  await db.query('BEGIN')
  await db.query('SELECT pg_advisory_xact_lock(398522104)')
  for (const sql of ddl.split(';').map((s)=>s.trim()).filter(Boolean)) await db.query(sql)
  const users=await db.query('SELECT count(*)::integer AS count FROM buffet_users')
  if (users.rows[0].count===0) {
    const admin=read('ADMIN_PASSWORD')
    if (!validPassword(admin)) throw new Error('Senha inicial do admin ausente ou menor que 12 caracteres.')
    await db.query(`INSERT INTO buffet_users(id,username,name,email,role,password_hash)
      VALUES($1,'admin','Administrador',NULL,'admin',$2)`,[randomUUID(),await passwordHash(admin)])
    console.log('INITIAL_ADMIN_SEEDED')
  } else console.log('USERS_EXISTING='+users.rows[0].count)
  await db.query('COMMIT')
  const rows=await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'buffet_%' ORDER BY 1")
  console.log('NEON_SCHEMA_READY',rows.rows.map((r)=>r.table_name).join(','))
} catch(error){
  await db.query('ROLLBACK').catch(()=>{})
  console.error('NEON_SETUP_ERROR',error.message.replace(url,'[hidden]'))
  process.exitCode=1
} finally {await db.end().catch(()=>{})}
