import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomBytes, randomUUID } from 'node:crypto'
import * as OTPAuth from 'otpauth'

test('MFA and master authorization in a disposable isolated database schema',{skip:!process.env.SECURITY_TEST_DATABASE_URL,timeout:120000},async()=>{
  process.env.DATABASE_URL=process.env.SECURITY_TEST_DATABASE_URL
  process.env.ADMIN_SESSION_SECRET=randomBytes(32).toString('hex')
  process.env.MFA_ENCRYPTION_KEY=randomBytes(32).toString('hex')
  process.env.VERCEL_ENV='production'
  const {database}=await import('../api/_db.js')
  const {passwordHash}=await import('../api/_password.js')
  const {invitationHash,passwordProof}=await import('../api/_mfa-crypto.js')
  const {default:session}=await import('../api/session.js')
  const mfa=(req,res)=>session({...req,query:{flow:'mfa'}},res)
  const master=(req,res)=>session({...req,query:{flow:'master'}},res)
  const {default:workspace}=await import('../api/workspace.js')
  const {default:users}=await import('../api/users.js')
  const pool=database(),connect=pool.connect.bind(pool),query=pool.query.bind(pool)
  const schema='akela_mfa_test_'+randomBytes(8).toString('hex')
  const response=()=>({code:200,headers:{},body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},getHeader(k){return this.headers[k.toLowerCase()]},status(n){this.code=n;return this},json(b){this.body=b;return this}})
  const call=async(handler,method,body={},cookie='')=>{const res=response();await handler({method,body,url:'/test',headers:{cookie,host:'localhost',origin:'https://localhost','x-vercel-forwarded-for':'192.0.2.10'}},res);return res}
  const cookie=(res,name)=>{const headers=[res.headers['set-cookie']].flat().filter(Boolean);return headers.find(h=>h.startsWith(name+'='))?.split(';')[0]}
  const username='sample',password='Temporary!Security#Test2026',userId=randomUUID(),encoded=await passwordHash(password)
  try {
    await query(`CREATE SCHEMA ${schema}`)
    pool.connect=async()=>{
      const db=await connect()
      return {query:async(text,values)=>{const result=await db.query(text,values);if(text==='BEGIN')await db.query(`SET LOCAL search_path TO ${schema},pg_catalog`);return result},release:()=>db.release()}
    }
    pool.query=async(text,values)=>{const db=await connect();try{await db.query('BEGIN');await db.query(`SET LOCAL search_path TO ${schema},pg_catalog`);const result=await db.query(text,values);await db.query('COMMIT');return result}catch(error){await db.query('ROLLBACK');throw error}finally{db.release()}}
    await pool.query(await readFile(new URL('./neon-schema.sql',import.meta.url),'utf8'))
    await pool.query("INSERT INTO buffet_users(id,username,name,role,password_hash) VALUES($1,$2,'Sample','admin',$3)",[userId,username,encoded])
    const initial=await call(session,'POST',{username,password})
    assert.equal(initial.code,200);assert.equal(initial.body.authenticated,false);assert.equal(initial.body.mfaStage,'invite')
    const preauth=cookie(initial,'__Host-akela_preauth');assert.ok(preauth)
    assert.equal(cookie(initial,'__Host-akela_session'),undefined)
    assert.equal((await call(workspace,'GET',{},preauth)).code,401)
    assert.equal((await call(mfa,'GET',{},preauth)).body.secret,undefined)
    assert.equal((await call(mfa,'POST',{action:'activate',invitation:'x'.repeat(32)},preauth)).code,401)
    const invite=randomBytes(24).toString('base64url')
    await pool.query("INSERT INTO buffet_mfa_invitations(user_id,token_hash,password_proof,mfa_version,expires_at) VALUES($1,$2,$3,0,now()+interval '30 minutes')",[userId,invitationHash(userId,invite),passwordProof(userId,encoded)])
    assert.equal((await call(mfa,'POST',{action:'activate',invitation:invite},preauth)).body.stage,'setup')
    const setup=await call(mfa,'GET',{},preauth);assert.match(setup.body.qrImage,/^data:image\/png/)
    const otp=new OTPAuth.TOTP({secret:setup.body.secret,digits:6,period:30})
    const enrolled=await call(mfa,'POST',{action:'enroll',code:otp.generate({timestamp:Date.now()-30000})},preauth)
    assert.equal(enrolled.code,200);assert.equal(enrolled.body.recoveryCodes.length,8)
    const oldSession=cookie(enrolled,'__Host-akela_session');assert.ok(oldSession)
    assert.equal((await call(workspace,'GET',{},oldSession)).code,403)
    process.env.MASTER_PASSWORD_HASH=await passwordHash('Master!Temporary2026')
    assert.equal((await call(master,'POST',{password:'wrong'},oldSession)).code,401)
    assert.equal((await call(master,'POST',{password:'Master!Temporary2026'},oldSession)).code,200)
    assert.equal((await call(workspace,'GET',{},oldSession)).code,200)
    const accounts=await call(users,'GET',{},oldSession)
    assert.equal(accounts.code,200);assert.equal(accounts.body.users[0].password_hash,undefined)
    assert.equal(accounts.body.users[0].mfa_secret,undefined)
    const first=await call(session,'POST',{username,password})
    const second=await call(session,'POST',{username,password})
    const a=cookie(first,'__Host-akela_preauth'),b=cookie(second,'__Host-akela_preauth')
    const current=otp.generate()
    const results=await Promise.all([call(mfa,'POST',{action:'verify',code:current},a),call(mfa,'POST',{action:'verify',code:current},b)])
    assert.deepEqual(results.map(r=>r.code).sort(),[200,401])
    const freshSession=cookie(results.find(r=>r.code===200),'__Host-akela_session')
    assert.equal((await call(workspace,'GET',{},freshSession)).code,403)
    const targetId=randomUUID(),targetPass='Target!Temporary2026',targetHash=await passwordHash(targetPass)
    await pool.query("INSERT INTO buffet_users(id,username,name,role,password_hash) VALUES($1,'target','Target','operador',$2)",[targetId,targetHash])
    const issued=await call(mfa,'POST',{action:'invite',targetId,password,code:otp.generate({timestamp:Date.now()+30000})},freshSession)
    assert.equal(issued.code,200)
    const targetLogin=await call(session,'POST',{username:'target',password:targetPass})
    const targetCookie=cookie(targetLogin,'__Host-akela_preauth')
    assert.equal((await call(mfa,'POST',{action:'activate',invitation:issued.body.invitation},targetCookie)).code,200)
    const targetSetup=await call(mfa,'GET',{},targetCookie)
    assert.ok(targetSetup.body.secret)
    const replacement=randomBytes(24).toString('base64url')
    await pool.query('UPDATE buffet_mfa_invitations SET token_hash=$2 WHERE user_id=$1',[targetId,invitationHash(targetId,replacement)])
    const targetOtp=new OTPAuth.TOTP({secret:targetSetup.body.secret,digits:6,period:30})
    assert.equal((await call(mfa,'POST',{action:'enroll',code:targetOtp.generate()},targetCookie)).code,401)
    assert.equal((await pool.query('SELECT mfa_enabled_at FROM buffet_users WHERE id=$1',[targetId])).rows[0].mfa_enabled_at,null)
    await pool.query('UPDATE buffet_users SET password_hash=$2 WHERE id=$1',[targetId,await passwordHash(targetPass+'changed')])
    assert.equal((await call(mfa,'GET',{},targetCookie)).code,401)
    const recoveryCode=enrolled.body.recoveryCodes[0]
    const recoverLogin1=await call(session,'POST',{username,password})
    const recoverLogin2=await call(session,'POST',{username,password})
    const c=cookie(recoverLogin1,'__Host-akela_preauth'),d=cookie(recoverLogin2,'__Host-akela_preauth')
    assert.equal((await call(mfa,'POST',{action:'recover',code:recoveryCode},c)).code,200)
    assert.equal((await call(mfa,'POST',{action:'recover',code:recoveryCode},d)).code,200)
    const setupC=await call(mfa,'GET',{},c),setupD=await call(mfa,'GET',{},d)
    const codeC=new OTPAuth.TOTP({secret:setupC.body.secret,digits:6,period:30}).generate()
    const codeD=new OTPAuth.TOTP({secret:setupD.body.secret,digits:6,period:30}).generate()
    const recoveryResults=await Promise.all([call(mfa,'POST',{action:'enroll',code:codeC},c),call(mfa,'POST',{action:'enroll',code:codeD},d)])
    assert.deepEqual(recoveryResults.map(r=>r.code).sort(),[200,401])
    assert.equal((await call(workspace,'GET',{},oldSession)).code,401)
    const audit=await pool.query('SELECT details FROM buffet_security_events')
    assert.ok(!JSON.stringify(audit.rows).includes(invite));assert.ok(!JSON.stringify(audit.rows).includes(password))
  } finally {
    pool.query=query;pool.connect=connect
    await query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await pool.end()
  }
})
