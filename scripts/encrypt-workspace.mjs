import pg from 'pg'
import { readFile,writeFile } from 'node:fs/promises'
import { timingSafeEqual } from 'node:crypto'
import { encryptExistingWorkspace } from './_encrypt-workspace.js'
import { workspaceKeyFingerprint } from '../api/_workspace-crypto.js'

const { MFA_DATABASE_URL, WORKSPACE_KEY_FILE, WORKSPACE_BACKUP_FILE }=process.env
if (!MFA_DATABASE_URL || !WORKSPACE_KEY_FILE?.startsWith('/') || !WORKSPACE_BACKUP_FILE?.startsWith('/')) throw new Error('Banco, chave ou backup não configurados.')
process.env.WORKSPACE_ENCRYPTION_KEY=(await readFile(WORKSPACE_KEY_FILE,'utf8')).trim()
const health=await fetch('https://akelabuffet.vercel.app/api/session',{cache:'no-store'})
if (!health.ok) throw new Error('Não foi possível verificar a versão em produção.')
const status=await health.json(), localFingerprint=workspaceKeyFingerprint()
if (!localFingerprint || !/^[a-f0-9]{64}$/.test(status.dataProtectionFingerprint||'') ||
    !timingSafeEqual(Buffer.from(localFingerprint,'hex'),Buffer.from(status.dataProtectionFingerprint,'hex')))
  throw new Error('A chave local não corresponde à chave da versão em produção.')
const uri=new URL(MFA_DATABASE_URL);uri.searchParams.set('sslmode','verify-full')
const pool=new pg.Pool({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},max:1}),client=await pool.connect()
try {
  await client.query('BEGIN');await client.query('SET LOCAL search_path TO public,pg_catalog')
  const result=await encryptExistingWorkspace(client,backup=>writeFile(WORKSPACE_BACKUP_FILE,JSON.stringify({tables:{buffet_workspace:[{id:'main',...backup}]}}),{mode:0o600,flag:'wx'}))
  await client.query('COMMIT')
  console.log(result.alreadyEncrypted?'Dados já criptografados e validados.':'Dados criptografados e validados.')
} catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error}
finally {client.release();await pool.end()}
