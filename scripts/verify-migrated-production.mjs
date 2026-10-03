import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import{canonicalHash,verifyAudit,sha256}from'../api/_audit.js';
const base='https://buffetakela.vercel.app';
const content=fs.readFileSync('.env.local','utf8');
const audit=content.match(/^SIGNATURE_AUDIT_SECRET=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g,'');
const fresh=JSON.parse(fs.readFileSync(path.join(os.homedir(),'Documents','BuffetAkela','neon-fresh-before-migration-2026-10-03.json')));
const workspace=fresh.tables.buffet_workspace.find(x=>x.id==='main').data;
const backup=path.join(os.homedir(),'Documents','BuffetAkela','original-blob-backup-2026-10-03');
const signed=workspace.events.filter(x=>x.contractStatus==='Assinado');
const fetchJson=async pathname=>{const r=await fetch(base+pathname,{cache:'no-store'});let data=null;try{data=await r.json()}catch{}return{status:r.status,data}};
const home=await fetch(base,{cache:'no-store'});if(home.status!==200)throw Error('Homepage '+home.status);
const index=await home.text();if(!index.includes('/assets/'))throw Error('No frontend assets');
const api=await fetchJson('/api/session');if(api.status!==200)throw Error('Session status '+api.status);
for(const endpoint of ['/api/workspace','/api/users']){const r=await fetchJson(endpoint);if(r.status!==401)throw Error('Private '+endpoint+' exposed or broken: '+r.status)}
console.log('NEW_PRODUCTION_PUBLIC_AND_GUARDS_PASS');
let docs=0,proofs=0,technical=0;
for(const e of signed){
 const t=encodeURIComponent(e.shareToken),code=encodeURIComponent(e.signature.verificationCode);
 const c=await fetchJson('/api/contracts?token='+t);
 if(c.status!==200||c.data?.contract?.status!=='signed')throw Error('Active signed contract inaccessible '+c.status);
 const actual=c.data.contract;if(canonicalHash(actual.document)!==e.signature.documentHash||actual.documentHash!==e.signature.documentHash)throw Error('Document integrity mismatch');
 if(!verifyAudit(e.signature.receipt,e.signature.auditHash,e.signature.auditSeal,audit))throw Error('Audit HMAC invalid');
 docs++;
 const proof=await fetchJson('/api/verify?code='+code);
 if(proof.status!==200||!proof.data?.integrity)throw Error('Active verification broken');
 proofs++;
 const evidence=await fetchJson('/api/evidence?token='+t);
 if(evidence.status!==200||!evidence.data?.integrity)throw Error('Evidence download broken');
 technical++;
 for(const pathname of ['/assinar/'+t,'/verificar/'+code]){const r=await fetch(base+pathname);if(r.status!==200)throw Error('Public route broken '+r.status)}
}
console.log('ACTIVE_SIGNED_CONTRACTS_PASS',JSON.stringify({docs,proofs,technical}));
let archiveExtra=0;
const manifest=JSON.parse(fs.readFileSync(path.join(backup,'original-blob-manifest.json')));
for(const rec of manifest.files.filter(x=>x.pathname.startsWith('contracts/'))){
 const original=JSON.parse(fs.readFileSync(path.join(backup,...rec.pathname.split('/')),'utf8'));
 if(original.status!=='signed'||!original.signature?.receipt||signed.some(x=>x.shareToken===original.token))continue;
 if(canonicalHash(original.document)!==original.documentHash || !verifyAudit(original.signature.receipt,original.signature.auditHash,original.signature.auditSeal,audit))throw Error('Historical audit invalid');
 const r=await fetchJson('/api/contracts?token='+encodeURIComponent(original.token));
 if(r.status!==200||canonicalHash(r.data.contract.document)!==original.documentHash)throw Error('Historical signed contract missing');
 const proof=await fetchJson('/api/verify?code='+encodeURIComponent(original.signature.verificationCode));
 if(proof.status!==200||!proof.data.integrity)throw Error('Historical verification broken');
 archiveExtra++
}
console.log('HISTORICAL_SIGNED_CONTRACTS_PASS',archiveExtra);
const addon=workspace.events.flatMap(x=>x.addenda||[]);
if(addon.length!==1||addon[0].status!=='Rascunho'||!addon[0].html)throw Error('Draft addendum not preserved');
const assets=(index.match(/(?:src|href)="([^"]+assets\/[^"]+\.(?:js|css))"/g)||[]).map(s=>s.match(/"([^"]+)"/)[1]);
if(assets.length<2)throw Error('Missing JS/CSS');
for(const a of assets){const r=await fetch(new URL(a,base));if(r.status!==200)throw Error('Asset unavailable '+r.status)}
const oldAlias=await fetch('https://buffet-akela.vercel.app');
if(oldAlias.status!==200)throw Error('Secondary alias unavailable');
console.log('MIGRATED_LIVE_SMOKE_PASS',JSON.stringify({activeSigned:docs,verifiedHistorical:archiveExtra,draftAddenda:addon.length,oldHostPreserved:true,assets:assets.length}));
