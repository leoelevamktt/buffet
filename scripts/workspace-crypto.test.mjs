import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { encryptWorkspace, decryptWorkspace, workspaceKeyConfigured, workspaceKeyFingerprint } from '../api/_workspace-crypto.js'

const key=randomBytes(32).toString('hex')
process.env.WORKSPACE_ENCRYPTION_KEY=key
const value={clients:[{name:'Exemplo privado',document:'12345678900'}],events:[{total:999}],settings:{businessName:'Teste'},menus:[],services:[],receipts:[]}
test('workspace encryption is authenticated, random and does not reveal customer data',()=>{
  const a=encryptWorkspace(value),b=encryptWorkspace(value)
  assert.notDeepEqual(a,b);assert.doesNotMatch(JSON.stringify(a),/Exemplo privado|12345678900/)
  assert.deepEqual(decryptWorkspace(a),value)
  const bytes=Buffer.from(a.encrypted.slice(3),'base64url');bytes[bytes.length-1]^=1
  assert.throws(()=>decryptWorkspace({encrypted:'v1:'+bytes.toString('base64url')}))
})
test('missing or wrong key cannot expose, decrypt or silently replace data',()=>{
  const encrypted=encryptWorkspace(value)
  const fingerprint=workspaceKeyFingerprint()
  assert.match(fingerprint,/^[a-f0-9]{64}$/);assert.ok(!fingerprint.includes(key))
  try {
    process.env.WORKSPACE_ENCRYPTION_KEY=''
    assert.equal(workspaceKeyConfigured(),false);assert.throws(()=>encryptWorkspace(value));assert.throws(()=>decryptWorkspace(encrypted))
    process.env.WORKSPACE_ENCRYPTION_KEY=randomBytes(32).toString('hex')
    assert.notEqual(workspaceKeyFingerprint(),fingerprint)
    assert.throws(()=>decryptWorkspace(encrypted))
  } finally {process.env.WORKSPACE_ENCRYPTION_KEY=key}
})
test('legacy workspace is accepted for migration but malformed encrypted records are rejected',()=>{
  assert.deepEqual(decryptWorkspace(value),value)
  assert.throws(()=>decryptWorkspace({encrypted:'not-a-valid-record'}))
  assert.throws(()=>decryptWorkspace({}))
})
