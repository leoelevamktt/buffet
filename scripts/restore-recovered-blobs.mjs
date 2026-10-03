import fs from 'node:fs'
import path from 'node:path'
import { get, put } from '@vercel/blob'
import { createHash } from 'node:crypto'
const directory=process.argv[2]
const envFile=process.argv[3]
if(!directory||!envFile)throw Error('Usage: node scripts/restore-recovered-blobs.mjs <backup-dir> <new-vercel-env-file>')
const manifest=JSON.parse(fs.readFileSync(path.join(directory,'recovery-manifest.json'),'utf8'))
const env=fs.readFileSync(envFile,'utf8')
const token=env.match(/^BLOB_READ_WRITE_TOKEN=(.*)$/m)?.[1]?.trim()?.replace(/^["']|["']$/g,'')
if(!token)throw Error('The NEW private Blob token was not found; STOP before deployment.')
if(manifest.verifiedContractCount!==4||manifest.files.length!==12)throw Error('Verified recovery manifest incomplete')
const sha=(data)=>createHash('sha256').update(data).digest('hex')
let restored=0
for(const entry of manifest.files){
  if(!/^[a-zA-Z0-9/_-]+\.json$/.test(entry.pathname)||entry.pathname.includes('..'))throw Error('Unsafe pathname')
  const source=path.join(directory,'reconstructed-blob',...entry.pathname.split('/'))
  const expected=fs.readFileSync(source)
  if(sha(expected)!==entry.sha256)throw Error('Local recovery checksum mismatch')
  const previous=await get(entry.pathname,{access:'private',token,useCache:false}).catch(()=>null)
  if(previous?.statusCode===200){
    const found=Buffer.from(await new Response(previous.stream).arrayBuffer())
    if(sha(found)!==entry.sha256)throw Error('Existing Blob has different content: '+entry.pathname)
  }else{
    await put(entry.pathname,expected,{access:'private',token,
      addRandomSuffix:false,contentType:'application/json'})
    const actual=await get(entry.pathname,{access:'private',token,useCache:false})
    if(actual?.statusCode!==200)throw Error('Uploaded Blob not readable')
    const found=Buffer.from(await new Response(actual.stream).arrayBuffer())
    if(sha(found)!==entry.sha256)throw Error('Uploaded Blob checksum mismatch')
  }
  restored++
  if(restored%3===0)console.log('VERIFIED_SIGNED_CONTRACTS='+restored/3+'/4')
}
console.log('RECOVERY_RESTORE_PASS='+restored+'/12')
