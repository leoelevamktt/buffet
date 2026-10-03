
/**
 * Disaster recovery when private Blob is unavailable and signed snapshots survive in Neon.
 * Generates reconstructed records ONLY after verifying the original document SHA-256,
 * signature image SHA-256, HMAC audit seal, and hashed source token.
 * No remote writes. Use restore-recovered-blobs.mjs once a new private store is connected.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { canonicalHash, signedDocumentPayload, verifyAudit, sha256 } from '../api/_audit.js'
const project=process.cwd()
const env=fs.readFileSync(path.join(project,'.env.local'),'utf8')
const auditKey=env.match(/^SIGNATURE_AUDIT_SECRET=(.+)$/m)?.[1]?.trim()
if(!auditKey || auditKey.length<32)throw Error('SIGNATURE_AUDIT_SECRET is missing locally')
const defaultParent=path.join(os.homedir(),'Documents','BuffetAkela')
const defaultFolder=fs.readdirSync(defaultParent).filter(x=>x.startsWith('migration-backup-')).sort().at(-1)
const root=process.argv[2] || path.join(defaultParent,defaultFolder)
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'neon-snapshot.json'),'utf8'))
const workspace=snapshot.tables.buffet_workspace?.find(r=>r.id==='main')?.data
if(!workspace)throw Error('Main workspace backup not found')
const output=path.join(root,'reconstructed-blob')
fs.mkdirSync(output,{recursive:true})
const results=[]
const save=(key,object)=>{
  if(key.includes('..') || !/^[a-zA-Z0-9/_-]+\.json$/.test(key))throw Error('Unsafe key')
  const target=path.join(output,...key.split('/'))
  fs.mkdirSync(path.dirname(target),{recursive:true})
  fs.writeFileSync(target,JSON.stringify(object),{flag:'wx',mode:0o600})
  return {pathname:key,bytes:fs.statSync(target).size,
    sha256:createHash('sha256').update(fs.readFileSync(target)).digest('hex')}
}
for(const [index,event] of workspace.events.entries()){
  if(event.contractStatus!=='Assinado')continue
  const sig=event.signature,token=event.shareToken
  if(!sig?.receipt || typeof token!=='string' || token.length<20)throw Error('Signed event '+index+': missing original token or receipt')
  if(sig.receipt.contractTokenHash && sig.receipt.contractTokenHash!==sha256(token))
    throw Error('Signed event '+index+': token hash mismatch')
  if(!verifyAudit(sig.receipt,sig.auditHash,sig.auditSeal,auditKey))
    throw Error('Signed event '+index+': invalid HMAC')
  const png=String(sig.dataUrl||'')
  if(png.startsWith('data:image/png;base64,')){
    const imageHash=sha256(Buffer.from(png.slice(22),'base64'))
    if(sig.signatureImageHash && sig.signatureImageHash!==imageHash)
      throw Error('Signed event '+index+': signature image hash mismatch')
  }
  const originalEvent={...event.signedEventSnapshot,contractStatus:'Enviado',status:'Proposta'}
  delete originalEvent.signature
  const doc=signedDocumentPayload({
    event:originalEvent,menu:event.signedMenu??null,services:event.signedServices??[],
    settings:event.signedSettings,total:event.signedTotal,contractTemplate:event.signedContractTemplate??null
  })
  if(canonicalHash(doc)!==sig.documentHash || sig.receipt.documentHash!==sig.documentHash)
    throw Error('Signed event '+index+': document hash mismatch')
  const signedAt=sig.signedAt||sig.receipt.signedAt
  const signed={
    token,version:sig.evidenceVersion || 2,document:doc,documentHash:sig.documentHash,
    documentOrigin:'recuperado-do-snapshot-validado-no-Neon',
    invitation:{
      createdAt:sig.receipt.originalCreatedAt || event.sharedAt || null,
      destinationEmail:originalEvent.clientEmail,
      originIp:null,originIpUnavailableReason:'Registro de convite original indisponível no Blob antigo',
      recoverySource:'snapshot do Neon validado criptograficamente'
    },
    status:'signed',
    createdAt:sig.receipt.originalCreatedAt||event.sharedAt||null,
    signedAt,signature:sig,
    event:{...doc.event,contractStatus:'Assinado',status:'Confirmado',signature:sig},
    menu:doc.menu,services:doc.services,settings:doc.settings,total:doc.total,
    contractTemplate:doc.contractTemplate
  }
  const archive='signed-archives/'+sha256(token)+'/'+sig.auditHash+'.json'
  const code=sig.verificationCode
  if(!code || !/^[a-zA-Z0-9_-]{24,64}$/.test(code))throw Error('Signed event '+index+': missing verification code')
  const entries=[
    save('contracts/'+token+'.json',signed),
    save(archive,signed),
    save('verification/'+code+'.json',{version:sig.evidenceVersion||2,archivePath:archive,receiptHash:sig.auditHash})
  ]
  results.push({index,verified:true,receiptHash:sig.auditHash,documentHash:sig.documentHash,
    originalCreatedAtRecovered:Boolean(sig.receipt.originalCreatedAt),stored:entries})
  console.log('RECONSTRUCTED_SIGNED_CONTRACT',index,'VERIFIED_TRUE')
}
const addenda=workspace.events.flatMap((event)=>Array.isArray(event.addenda)?event.addenda:[])
const report={format:'buffet-recovery-v1',source:'Neon database snapshot',createdAt:new Date().toISOString(),
  verifiedContractCount:results.length,files:results.flatMap(x=>x.stored),addendaSummary:{
    total:addenda.length,signed:addenda.filter(x=>x.status==='Assinado').length,
    unsigned:addenda.filter(x=>x.status!=='Assinado').length
  },missingOriginalInvitationMetadata:true}
fs.writeFileSync(path.join(root,'recovery-manifest.json'),JSON.stringify(report,null,2))
console.log('RECONSTRUCTION_COMPLETE',{contracts:results.length,files:report.files.length,addenda:report.addendaSummary})
