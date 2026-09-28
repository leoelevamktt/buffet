import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import pg from 'pg'
const env = fs.readFileSync('.env.local','utf8')
for (const name of ['DATABASE_URL','ADMIN_PASSWORD','ADMIN_SESSION_SECRET']) {
  const value=env.match(new RegExp('^'+name+'=(.+)$','m'))?.[1]?.trim()
  assert.ok(value,name+' missing')
  process.env[name]=value
}
const { default: session }=await import('../api/session.js')
const { default: workspace }=await import('../api/workspace.js')
const { isAdmin }=await import('../api/_session.js')
function response() {
  return { code:200,headers:{},body:null,
    setHeader(name,value){this.headers[name.toLowerCase()]=value;return this},
    status(value){this.code=value;return this},json(value){this.body=value;return this},
    end(){return this}}
}
const req=(method,cookie='',body={})=>({
  method,body,headers:{origin:'http://localhost:3148',host:'localhost:3148',
  'x-forwarded-host':'localhost:3148',cookie,'x-vercel-forwarded-for':'198.51.100.211'}
})
test('login cookie is httpOnly and verifies HMAC',async()=>{
  const bad=response()
  await session(req('GET'),bad)
  assert.equal(bad.code,200)
  assert.equal(bad.body.authenticated,false)
  const login=response()
  await session(req('POST','',{password:process.env.ADMIN_PASSWORD}),login)
  assert.equal(login.code,200)
  assert.equal(login.body.authenticated,true)
  const setCookie=login.headers['set-cookie']
  assert.match(setCookie,/HttpOnly/)
  assert.match(setCookie,/SameSite=Strict/)
  const cookie=setCookie.split(';')[0]
  assert.equal(isAdmin(req('GET',cookie)),true)
  assert.equal(isAdmin(req('GET',cookie+'edited')),false)
  const out=response()
  await session(req('DELETE',cookie),out)
  assert.equal(out.code,200)
  assert.match(out.headers['set-cookie'],/Max-Age=0/)
})
test('workspace rejects unauthenticated reads and writes',async()=>{
  for(const method of ['GET','POST','PUT']){
    const r=response()
    await workspace(req(method),r)
    assert.equal(r.code,401)
  }
})
test('workspace reads Neon and validates writes without mutating data',async()=>{
  const login=response();await session(req('POST','',{password:process.env.ADMIN_PASSWORD}),login)
  const cookie=login.headers['set-cookie'].split(';')[0]
  const read=response()
  await workspace(req('GET',cookie),read)
  assert.equal(read.code,200)
  assert.ok(Number.isSafeInteger(read.body.revision))
  const invalid=response()
  await workspace(req('PUT',cookie,{revision:1,data:{foo:'bar'}}),invalid)
  assert.equal(invalid.code,400)
  const originDenied=response()
  await workspace({...req('PUT',cookie,{revision:1,data:{}}),headers:{
    ...req('PUT',cookie).headers,origin:'https://untrusted.example'}},originDenied)
  assert.equal(originDenied.code,403)
})
test('Neon optimistic update rejects stale revisions inside rollback-only transaction',async()=>{
  const uri=new URL(process.env.DATABASE_URL)
  uri.searchParams.set('sslmode','verify-full')
  const client=new pg.Client({connectionString:uri.toString(),ssl:{rejectUnauthorized:true}})
  await client.connect()
  try {
    await client.query('BEGIN')
    const id='test-'+Math.random().toString(36).slice(2)
    await client.query('INSERT INTO buffet_workspace(id,data,revision) VALUES($1,$2::jsonb,1)',[id,JSON.stringify({events:[]})])
    const stale=await client.query('UPDATE buffet_workspace SET revision=revision+1 WHERE id=$1 AND revision=999 RETURNING revision',[id])
    assert.equal(stale.rowCount,0)
    const updated=await client.query('UPDATE buffet_workspace SET revision=revision+1 WHERE id=$1 AND revision=1 RETURNING revision',[id])
    assert.equal(Number(updated.rows[0].revision),2)
    await client.query('ROLLBACK')
  } finally {await client.end()}
})
