import { del, get, head, put } from '@vercel/blob'
import { randomBytes } from 'node:crypto'
import { requireAdmin } from './_session.js'
import { canonicalHash, getTrustedIp, browserInfo, isEmail, EVIDENCE_VERSION, sha256 } from './_audit.js'

const pathFor = (token) => 'addenda/' + token + '.json'
const contractPath = (token) => 'contracts/' + token + '.json'
const read = async (path) => {
  const result = await get(path, { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200) return null
  return JSON.parse(await new Response(result.stream).text())
}
const safeHtml = (value) => {
  const html = String(value || '').trim()
  if (html.length < 20 || html.length > 600_000) return false
  return !/<\s*(script|style|iframe|object|embed|form|input|button|svg|math|meta|link)\b/i.test(html) &&
    !/\son[a-z]+\s*=/i.test(html) &&
    !/(javascript:|data:text\/html)/i.test(html)
}
const publicUrl = (req, token) => {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return proto + '://' + host + '/adendo/' + token
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  try {
    if (req.method === 'GET') {
      const token = String(req.query.token || '')
      if (!token || token.length < 20) return res.status(400).json({ error: 'Token inválido.' })
      const addendum = await read(pathFor(token))
      if (!addendum) return res.status(404).json({ error: 'Adendo não encontrado ou link inválido.' })
      return res.status(200).json({
        addendum,
        emailVerificationRequired: Boolean(process.env.RESEND_API_KEY && process.env.SIGNING_FROM_EMAIL)
      })
    }

    if (req.method === 'DELETE') {
      if (!(await requireAdmin(req, res))) return
      const token = String(req.query.token || '')
      if (!token || token.length < 20) return res.status(400).json({ error: 'Token inválido.' })
      const addendum = await read(pathFor(token))
      if (!addendum) return res.status(204).end()
      if (addendum.status === 'signed') return res.status(409).json({ error: 'Adendo assinado não pode ser revogado.' })
      const metadata = await head(pathFor(token))
      await del(pathFor(token), { ifMatch: metadata.etag })
      return res.status(204).end()
    }

    if (req.method === 'POST') {
      if (!(await requireAdmin(req, res))) return
      const body = req.body || {}
      const originalToken = String(body.originalContractToken || '')
      const html = String(body.html || '')
      const number = String(body.number || '').trim().slice(0, 80)
      const title = String(body.title || 'Adendo contratual').trim().slice(0, 180)
      const client = body.client || {}
      const settings = body.settings || {}
      const eventReference = body.eventReference || {}

      if (originalToken.length < 20 || !number || !safeHtml(html) || !isEmail(client.email) ||
          !client.name || !settings.businessName || !eventReference.id) {
        return res.status(400).json({ error: 'Dados obrigatórios do adendo estão incompletos.' })
      }

      const original = await read(contractPath(originalToken))
      if (!original || original.status !== 'signed' || !original.documentHash || !original.signature) {
        return res.status(409).json({ error: 'O adendo só pode ser vinculado a um contrato original já assinado.' })
      }
      if (String(original.document?.event?.id || original.event?.id) !== String(eventReference.id)) {
        return res.status(409).json({ error: 'O contrato original não corresponde a este evento.' })
      }

      const token = randomBytes(32).toString('base64url')
      const createdAt = new Date().toISOString()
      const observed = getTrustedIp(req)
      const document = {
        kind: 'contract-addendum',
        number,
        title,
        html,
        originalContract: {
          number: String(original.document?.event?.contractNumber || original.event?.contractNumber || ''),
          tokenHash: sha256(originalToken),
          documentHash: original.documentHash,
          verificationCode: original.signature?.verificationCode || null,
          signedAt: original.signedAt || original.signature?.signedAt || null
        },
        client: {
          name: String(client.name || '').slice(0, 180),
          document: String(client.document || '').slice(0, 50),
          email: String(client.email || '').trim().toLowerCase().slice(0, 254),
          address: String(client.address || '').slice(0, 400)
        },
        settings: {
          businessName: String(settings.businessName || '').slice(0, 180),
          legalName: String(settings.legalName || '').slice(0, 220),
          document: String(settings.document || '').slice(0, 60),
          address: String(settings.address || '').slice(0, 300),
          city: String(settings.city || '').slice(0, 160),
          email: String(settings.email || '').slice(0, 254),
          phone: String(settings.phone || '').slice(0, 80)
        },
        eventReference: {
          id: String(eventReference.id),
          type: String(eventReference.type || '').slice(0, 120),
          date: String(eventReference.date || '').slice(0, 20)
        }
      }
      const addendum = {
        token,
        version: EVIDENCE_VERSION,
        document,
        documentHash: canonicalHash(document),
        invitation: {
          createdAt, originIp: observed.ip, ipSource: observed.source, ...browserInfo(req),
          destinationEmail: document.client.email, method: 'link compartilhável',
          deliveryVerified: false
        },
        status: 'pending',
        createdAt,
        signature: null
      }

      await put(pathFor(token), JSON.stringify(addendum), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json'
      })
      return res.status(201).json({ token, url: publicUrl(req, token), addendum })
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Método não permitido.' })
  } catch (error) {
    console.error('addenda_api_error', error?.message)
    return res.status(500).json({ error: 'Não foi possível processar o adendo agora.' })
  }
}
