import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import pg from 'pg'
import { createHash } from 'node:crypto'
import { canonicalHash, verifyAudit, sha256 } from '../api/_audit.js'
const parent = path.join(os.homedir(),'Documents','BuffetAkela')
const name = process.argv[2] || fs.readdirSync(parent).filter(n=>n.startsWith('migration-backup-')).sort().at(-1)
if(!name) throw Error('No migration backup')
const root = path.isAbsolute(name) ? name : path.join(parent,name)
const readJson = name => JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))
const env = fs.readFileSync('.env.local','utf8')
const envValue = key => env.match(new RegExp('^'+key+'=(.+)$','m'))?.[1]?.trim()?.replace(/^["']|["']$/g,'')
const auditKey = envValue('SIGNATURE_AUDIT_SECRET')
if(!auditKey||auditKey.length<32)throw Error('Audit key unavailable')
const manifest = readJson('recovery-manifest.json')
const snapshot = readJson('neon-snapshot.json')
const row = snapshot.tables.buffet_workspace.find(r=>r.id==='main')
if(!row?.data)throw Error('Missing workspace snapshot')
const events=row.data.events || []
const signed=events.filter(e=>e.contractStatus==='Assinado')
const files=manifest.files || []
if(signed.length!==manifest.verifiedContractCount || files.length!==signed.length*3)
 throw Error('Signed contract count differs from recovery manifest')
const digest = data => createHash('sha256').update(data).digest('hex')
for(const entry of files){
 if(!/^[a-zA-Z0-9/_-]+\.json$/.test(entry.pathname)||entry.pathname.includes('..'))throw Error('Invalid recovery key')
 const source=path.join(root,'reconstructed-blob',...entry.pathname.split('/'))
 const bytes=fs.readFileSync(source)
 if(bytes.length!==entry.bytes||digest(bytes)!==entry.sha256)throw Error('Recovery checksum mismatch')
}
let verified=0
for(const event of signed){
 if(!event.shareToken || !event.signature?.receipt)throw Error('Signed event missing token or audit')
 const token=event.shareToken, signature=event.signature
 const recovered=readJson('reconstructed-blob/contracts/'+token+'.json')
 if(recovered.token!==token || recovered.status!=='signed'||recovered.documentHash!==signature.documentHash)
  throw Error('Signed document identity mismatch')
 if(canonicalHash(recovered.document)!==signature.documentHash)
  throw Error('Signed document hash mismatch')
 if(!verifyAudit(signature.receipt,signature.auditHash,signature.auditSeal,auditKey))
  throw Error('Signed audit HMAC invalid')
 const pointer=readJson('reconstructed-blob/verification/'+signature.verificationCode+'.json')
 const pathToArchive='signed-archives/'+sha256(token)+'/'+signature.auditHash+'.json'
 if(pointer.archivePath!==pathToArchive||pointer.receiptHash!==signature.auditHash)
  throw Error('Verification pointer mismatch')
 const archive=readJson('reconstructed-blob/'+pathToArchive)
 if(archive.documentHash!==signature.documentHash || archive.signature.auditHash!==signature.auditHash)
  throw Error('Archive mismatch')
 verified++
}
const originalManifestPath=path.join(parent,'original-blob-backup-2026-10-03','original-blob-manifest.json')
const originalManifest=fs.existsSync(originalManifestPath) ? JSON.parse(fs.readFileSync(originalManifestPath,'utf8')) : null
if(originalManifest?.files?.length!==29)throw Error('Original 29-file backup manifest unavailable')
const extras=events.flatMap(e=>e.addenda||[])
const risk={verifiedSigned:verified,validatedFiles:files.length,
 clientCount:row.data.clients?.length||0,receiptCount:row.data.receipts?.length||0,
 eventCount:events.length,unsignedAddenda:extras.filter(a=>a.status!=='Assinado').length,
 signedAddenda:extras.filter(a=>a.status==='Assinado').length,
 originalPrivateBlobBackupCount:originalManifest.files.length,originalInvitationMetadataAvailableInOriginalBackup:true}
const uri=new URL(envValue('DATABASE_URL'))
uri.searchParams.set('sslmode','verify-full')
const database=new pg.Client({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000})
await database.connect()
try{
 const result=await database.query("SELECT data,revision FROM buffet_workspace WHERE id='main'")
 if(!result.rows.length)throw Error('Workspace missing in live Neon')
 if(Number(result.rows[0].revision)!==Number(row.revision) ||
  digest(Buffer.from(JSON.stringify(result.rows[0].data)))!==digest(Buffer.from(JSON.stringify(row.data))))
  throw Error('Neon changed since backup: fresh backup required')
 risk.liveNeonRevision=Number(result.rows[0].revision)
}finally{await database.end()}
console.log('RECOVERY_READINESS_PASS',JSON.stringify(risk))
