import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes} from 'node:crypto'
import {mfaConfigured,newSecret,encryptSecret,decryptSecret,totpCounter,enrollmentDisplay,newRecoveryCodes,recoveryHash,invitationHash,passwordProof} from '../api/_mfa-crypto.js'

process.env.MFA_ENCRYPTION_KEY=randomBytes(32).toString('hex')
const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

test('TOTP matches independently specified RFC6238 SHA1 values',()=>{
  assert.equal(totpCounter(secret,'287082',null,59000),1)
  assert.equal(totpCounter(secret,'081804',null,1111111109000),37037036)
  assert.equal(totpCounter(secret,'050471',null,1111111111000),37037037)
  assert.equal(totpCounter(secret,'005924',null,1234567890000),41152263)
})
test('TOTP tolerates one time step but rejects expired, reused and malformed codes',()=>{
  assert.equal(totpCounter(secret,'287082',null,89000),1)
  assert.equal(totpCounter(secret,'287082',null,119000),null)
  assert.equal(totpCounter(secret,'287082',1,59000),null)
  for(const code of ['28708','2870820',' 287082',287082,null])assert.equal(totpCounter(secret,code,null,59000),null)
})
test('factor encryption is randomized, authenticated and bound to its account',()=>{
  const a=encryptSecret('user-a',secret),b=encryptSecret('user-a',secret)
  assert.notEqual(a,b)
  assert.ok(!a.includes(secret))
  assert.equal(decryptSecret('user-a',a),secret)
  assert.throws(()=>decryptSecret('user-b',a))
  const damaged=Buffer.from(a.slice(3),'base64url');damaged[damaged.length-1]^=1
  assert.throws(()=>decryptSecret('user-a','v1:'+damaged.toString('base64url')))
})
test('missing or malformed master key never uses a fallback',()=>{
  const original=process.env.MFA_ENCRYPTION_KEY
  try{
    for(const key of ['', 'x'.repeat(64), 'ab'.repeat(16)]){
      process.env.MFA_ENCRYPTION_KEY=key
      assert.equal(mfaConfigured(),false)
      assert.throws(()=>encryptSecret('user-a',secret))
    }
  }finally{process.env.MFA_ENCRYPTION_KEY=original}
})
test('recovery codes have sufficient entropy, normalization and account binding',()=>{
  const codes=newRecoveryCodes()
  assert.equal(codes.length,8)
  assert.equal(new Set(codes).size,8)
  for(const code of codes){
    assert.match(code,/^[A-F0-9]{6}(-[A-F0-9]{6}){3}$/)
    assert.match(recoveryHash('user-a',code),/^[a-f0-9]{64}$/)
    assert.equal(recoveryHash('user-a',code),recoveryHash('user-a',code.toLowerCase().replaceAll('-','')))
    assert.notEqual(recoveryHash('user-a',code),recoveryHash('user-b',code))
  }
  assert.equal(recoveryHash('user-a','123456'),null)
})
test('invitations and credential fingerprints are separately bound to an account',()=>{
  assert.notEqual(invitationHash('user-a','token'),invitationHash('user-b','token'))
  assert.notEqual(invitationHash('user-a','token'),passwordProof('user-a','token'))
  assert.notEqual(passwordProof('user-a','old-hash'),passwordProof('user-a','new-hash'))
})
test('QR code is generated locally with a random per-user secret',async()=>{
  const a=newSecret(),b=newSecret()
  assert.match(a,/^[A-Z2-7]{32}$/);assert.notEqual(a,b)
  const display=await enrollmentDisplay('leo',a)
  assert.equal(display.secret,a)
  assert.match(display.qrImage,/^data:image\/png;base64,/)
  assert.ok(display.qrImage.length>100)
})
