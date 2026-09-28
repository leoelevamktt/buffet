import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import pg from 'pg'
const env=fs.readFileSync('.env.local','utf8')
for(const name of ['DATABASE_URL','ADMIN_PASSWORD','ADMIN_SESSION_SECRET']) {
  const value=env.match(new RegExp('^'+name+'=(.+)$','m'))?.[1]?.trim()
  assert.ok(value,name+' is missing')
  process.env[name]=value
}
const { default:session }=await import('../api/session.js')
const { default:workspace }=await import('../api/workspace.js')
const { default:users }=await import('../api/users.js')
const { default:profile }=await import('../api/profile.js')
const { getSession }=await import('../api/_session.js')
const { database }=await import('../api/_db.js')
function response(){
  return {code:200,headers:{},body:null,
    setHeader(name,value){this.headers[name.toLowerCase()]=value;return this},
    status(value){this.code=value;return this},
    json(value){this.body=value;return this},end(){return this}}
}
const req=(method,cookie='',body={},ip='198.51.100.241')=>({
 method,body,headers:{origin:'http://localhost:3148',host:'localhost:3148',
 'x-forwarded-host':'localhost:3148',cookie,'x-vercel-forwarded-for':ip}
})
async function call(handler,method,cookie='',body={},ip){
 const res=response();await handler(req(method,cookie,body,ip),res);return res
}
async function login(username,password,ip){
 const res=await call(session,'POST','',{username,password},ip)
 return {res,cookie:res.headers['set-cookie']?.split(';')[0]}
}
const adminIp='198.51.100.241'
const admin=await login('admin',process.env.ADMIN_PASSWORD,adminIp)
assert.equal(admin.res.code,200,'The seeded admin must be able to log in')
assert.equal(admin.res.body.user.role,'admin')
test('individual admin login creates protected cookie; logout revokes it',async()=>{
 const anon=await call(session,'GET')
 assert.equal(anon.body.authenticated,false)
 assert.match(admin.res.headers['set-cookie'],/HttpOnly/)
 assert.match(admin.res.headers['set-cookie'],/SameSite=Strict/)
 const current=await getSession(req('GET',admin.cookie))
 assert.equal(current.username,'admin')
 assert.equal(await getSession(req('GET',admin.cookie+'tampered')),null)
 const second=await login('admin',process.env.ADMIN_PASSWORD,'198.51.100.242')
 assert.equal(second.res.code,200)
 const loggedOut=await call(session,'DELETE',second.cookie)
 assert.equal(loggedOut.code,200)
 assert.match(loggedOut.headers['set-cookie'],/Max-Age=0/)
 assert.equal(await getSession(req('GET',second.cookie)),null)
})
test('unauthenticated requests cannot access user records or workspace',async()=>{
 for(const handler of [users,workspace]){
  for(const method of ['GET','POST','PUT']){
   const result=await call(handler,method)
   assert.equal(result.code,401)
  }
 }
})
test('admin can read workspace and invalid writes are rejected',async()=>{
 const result=await call(workspace,'GET',admin.cookie)
 assert.equal(result.code,200)
 assert.ok(Number.isSafeInteger(result.body.revision))
 const bad=await call(workspace,'PUT',admin.cookie,{revision:1,data:{foo:'bar'}})
 assert.equal(bad.code,400)
 const originDenied=response()
 await workspace({...req('PUT',admin.cookie),headers:{...req('PUT',admin.cookie).headers,
  origin:'https://untrusted.example'}},originDenied)
 assert.equal(originDenied.code,403)
})
test('admin manages operators, role restrictions, revocation and last administrator',async()=>{
 const sql=database()
 const userName='qauser'+Date.now()
 const initialPassword='Test#8xV1Y42Admin'
 const newPassword='Test#8xV1Y43Rotate'
 let id
 try{
  const created=await call(users,'POST',admin.cookie,{
   username:userName,name:'Operador QA',email:userName+'@example.invalid',
   role:'operador',password:initialPassword
  })
  assert.equal(created.code,201,JSON.stringify(created.body))
  id=created.body.user.id
  assert.equal(created.body.user.password_hash,undefined)
  const duplicate=await call(users,'POST',admin.cookie,{
   username:userName,name:'Outro QA',email:'other@example.invalid',
   role:'operador',password:initialPassword
  })
  assert.equal(duplicate.code,409)
  const operator=await login(userName,initialPassword,'198.51.100.243')
  assert.equal(operator.res.code,200)
  assert.equal(operator.res.body.user.role,'operador')
  const staffDenied=await call(users,'GET',operator.cookie)
  assert.equal(staffDenied.code,403)
  const staffWorkspace=await call(workspace,'GET',operator.cookie)
  assert.equal(staffWorkspace.code,200)
  const selfEscalation=await call(users,'PATCH',operator.cookie,{
   id,name:'Operador QA',role:'admin',active:true,email:userName+'@example.invalid'
  })
  assert.equal(selfEscalation.code,403)
  const lastAdmin=await call(users,'PATCH',admin.cookie,{
   id:admin.res.body.user.id,name:'Administrador',email:'',
   role:'operador',active:true
  })
  assert.equal(lastAdmin.code,400)
  const renamed=await call(users,'PATCH',admin.cookie,{
   id,name:'Operador Renovado',email:userName+'@example.invalid',
   role:'operador',active:true,password:newPassword
  })
  assert.equal(renamed.code,200)
  assert.equal(await getSession(req('GET',operator.cookie)),null)
  const old=await login(userName,initialPassword,'198.51.100.244')
  assert.equal(old.res.code,401)
  const renewed=await login(userName,newPassword,'198.51.100.245')
  assert.equal(renewed.res.code,200)
  const selfReset=await call(profile,'PATCH',renewed.cookie,{
   currentPassword:newPassword,newPassword:initialPassword
  })
  assert.equal(selfReset.code,200)
  assert.equal(await getSession(req('GET',renewed.cookie)),null)
  const restored=await login(userName,initialPassword,'198.51.100.246')
  assert.equal(restored.res.code,200)
  const disabled=await call(users,'PATCH',admin.cookie,{
   id,name:'Operador Renovado',email:userName+'@example.invalid',
   role:'operador',active:false
  })
  assert.equal(disabled.code,200)
  assert.equal(await getSession(req('GET',restored.cookie)),null)
  const denied=await login(userName,initialPassword,'198.51.100.247')
  assert.equal(denied.res.code,401)
  const listed=await call(users,'GET',admin.cookie)
  assert.equal(listed.code,200)
  assert.ok(listed.body.users.some(u=>u.id===id&&!u.active))
  assert.ok(listed.body.users.every(u=>!Object.hasOwn(u,'password_hash')))
 } finally {
  if(id)await sql.query('DELETE FROM buffet_users WHERE id=$1',[id])
  await sql.query("DELETE FROM buffet_login_attempts WHERE ip LIKE '198.51.100.24%'")
 }
})
test('Neon optimistic revision protection works inside a rollback transaction',async()=>{
 const client=await database().connect()
 try{
  await client.query('BEGIN')
  const id='test-'+Math.random().toString(36).slice(2)
  await client.query('INSERT INTO buffet_workspace(id,data,revision) VALUES($1,$2::jsonb,1)',[id,JSON.stringify({events:[]})])
  const stale=await client.query('UPDATE buffet_workspace SET revision=revision+1 WHERE id=$1 AND revision=999 RETURNING revision',[id])
  assert.equal(stale.rowCount,0)
  const changed=await client.query('UPDATE buffet_workspace SET revision=revision+1 WHERE id=$1 AND revision=1 RETURNING revision',[id])
  assert.equal(Number(changed.rows[0].revision),2)
 } finally {
  await client.query('ROLLBACK').catch(()=>{})
  client.release()
 }
})
