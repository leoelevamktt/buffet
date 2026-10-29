import pg from 'pg'
import { readFile } from 'node:fs/promises'
const { MFA_DATABASE_URL, MFA_APP_ROLE }=process.env
if (!MFA_DATABASE_URL || !/^akela_app_[a-f0-9]{12}$/.test(MFA_APP_ROLE||'')) throw new Error('Banco de manutenção ou papel da aplicação inválido.')
const uri=new URL(MFA_DATABASE_URL);uri.searchParams.set('sslmode','verify-full')
const pool=new pg.Pool({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},max:1})
const client=await pool.connect()
try {
  await client.query('BEGIN')
  await client.query("SET LOCAL search_path TO public,pg_catalog")
  await client.query(await readFile(new URL('./neon-schema.sql',import.meta.url),'utf8'))
  await client.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON buffet_mfa_invitations,buffet_mfa_challenges,buffet_mfa_recovery_codes TO "${MFA_APP_ROLE}"`)
  await client.query('COMMIT')
  console.log('Migração aditiva concluída.')
} catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error}
finally {client.release();await pool.end()}
