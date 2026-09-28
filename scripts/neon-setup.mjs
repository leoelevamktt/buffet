import pg from 'pg'
import fs from 'node:fs'
const url=fs.readFileSync('.env.local','utf8').match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim()
if (!url) throw new Error('DATABASE_URL não encontrada')
const uri=new URL(url);uri.searchParams.set('sslmode','verify-full')
const db=new pg.Client({connectionString:uri.toString(),connectionTimeoutMillis:10000,ssl:{rejectUnauthorized:true}})
try {
  await db.connect()
  const ddl=fs.readFileSync('scripts/neon-schema.sql','utf8')
  await db.query('BEGIN')
  for(const sql of ddl.split(';').map(s=>s.trim()).filter(Boolean)) await db.query(sql)
  await db.query('COMMIT')
  const rows=await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'buffet_%' ORDER BY 1")
  console.log('NEON_SCHEMA_READY',rows.rows.map(r=>r.table_name).join(','))
} catch(error){
  await db.query('ROLLBACK').catch(()=>{})
  console.error('NEON_SETUP_ERROR',error.message.replace(url,'[hidden]'))
  process.exitCode=1
} finally {await db.end().catch(()=>{})}
