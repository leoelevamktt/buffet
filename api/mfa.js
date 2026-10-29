import { randomBytes } from 'node:crypto'
import { database } from './_db.js'
import { requireAdmin, safeOrigin, sessionConfigured, sessionTokenHash, createSession, setSessionCookie } from './_session.js'
import { challengeHash, clearChallengeCookie } from './_mfa.js'
import { mfaConfigured, passwordProof, invitationHash, newSecret, encryptSecret, decryptSecret, totpCounter, enrollmentDisplay, newRecoveryCodes, recoveryHash } from './_mfa-crypto.js'
import { passwordVerify } from './_password.js'
import { reserveAttempt, securityEvent } from './_security.js'

const failure = 'Código inválido, expirado ou já utilizado.'
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value)

async function lockedChallenge(client, tokenHash) {
  const first = await client.query('SELECT user_id FROM buffet_mfa_challenges WHERE token_hash=$1',[tokenHash])
  if (!first.rowCount) return null
  const users = await client.query('SELECT * FROM buffet_users WHERE id=$1 FOR UPDATE',[first.rows[0].user_id])
  const rows = await client.query('SELECT *,expires_at>now() AS valid FROM buffet_mfa_challenges WHERE token_hash=$1 FOR UPDATE',[tokenHash])
  const user = users.rows[0], challenge = rows.rows[0]
  if (!user?.active || !challenge?.valid || challenge.attempts>=5 || challenge.mfa_version!==user.mfa_version ||
      challenge.password_proof!==passwordProof(user.id,user.password_hash)) return null
  return {user,challenge}
}
async function liveInvite(client,user,hash) {
  const rows=await client.query('SELECT * FROM buffet_mfa_invitations WHERE user_id=$1 AND token_hash=$2 AND expires_at>now() FOR UPDATE',[user.id,hash])
  const invite=rows.rows[0]
  return Boolean(invite && invite.mfa_version===user.mfa_version && invite.password_proof===passwordProof(user.id,user.password_hash))
}
async function fail(client,req,user,challenge) {
  await client.query('UPDATE buffet_mfa_challenges SET attempts=attempts+1 WHERE token_hash=$1',[challenge.token_hash])
  await securityEvent(client,req,'mfa_failure',user.id,{stage:challenge.stage})
}
async function addCodes(client,userId,codes) {
  await client.query('DELETE FROM buffet_mfa_recovery_codes WHERE user_id=$1',[userId])
  for (const code of codes) await client.query('INSERT INTO buffet_mfa_recovery_codes(user_id,code_hash) VALUES($1,$2)',[userId,recoveryHash(userId,code)])
}

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store')
  if (!safeOrigin(req)) return res.status(403).json({error:'Origem não autorizada.'})
  if (!sessionConfigured() || !mfaConfigured()) return res.status(503).json({error:'Acesso administrativo não configurado.'})
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Método não permitido.'})
  let client
  try {
    const sql=database(), action=req.body?.action
    if (req.method==='POST' && (action==='invite' || action==='regenerate_codes')) {
      const actor=await requireAdmin(req,res,action==='invite'?'admin':undefined)
      if (!actor) return
      if (typeof req.body?.password!=='string' || req.body.password.length>256 || typeof req.body?.code!=='string' || (action==='invite' && !uuid(req.body.targetId)))
        return res.status(400).json({error:'Dados inválidos.'})
      client=await sql.connect(); await client.query('BEGIN')
      const ids=action==='invite'?[actor.id,req.body.targetId]:[actor.id]
      const rows=await client.query('SELECT * FROM buffet_users WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',[ids])
      const user=rows.rows.find(r=>r.id===actor.id), target=rows.rows.find(r=>r.id===req.body.targetId)
      const sessionRow=await client.query('SELECT master_unlocked_until FROM buffet_sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now() AND mfa_version=$3 AND mfa_verified_at IS NOT NULL',
        [sessionTokenHash(req),actor.id,user?.mfa_version ?? -1])
      const blocked=await reserveAttempt(client,'mfa:'+actor.id,8)
      const counter=user?.mfa_secret && totpCounter(decryptSecret(user.id,user.mfa_secret),req.body.code,user.mfa_last_counter)
      const accepted=user?.active && user.mfa_enabled_at && sessionRow.rowCount && (action!=='invite' || user.role==='admin') && !blocked && Number.isSafeInteger(counter) && await passwordVerify(req.body.password,user.password_hash)
      if (!accepted) {
        await securityEvent(client,req,'mfa_failure',actor.id,{stage:action}); await client.query('COMMIT')
        return res.status(401).json({error:failure})
      }
      if (action==='invite' && (!target?.active || target.mfa_enabled_at || target.mfa_secret)) {
        await client.query('COMMIT'); return res.status(400).json({error:'Usuário indisponível ou já protegido.'})
      }
      await client.query('UPDATE buffet_users SET mfa_last_counter=$2 WHERE id=$1',[actor.id,counter])
      let payload, session
      if (action==='invite') {
        const token=randomBytes(24).toString('base64url'), hashed=invitationHash(target.id,token)
        await client.query(`INSERT INTO buffet_mfa_invitations(user_id,token_hash,password_proof,mfa_version,created_by,expires_at)
          VALUES($1,$2,$3,$4,$5,now()+interval '30 minutes') ON CONFLICT(user_id) DO UPDATE SET
          token_hash=EXCLUDED.token_hash,password_proof=EXCLUDED.password_proof,mfa_version=EXCLUDED.mfa_version,
          created_by=EXCLUDED.created_by,expires_at=EXCLUDED.expires_at,created_at=now()`,
        [target.id,hashed,passwordProof(target.id,target.password_hash),target.mfa_version,actor.id])
        await client.query("DELETE FROM buffet_mfa_challenges WHERE user_id=$1 AND stage='setup'",[target.id])
        await securityEvent(client,req,'mfa_invitation_issued',actor.id,{targetUserId:target.id})
        payload={invitation:token,expiresIn:1800}
      } else {
        const codes=newRecoveryCodes(), version=user.mfa_version+1
        await addCodes(client,user.id,codes)
        await client.query('UPDATE buffet_users SET mfa_version=$2 WHERE id=$1',[user.id,version])
        await client.query('DELETE FROM buffet_sessions WHERE user_id=$1',[user.id])
        await client.query('DELETE FROM buffet_mfa_challenges WHERE user_id=$1',[user.id])
        session=await createSession(client,user.id,user.password_hash,version,sessionRow.rows[0].master_unlocked_until)
        if (!session) throw new Error('Falha ao criar sessão.')
        await securityEvent(client,req,'mfa_recovery_codes_regenerated',user.id)
        payload={recoveryCodes:codes}
      }
      await client.query('DELETE FROM buffet_login_attempts WHERE ip=$1',['mfa:'+user.id])
      await client.query('COMMIT')
      if (session) setSessionCookie(res,session)
      return res.status(200).json(payload)
    }
    const tokenHash=challengeHash(req)
    if (!tokenHash) return res.status(401).json({error:'Entre novamente para continuar.'})
    client=await sql.connect(); await client.query('BEGIN')
    const locked=await lockedChallenge(client,tokenHash)
    if (!locked) {await client.query('ROLLBACK');clearChallengeCookie(res);return res.status(401).json({error:'Entre novamente para continuar.'})}
    const {user,challenge}=locked
    if (req.method==='GET') {
      if (challenge.stage==='setup' && challenge.auth_method==='invitation' && !(await liveInvite(client,user,challenge.invitation_hash))) {
        await client.query('DELETE FROM buffet_mfa_challenges WHERE token_hash=$1',[tokenHash]);await client.query('COMMIT')
        clearChallengeCookie(res);return res.status(401).json({error:'Convite expirado. Entre novamente.'})
      }
      const display=challenge.stage==='setup' ? await enrollmentDisplay(user.username,decryptSecret(user.id,challenge.pending_secret)) : {}
      await client.query('COMMIT');return res.status(200).json({stage:challenge.stage,username:user.username,...display})
    }
    if (await reserveAttempt(client,'mfa:'+user.id,8)) {
      await securityEvent(client,req,'mfa_throttled',user.id);await client.query('COMMIT')
      return res.status(429).json({error:'Muitas tentativas. Aguarde 15 minutos.'})
    }
    if (action==='activate' && challenge.stage==='invite') {
      const token=typeof req.body.invitation==='string'?req.body.invitation:''
      const invite=/^[A-Za-z0-9_-]{32}$/.test(token)?invitationHash(user.id,token):''
      if (user.mfa_secret || !(await liveInvite(client,user,invite))) {
        await fail(client,req,user,challenge);await client.query('COMMIT');return res.status(401).json({error:failure})
      }
      const pending=encryptSecret(user.id,newSecret())
      await client.query("UPDATE buffet_mfa_challenges SET stage='setup',auth_method='invitation',invitation_hash=$2,pending_secret=$3 WHERE token_hash=$1",[tokenHash,invite,pending])
      await client.query('COMMIT');return res.status(200).json({stage:'setup'})
    }
    if (action==='recover' && challenge.stage==='verify') {
      const code=recoveryHash(user.id,req.body.code)
      const available=code && await client.query('SELECT 1 FROM buffet_mfa_recovery_codes WHERE user_id=$1 AND code_hash=$2 AND used_at IS NULL',[user.id,code])
      if (!available?.rowCount) {await fail(client,req,user,challenge);await client.query('COMMIT');return res.status(401).json({error:failure})}
      await client.query("UPDATE buffet_mfa_challenges SET stage='setup',auth_method='recovery',pending_secret=$2,recovery_hash=$3 WHERE token_hash=$1",[tokenHash,encryptSecret(user.id,newSecret()),code])
      await client.query('COMMIT');return res.status(200).json({stage:'setup'})
    }
    if ((action==='enroll' && challenge.stage==='setup') || (action==='verify' && challenge.stage==='verify')) {
      const enrolling=action==='enroll'
      const factor=enrolling?challenge.pending_secret:user.mfa_secret
      const counter=factor ? totpCounter(decryptSecret(user.id,factor),req.body.code,enrolling?null:user.mfa_last_counter) : null
      const invitationOK=!enrolling || challenge.auth_method!=='invitation' || await liveInvite(client,user,challenge.invitation_hash)
      if (counter===null || !invitationOK) {await fail(client,req,user,challenge);await client.query('COMMIT');return res.status(401).json({error:failure})}
      if (enrolling && challenge.auth_method==='recovery') {
        const consumed=await client.query('UPDATE buffet_mfa_recovery_codes SET used_at=now() WHERE user_id=$1 AND code_hash=$2 AND used_at IS NULL RETURNING code_hash',[user.id,challenge.recovery_hash])
        if (!consumed.rowCount) {await fail(client,req,user,challenge);await client.query('COMMIT');return res.status(401).json({error:failure})}
        await securityEvent(client,req,'mfa_recovery_used',user.id)
      }
      let version=user.mfa_version, codes
      if (enrolling) {
        version++; codes=newRecoveryCodes();await addCodes(client,user.id,codes)
        await client.query('UPDATE buffet_users SET mfa_secret=$2,mfa_enabled_at=now(),mfa_version=$3,mfa_last_counter=$4 WHERE id=$1',[user.id,factor,version,counter])
        await client.query('DELETE FROM buffet_mfa_invitations WHERE user_id=$1',[user.id])
        await client.query('DELETE FROM buffet_sessions WHERE user_id=$1',[user.id])
      } else await client.query('UPDATE buffet_users SET mfa_last_counter=$2 WHERE id=$1',[user.id,counter])
      await client.query('DELETE FROM buffet_mfa_challenges WHERE user_id=$1',[user.id])
      await client.query('DELETE FROM buffet_login_attempts WHERE ip=$1 OR ip=$2',['mfa:'+user.id,'account:'+user.id])
      await client.query('UPDATE buffet_users SET last_login_at=now() WHERE id=$1',[user.id])
      const session=await createSession(client,user.id,user.password_hash,version)
      if (!session) throw new Error('Falha ao criar sessão.')
      await securityEvent(client,req,enrolling?'mfa_enrolled':'login_success',user.id)
      await client.query('COMMIT');clearChallengeCookie(res);setSessionCookie(res,session)
      return res.status(200).json({authenticated:true,...(codes?{recoveryCodes:codes}:{})})
    }
    await client.query('ROLLBACK');return res.status(400).json({error:'Operação inválida.'})
  } catch(error) {
    if (client) await client.query('ROLLBACK').catch(()=>{})
    console.error('mfa_error',error.message)
    return res.status(500).json({error:'Falha temporária de autenticação.'})
  } finally {client?.release()}
}
