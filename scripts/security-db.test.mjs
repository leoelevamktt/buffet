import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomBytes,randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

test('authentication security in a private disposable PostgreSQL schema',{skip:!process.env.SECURITY_TEST_DATABASE_URL,timeout:60000},async(t)=>{
  process.env.DATABASE_URL=process.env.SECURITY_TEST_DATABASE_URL
  process.env.ADMIN_SESSION_SECRET=randomBytes(32).toString('hex')
  process.env.VERCEL_ENV='production'
  const {database}=await import('../api/_db.js')
  const {passwordHash}=await import('../api/_password.js')
  const {default:session}=await import('../api/session.js')
  const {createSession,getSession,requireAdmin}=await import('../api/_session.js')
  const pool=database(),originalConnect=pool.connect.bind(pool),originalQuery=pool.query.bind(pool)
  const schema='akela_security_test_'+randomBytes(8).toString('hex')
  const backends=new Set()
  let issuancePid,holdIssuance
  // Each API query gets a real transaction. Omitting public from search_path prevents access to live tables.
  const query=async(text,values)=>{
    const db=await originalConnect()
    try {
      await db.query('BEGIN')
      await db.query(`SET LOCAL search_path TO ${schema},pg_catalog`)
      const pid=(await db.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
      backends.add(pid)
      if(text.includes('INSERT INTO buffet_sessions'))issuancePid=pid
      const result=await db.query(text,values)
      if(text.includes('INSERT INTO buffet_sessions') && holdIssuance)await holdIssuance(db)
      await db.query('COMMIT')
      return result
    } catch(error){await db.query('ROLLBACK');throw error}
    finally{db.release()}
  }
  const response=()=>({code:200,headers:{},body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},status(n){this.code=n;return this},json(b){this.body=b;return this}})
  const request=(username,password,ip)=>({method:'POST',url:'/api/session',body:{username,password},headers:{host:'localhost',origin:'https://localhost','x-vercel-forwarded-for':ip}})
  const login=async(username,pass,ip)=>{const res=response();await session(request(username,pass,ip),res);return res}
  const userId=randomUUID(),password='Temporary!Security#Test2026',encoded=await passwordHash(password)
  try {
    await originalQuery(`CREATE SCHEMA ${schema}`)
    pool.query=query
    await query(await readFile(new URL('./neon-schema.sql',import.meta.url),'utf8'))
    await query("INSERT INTO buffet_users(id,username,name,email,role,password_hash) VALUES($1,'testadmin','Temporary','test@example.invalid','admin',$2)",[userId,encoded])

    await t.test('a password reset blocks concurrent issuance using the previous password',async()=>{
      const reset=await originalConnect()
      let issuance,waited=false,settled=false
      issuancePid=undefined
      try {
        await reset.query('BEGIN')
        await reset.query(`SET LOCAL search_path TO ${schema},pg_catalog`)
        await reset.query('UPDATE buffet_users SET password_hash=$2 WHERE id=$1',[userId,await passwordHash(password+'changed')])
        await reset.query('DELETE FROM buffet_sessions WHERE user_id=$1',[userId])
        issuance=createSession(response(),userId,encoded).finally(()=>{settled=true})
        for(let i=0;i<100&&!settled;i++) {
          if(issuancePid){
            const activity=await reset.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[issuancePid])
            if(activity.rows[0]?.wait_event_type==='Lock'){waited=true;break}
          }
          await delay(20)
        }
        await reset.query('COMMIT')
      } finally {try{await reset.query('ROLLBACK')}finally{reset.release()}}
      assert.equal(await issuance,false)
      assert.equal(waited,true,'Session issuance must wait for the concurrent password-reset transaction')
      assert.equal((await query('SELECT count(*)::int AS n FROM buffet_sessions')).rows[0].n,0)
      await query('UPDATE buffet_users SET password_hash=$2 WHERE id=$1',[userId,encoded])
    })

    await t.test('a concurrent password reset waits for an earlier session issuance and revokes it',async()=>{
      let releaseIssue,reportInserted,heldDb,waited=false,finished=false
      const gate=new Promise(resolve=>{releaseIssue=resolve})
      const inserted=new Promise(resolve=>{reportInserted=resolve})
      holdIssuance=async(db)=>{heldDb=db;reportInserted();await gate}
      const issuance=createSession(response(),userId,encoded)
      let reset,resetting,outcomes
      try {
        await Promise.race([inserted,issuance.then(()=>{throw Error('Issuance ended before the transaction barrier')})])
        reset=await originalConnect()
        await reset.query('BEGIN')
        await reset.query(`SET LOCAL search_path TO ${schema},pg_catalog`)
        const pid=(await reset.query('SELECT pg_backend_pid() AS pid')).rows[0].pid
        const nextHash=await passwordHash(password+'changed')
        resetting=(async()=>{
          await reset.query('UPDATE buffet_users SET password_hash=$2 WHERE id=$1',[userId,nextHash])
          await reset.query('DELETE FROM buffet_sessions WHERE user_id=$1',[userId])
          await reset.query('COMMIT');finished=true
        })()
        for(let i=0;i<100&&!finished;i++){
          if((await heldDb.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0]?.wait_event_type==='Lock'){waited=true;break}
          await delay(20)
        }
      } finally {
        releaseIssue();holdIssuance=null
        outcomes=await Promise.allSettled([issuance,resetting].filter(Boolean))
        if(reset){try{await reset.query('ROLLBACK')}finally{reset.release()}}
      }
      for(const outcome of outcomes)if(outcome.status==='rejected')throw outcome.reason
      assert.equal(waited,true,'The reset must wait until earlier session issuance commits')
      assert.equal((await query('SELECT count(*)::int AS n FROM buffet_sessions')).rows[0].n,0)
      await query('UPDATE buffet_users SET password_hash=$2 WHERE id=$1',[userId,encoded])
    })

    await t.test('a single account is throttled across different IPs and username/email aliases',async()=>{
      await query('TRUNCATE buffet_login_attempts')
      for(let i=0;i<8;i++)await login(i%2?'testadmin':'test@example.invalid','wrong','198.51.100.'+(i+1))
      assert.equal((await login('testadmin',password,'198.51.100.99')).code,429)
    })
    await t.test('simultaneous connections cannot exceed the account attempt budget',async()=>{
      await query('TRUNCATE buffet_login_attempts')
      backends.clear()
      const results=await Promise.all(Array.from({length:16},(_,i)=>login('testadmin','wrong','203.0.113.'+(i+1))))
      assert.ok(backends.size>=2,'The test must use more than one PostgreSQL backend')
      assert.ok(results.filter(r=>r.code===401).length<=8)
      assert.ok(results.some(r=>r.code===429))
    })
    await t.test('successful login uses a host-only cookie and persists safe audit records',async()=>{
      await query('TRUNCATE buffet_login_attempts,buffet_sessions')
      const res=await login('testadmin',password,'198.51.100.100')
      assert.equal(res.code,200)
      assert.match(res.headers['set-cookie'],/^__Host-akela_session=/)
      assert.match(res.headers['set-cookie'],/Secure/)
      assert.doesNotMatch(res.headers['set-cookie'],/Domain=/i)
      const req={method:'GET',url:'/api/workspace',headers:{cookie:res.headers['set-cookie'].split(';')[0],'x-vercel-forwarded-for':'198.51.100.100'}}
      assert.equal((await getSession(req)).id,userId)
      assert.equal((await requireAdmin(req,response())).id,userId)
      const records=(await query('SELECT event,details FROM buffet_security_events')).rows
      assert.ok(records.some(r=>r.event==='login_success'))
      assert.ok(records.some(r=>r.event==='login_failure'))
      assert.ok(records.some(r=>r.event==='admin_request'))
      assert.ok(!JSON.stringify(records).includes(password))
    })
  } finally {
    pool.query=originalQuery
    await originalQuery(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await pool.end()
  }
})
