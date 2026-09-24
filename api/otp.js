import { get, head, put, del } from '@vercel/blob'
import { randomInt, createHmac } from 'node:crypto'
import { isCode, isEmail, normalizeEmail } from './_audit.js'

const pathFor = (token) => 'sign-otp/' + token + '.json'
const contractPath = (token) => 'contracts/' + token + '.json'
const tooMany = (record) => record && record.totalSent >= 5
async function read(path) {
  const result = await get(path, { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200) return null
  return JSON.parse(await new Response(result.stream).text())
}
const codeHash = (token, email, code) => createHmac('sha256', process.env.SIGNATURE_AUDIT_SECRET)
  .update('otp-v1:' + token + ':' + email + ':' + code).digest('hex')

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  if (!process.env.RESEND_API_KEY || !process.env.SIGNING_FROM_EMAIL || !process.env.SIGNATURE_AUDIT_SECRET)
    return res.status(503).json({ error: 'Verificação por e-mail ainda não configurada pelo buffet.' })
  const token = String(req.body?.token || '')
  if (!isCode(token)) return res.status(400).json({ error: 'Link inválido.' })
  try {
    const contract = await read(contractPath(token))
    if (!contract || contract.status !== 'pending') return res.status(409).json({ error: 'Este contrato não está disponível para assinatura.' })
    const email = normalizeEmail(contract.document?.event?.clientEmail || contract.event?.clientEmail)
    if (!isEmail(email)) return res.status(400).json({ error: 'E-mail do destinatário ausente ou inválido.' })
    const previous = await read(pathFor(token))
    const now = Date.now()
    if (tooMany(previous)) return res.status(429).json({ error: 'Limite de envio atingido. Contate o buffet.' })
    if (previous && now - new Date(previous.sentAt).getTime() < 60_000)
      return res.status(429).json({ error: 'Aguarde um minuto para solicitar outro código.' })
    const code = String(randomInt(100000, 1000000))
    const challenge = {
      tokenHash: createHmac('sha256', process.env.SIGNATURE_AUDIT_SECRET).update(token).digest('hex'),
      email, digest: codeHash(token, email, code), sentAt: new Date().toISOString(),
      expiresAt: new Date(now + 10 * 60_000).toISOString(),
      failedAttempts: 0, totalSent: (previous?.totalSent || 0) + 1
    }
    const existing = previous ? await head(pathFor(token)) : null
    const stored = await put(pathFor(token), JSON.stringify(challenge), {
      access: 'private', addRandomSuffix: false, allowOverwrite: Boolean(existing),
      contentType: 'application/json', ...(existing ? { ifMatch: existing.etag } : {})
    })
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: {
        Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: process.env.SIGNING_FROM_EMAIL, to: [email],
        subject: 'Código de confirmação da assinatura — Buffet Akela',
        text: 'Seu código de confirmação é ' + code + '. Válido por 10 minutos. Não compartilhe o código com terceiros.'
      })
    })
    if (!response.ok) {
      await del(pathFor(token), { ifMatch: stored.etag }).catch(() => {})
      throw new Error('Falha no envio do e-mail de confirmação.')
    }
    return res.status(200).json({ sent: true, destinationMasked: email.replace(/(^.{2}).+(@.*$)/, '$1***$2'), expiresMinutes: 10 })
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('precondition'))
      return res.status(409).json({ error: 'Solicitação simultânea. Tente novamente.' })
    console.error('otp_request_failed', error?.message)
    return res.status(500).json({ error: 'Não foi possível enviar o código agora.' })
  }
}

export { codeHash }
