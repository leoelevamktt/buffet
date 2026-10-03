import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
const url=process.argv[2]
const backup=process.argv[3]
if(!/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(url)||!backup)throw Error('Specify verified HTTPS deployment and backup folder.')
const env=fs.readFileSync('.env.local','utf8')
const connection=env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim()
if(!connection)throw Error('DATABASE_URL unavailable')
const client=new pg.Client({connectionString:connection,ssl:{rejectUnauthorized:true}})
await client.connect()
try{
 await client.query('BEGIN')
 const result=await client.query("SELECT data,revision FROM buffet_workspace WHERE id='main' FOR UPDATE")
 const old=result.rows[0]
 if(!old)throw Error('No workspace found')
 fs.writeFileSync(path.join(backup,'neon-before-new-links.json'),JSON.stringify(old,null,2),{flag:'wx',mode:0o600})
 const data=old.data
 let links=0,drafts=0
 for(const event of data.events||[]){
  if(event.contractStatus==='Assinado'&&event.shareToken){
   if(!event.legacyShareUrl)event.legacyShareUrl=event.shareUrl||null
   event.shareUrl=url+'/assinar/'+event.shareToken
   links++
  }
  for(const addendum of event.addenda||[]){
   if(addendum.status==='Enviado'&&addendum.shareToken){
     addendum.legacyShareUrl=addendum.legacyShareUrl||addendum.shareUrl||null
     addendum.status='Rascunho'
     delete addendum.shareToken
     delete addendum.shareUrl
     delete addendum.sharedAt
     drafts++
   }
  }
 }
 const updated=await client.query("UPDATE buffet_workspace SET data=$1::jsonb,revision=revision+1,updated_at=now() WHERE id='main' AND revision=$2 RETURNING revision",[JSON.stringify(data),old.revision])
 if(!updated.rowCount)throw Error('Concurrent update detected')
 await client.query('COMMIT')
 console.log('NEON_URL_MIGRATION_OK',{contractLinks:links,expiredUnsignedAddendaResetToDraft:drafts,revision:Number(updated.rows[0].revision)})
}catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
finally{await client.end()}
