import { get, head, put } from '@vercel/blob'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import {
  sha256, canonicalHash, auditSeal, isCode, isEmail, normalizeEmail, getTrustedIp, browserInfo,
  EVIDENCE_VERSION, TERMS_VERSION, VERIFICATION_POLICY
} from './_audit.js'
import { codeHash } from './otp.js'

const addendumPath = (token) => 'addenda/' + token + '.json'
const otpPath = (token) => 'sign-otp/' + token + '.json'
const read = async (path) => {
  const result = await get(path, { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200) return null
  return JSON.parse(await new Response(result.stream).text())
}
const respondError = (res, status, error) => res.status(status).json({ error })

async function emailEvidence(req, token, email, enabled) {
  if (!enabled) return { verified: false, method: 'declarado-na-assinatura', verifiedAt: null }
  const otp = String(req.body?.emailCode || '').trim()
  const challenge = await read(otpPath(token))
  if (!challenge) return { error: 'Solicite o código de confirmação enviado por e-mail.' }
  if (challenge.failedAttempts >= 5) return { error: 'Limite de tentativas atingido. Solicite um novo link.' }
  if (Date.now() > new Date(challenge.expiresAt).getTime()) return { error: 'Código expirado. Solicite outro código.' }
  const actual = codeHash(token, email, otp)
  const expected = challenge.digest
  const equal = /^[a-f0-9]{64}$/.test(expected) &&
    timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))
  if (email !== challenge.email || !equal) {
    const metadata = await head(otpPath(token))
    await put(otpPath(token), JSON.stringify({ ...challenge, failedAttempts: challenge.failedAttempts + 1 }), {
      access: 'private', addRandomSuffix: false, allowOverwrite: true,
      ifMatch: metadata.etag, contentType: 'application/json'
    })
    return { error: 'Código incorreto ou e-mail divergente.' }
  }
  return { verified: true, method: 'codigo-de-uso-unico-por-email', verifiedAt: new Date().toISOString() }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return respondError(res, 405, 'Método não permitido.')
  }
  try {
    const body = req.body || {}
    const token = String(body.token || '')
    const signerName = String(body.signerName || '').trim().slice(0, 150)
    const signerDocument = String(body.signerDocument || '').replace(/[^0-9]/g, '')
    const signerEmail = normalizeEmail(body.signerEmail)
    if (!isCode(token) || signerName.length < 4 || ![11, 14].includes(signerDocument.length) ||
        !isEmail(signerEmail) || body.accepted !== true) {
      return respondError(res, 400, 'Confira nome completo, CPF/CNPJ, e-mail e o aceite expresso.')
    }

    const image = String(body.dataUrl || '')
    if (!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(image) || image.length > 700_000)
      return respondError(res, 400, 'Assinatura desenhada inválida ou muito grande.')
    const imageBytes = Buffer.from(image.slice('data:image/png;base64,'.length), 'base64')
    if (imageBytes.length < 60 || imageBytes.length > 500_000 ||
        imageBytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
      return respondError(res, 400, 'Envie uma assinatura PNG válida.')

    const addendum = await read(addendumPath(token))
    if (!addendum) return respondError(res, 404, 'Adendo não encontrado ou link inválido.')
    if (addendum.status !== 'pending' || addendum.signature)
      return respondError(res, 409, 'Este adendo já foi assinado.')

    const invitedEmail = normalizeEmail(addendum.document?.client?.email)
    if (!isEmail(invitedEmail) || signerEmail !== invitedEmail)
      return respondError(res, 400, 'O e-mail deve ser o mesmo informado no adendo.')
    const invitedDocument = String(addendum.document?.client?.document || '').replace(/[^0-9]/g, '')
    if ([11, 14].includes(invitedDocument.length) && signerDocument !== invitedDocument)
      return respondError(res, 400, 'O CPF/CNPJ não corresponde ao cadastro do adendo.')

    const original = addendum.document
    const documentHash = canonicalHash(original)
    if (addendum.documentHash && addendum.documentHash !== documentHash)
      return respondError(res, 409, 'A versão original do adendo sofreu alterações e não pode ser assinada.')

    const needsEmailCode = Boolean(process.env.RESEND_API_KEY && process.env.SIGNING_FROM_EMAIL)
    const emailVerification = await emailEvidence(req, token, signerEmail, needsEmailCode)
    if (emailVerification.error) return respondError(res, 400, emailVerification.error)

    const observed = getTrustedIp(req)
    const device = browserInfo(req)
    const signedAt = new Date().toISOString()
    const verificationCode = randomBytes(24).toString('base64url')
    const signatureImageHash = sha256(imageBytes)
    const receipt = {
      version: EVIDENCE_VERSION,
      documentType: 'contract-addendum',
      signatureType: VERIFICATION_POLICY,
      documentTokenHash: sha256(token),
      documentHash,
      originalContractDocumentHash: original.originalContract?.documentHash || null,
      originalContractVerificationCode: original.originalContract?.verificationCode || null,
      signatureImageHash,
      documentVersion: Number(addendum.version) || 1,
      originalCreatedAt: addendum.createdAt,
      signerName, signerDocument, signerEmail,
      emailVerification, signedAt, serverTimeBasis: 'UTC-servidor',
      clientTimezone: String(body.clientTimezone || 'não informada').slice(0, 75),
      ip: observed.ip, ipSource: observed.source, ...device,
      accepted: true, termsVersion: TERMS_VERSION,
      method: 'assinatura-eletronica-desenhada-com-trilha-de-auditoria',
      verificationCode
    }
    const receiptHash = canonicalHash(receipt)
    const seal = auditSeal(receiptHash)
    const signature = {
      signerName, signerDocument, signerEmail, dataUrl: image,
      signedAt, documentHash, signatureImageHash,
      auditHash: receiptHash, auditSeal: seal,
      auditAlgorithm: 'SHA-256/HMAC-SHA-256', verificationCode,
      emailVerification, ip: observed.ip, ipSource: observed.source,
      userAgent: device.userAgent, acceptLanguage: device.acceptLanguage,
      method: receipt.method, accepted: true, termsVersion: TERMS_VERSION,
      signatureType: VERIFICATION_POLICY, evidenceVersion: EVIDENCE_VERSION,
      receipt
    }
    const updated = {
      ...addendum,
      version: EVIDENCE_VERSION,
      document: original,
      documentHash,
      documentOrigin: 'adendo-congelado-no-convite',
      status: 'signed',
      signedAt,
      signature
    }
    const archivePath = 'signed-addendum-archives/' + sha256(token) + '/' + receiptHash + '.json'
    const receiptPath = 'verification/' + verificationCode + '.json'
    const metadata = await head(addendumPath(token))
    await put(archivePath, JSON.stringify(updated), {
      access: 'private', addRandomSuffix: false, contentType: 'application/json'
    })
    await put(addendumPath(token), JSON.stringify(updated), {
      access: 'private', addRandomSuffix: false, allowOverwrite: true,
      ifMatch: metadata.etag, contentType: 'application/json'
    })
    await put(receiptPath, JSON.stringify({
      version: EVIDENCE_VERSION,
      documentType: 'contract-addendum',
      archivePath,
      receiptHash
    }), {
      access: 'private', addRandomSuffix: false, contentType: 'application/json'
    })
    return res.status(200).json({ addendum: updated })
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('precondition'))
      return respondError(res, 409, 'Assinatura simultânea ou adendo alterado. Recarregue a página.')
    console.error('addendum_sign_api_error', error?.message)
    return respondError(res, 500, 'Não foi possível registrar a assinatura do adendo agora.')
  }
}
