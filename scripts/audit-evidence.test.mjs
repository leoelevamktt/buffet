import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { canonical, canonicalHash, auditSeal, verifyAudit, isCode, isEmail, documentIntegrity } from '../api/_audit.js'

const secret = randomBytes(32).toString('hex')
const doc = { event: { name: 'Cliente', guests: 90 }, menu: { name: 'Bronze' }, total: 9900 }
const receipt = { documentHash: canonicalHash(doc), signerName: 'Cliente Exemplo', signedAt: new Date().toISOString(), ip: '198.51.100.10', emailVerification: { verified: false } }
test('hash canônico independe da ordem das propriedades', () => {
  assert.equal(canonicalHash({ a: 1, b: 2 }), canonicalHash({ b: 2, a: 1 }))
  assert.equal(canonical({ b: 2, a: 1 }), '{"a":1,"b":2}')
})
test('hash detecta mudança em valores ou documento', () => {
  assert.equal(documentIntegrity({ document: doc, documentHash: canonicalHash(doc) }).valid, true)
  assert.equal(documentIntegrity({ document: { ...doc, total: 8000 }, documentHash: canonicalHash(doc) }).valid, false)
})
test('selo HMAC detecta alteração no recibo mesmo com hash recalculado', () => {
  const hash = canonicalHash(receipt), seal = auditSeal(hash, secret)
  assert.equal(verifyAudit(receipt, hash, seal, secret), true)
  assert.equal(verifyAudit({ ...receipt, signerName: 'Terceiro' }, hash, seal, secret), false)
  const altered = { ...receipt, ip: '198.51.100.20' }
  assert.equal(verifyAudit(altered, canonicalHash(altered), seal, secret), false)
})
test('códigos e e-mails são validados', () => {
  assert.equal(isCode(randomBytes(24).toString('base64url')), true)
  assert.equal(isCode('1234'), false)
  assert.equal(isEmail('cliente@example.com'), true)
  assert.equal(isEmail('cliente-sem-arroba'), false)
})
