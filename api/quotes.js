import { get, put } from '@vercel/blob'
import { randomBytes } from 'node:crypto'

const pathnameFor = (token) => 'quotes/' + token + '.json'

async function readQuote(token) {
  const result = await get(pathnameFor(token), { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200) return null
  return JSON.parse(await new Response(result.stream).text())
}

function publicUrl(req, token) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return proto + '://' + host + '/orcamento/' + token
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  try {
    if (req.method === 'GET') {
      const token = String(req.query.token || '')
      if (!token || token.length < 20) return res.status(400).json({ error: 'Link de orçamento inválido.' })
      const quote = await readQuote(token)
      if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado.' })
      return res.status(200).json({ quote })
    }

    if (req.method === 'POST') {
      const { event, menu, services, settings, total, contractTemplate } = req.body || {}
      if (!event?.id || !event?.clientName || !settings?.businessName) {
        return res.status(400).json({ error: 'Dados obrigatórios do orçamento não foram informados.' })
      }

      const token = randomBytes(32).toString('base64url')
      const createdAt = new Date()
      const expiresAt = new Date(createdAt)
      expiresAt.setDate(expiresAt.getDate() + 7)
      const quote = {
        token,
        version: 1,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        event,
        menu: menu || null,
        services: Array.isArray(services) ? services : [],
        settings,
        total: Number(total) || 0,
        contractTemplate: contractTemplate || null
      }

      await put(pathnameFor(token), JSON.stringify(quote), {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json'
      })
      return res.status(201).json({ token, url: publicUrl(req, token), quote })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método não permitido.' })
  } catch (error) {
    console.error('quotes_api_error', error)
    return res.status(500).json({ error: 'Não foi possível processar o orçamento agora.' })
  }
}
