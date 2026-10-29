import pg from 'pg'
import { randomBytes } from 'node:crypto'
import { writeFile, unlink } from 'node:fs/promises'
import { invitationHash, passwordProof } from '../api/_mfa-crypto.js'

const { MFA_DATABASE_URL, MFA_BOOTSTRAP_OUTPUT }=process.env
if (!MFA_DATABASE_URL || !MFA_BOOTSTRAP_OUTPUT?.startsWith('/')) throw new Error('Informe o banco de manutenção e o arquivo privado de saída.')
const uri=new URL(MFA_DATABASE_URL);uri.searchParams.set('sslmode','verify-full')
const pool=new pg.Pool({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},max:1})
const client=await pool.connect()
let wrote=false
try {
  await client.query('BEGIN')
  const result=await client.query("SELECT id,username,role,active,password_hash,mfa_version,mfa_secret,mfa_enabled_at FROM buffet_users WHERE username='leo' FOR UPDATE")
  const user=result.rows[0]
  if (!user || !user.active || user.role!=='admin' || user.mfa_secret || user.mfa_enabled_at) throw new Error('A conta leo não está disponível para o primeiro convite.')
  const token=randomBytes(24).toString('base64url')
  await client.query(`INSERT INTO buffet_mfa_invitations(user_id,token_hash,password_proof,mfa_version,created_by,expires_at)
    VALUES($1,$2,$3,$4,NULL,now()+interval '30 minutes') ON CONFLICT(user_id) DO UPDATE SET
    token_hash=EXCLUDED.token_hash,password_proof=EXCLUDED.password_proof,mfa_version=EXCLUDED.mfa_version,
    created_by=NULL,expires_at=EXCLUDED.expires_at,created_at=now()`,
  [user.id,invitationHash(user.id,token),passwordProof(user.id,user.password_hash),user.mfa_version])
  await client.query("DELETE FROM buffet_mfa_challenges WHERE user_id=$1 AND stage='setup'",[user.id])
  await client.query(`INSERT INTO buffet_security_events(event,user_id,ip,user_agent,details)
    VALUES('mfa_invitation_issued',$1,'authorized-maintenance','bootstrap',jsonb_build_object('bootstrap',true))`,[user.id])
  await writeFile(MFA_BOOTSTRAP_OUTPUT,`Convite individual de leo (válido por 30 minutos):\nhttps://buffetakela.vercel.app/#ativar-2fa=${token}\n\nAbra o link, entre com a senha de leo e siga as instruções. Guarde os códigos de recuperação em local seguro.\n`,{mode:0o600,flag:'wx'})
  wrote=true
  await client.query('COMMIT')
  console.log('Convite criado para a conta escolhida.')
} catch(error) {
  await client.query('ROLLBACK').catch(()=>{})
  if (wrote) await unlink(MFA_BOOTSTRAP_OUTPUT).catch(()=>{})
  throw error
} finally {client.release();await pool.end()}
