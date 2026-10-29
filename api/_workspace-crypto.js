import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'

export const workspaceKeyConfigured=()=>/^[a-f0-9]{64}$/i.test(process.env.WORKSPACE_ENCRYPTION_KEY||'')
function key() {
  if (!workspaceKeyConfigured()) throw new Error('Chave de dados indisponível.')
  return Buffer.from(process.env.WORKSPACE_ENCRYPTION_KEY,'hex')
}
const aad=Buffer.from('akela-workspace:v1:main')
export const workspaceKeyFingerprint=()=>workspaceKeyConfigured()?createHmac('sha256',key()).update('akela-workspace-key-check:v1').digest('hex'):null
function validWorkspace(value) {
  return Boolean(value && typeof value==='object' && !Array.isArray(value) &&
    Array.isArray(value.events) && Array.isArray(value.menus) && Array.isArray(value.services) &&
    value.settings && typeof value.settings==='object' && !Array.isArray(value.settings) &&
    (value.clients===undefined || Array.isArray(value.clients)) && (value.receipts===undefined || Array.isArray(value.receipts)))
}
export function encryptWorkspace(data) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv)
  cipher.setAAD(aad)
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()])
  return {encrypted:'v1:'+Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url')}
}
export function decryptWorkspace(record) {
  if (!record || typeof record!=='object' || Array.isArray(record)) throw new Error('Dados inválidos.')
  if (!Object.hasOwn(record,'encrypted')) {
    if (!validWorkspace(record)) throw new Error('Dados legados inválidos.')
    return record
  }
  const value=record.encrypted
  if (typeof value!=='string' || !/^v1:[A-Za-z0-9_-]+$/.test(value)) throw new Error('Dados criptografados inválidos.')
  const data=Buffer.from(value.slice(3),'base64url')
  if (data.length<29) throw new Error('Dados criptografados inválidos.')
  const cipher=createDecipheriv('aes-256-gcm',key(),data.subarray(0,12))
  cipher.setAAD(aad);cipher.setAuthTag(data.subarray(12,28))
  const decoded=JSON.parse(Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString('utf8'))
  if (!validWorkspace(decoded)) throw new Error('Dados inválidos.')
  return decoded
}
