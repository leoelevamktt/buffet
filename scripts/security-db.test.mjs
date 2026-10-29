import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomBytes, randomUUID } from 'node:crypto'

test('password attempts are limited across aliases and IP addresses in an isolated schema',{skip:!process.env.SECURITY_TEST_DATABASE_URL,timeout:60000},async()=>{
  process.env.DATABASE_URL=process.env.SECURITY_TEST_DATABASE_URL
  process.env.ADMIN_SESSION_SECRET=randomBytes(32).toString('hex')
  process.env.MFA_ENCRYPTION_KEY=randomBytes(32).toString('hex')
  const {database}=await import('../api/_db.js')
  const {passwordHash}=await import('../api/_password.js')
  const {default:session}=await import('../api/session.js')
  const pool=database(),connect=pool.connect.bind(pool),query=pool.query.bind(pool)
  const schema='akela_security_test_'+randomBytes(8).toString('hex')
  const response=()=>({code:200,headers:{},body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},getHeader(k){return this.headers[k.toLowerCase()]},status(n){this.code=n;return this},json(b){this.body=b;return this}})
  const login=async(username,password,ip)=>{const res=response();await session({method:'POST',url:'/api/session',body:{username,password},headers:{host:'localhost',origin:'https://localhost','x-vercel-forwarded-for':ip}},res);return res}
  const password='Temporary!Security#Test2026'
  try {
    await query(`CREATE SCHEMA ${schema}`)
    pool.query=async(text,values)=>{const db=await connect();try{await db.query('BEGIN');await db.query(`SET LOCAL search_path TO ${schema},pg_catalog`);const result=await db.query(text,values);await db.query('COMMIT');return result}catch(error){await db.query('ROLLBACK');throw error}finally{db.release()}}
    await pool.query(await readFile(new URL('./neon-schema.sql',import.meta.url),'utf8'))
    await pool.query("INSERT INTO buffet_users(id,username,name,email,role,password_hash) VALUES($1,'testadmin','Temporary','test@example.invalid','admin',$2)",[randomUUID(),await passwordHash(password)])
    for(let i=0;i<8;i++)await login(i%2?'testadmin':'test@example.invalid','wrong','198.51.100.'+(i+1))
    assert.equal((await login('testadmin',password,'198.51.100.99')).code,429)
    await pool.query('TRUNCATE buffet_login_attempts')
    const results=await Promise.all(Array.from({length:16},(_,i)=>login('testadmin','wrong','203.0.113.'+(i+1))))
    assert.ok(results.filter(r=>r.code===401).length<=8)
    assert.ok(results.some(r=>r.code===429))
    const records=(await pool.query('SELECT event,details FROM buffet_security_events')).rows
    assert.ok(records.some(r=>r.event==='login_failure'))
    assert.ok(!JSON.stringify(records).includes(password))
  } finally {pool.query=query;pool.connect=connect;await query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await pool.end()}
})
