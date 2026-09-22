import { del, get, put } from '@vercel/blob'
import { randomBytes } from 'node:crypto'

const pathnameFor = (token) => 'contracts/' + token + '.json'

async function readContract(token) {
  const result = await get(pathnameFor(token), { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200) return null
  const text = await new Response(result.stream).text()
  return JSON.parse(text)
}

function publicUrl(req, token) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return proto + '://' + host + '/assinar/' + token
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  try {
    if (req.method === 'GET') {
      const token = String(req.query.token || '')
      if (!token || token.length < 20) return res.status(400).json({ error: 'Token inválido.' })

      const contract = await readContract(token)
      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado ou link inválido.' })

      return res.status(200).json({ contract })
    }

    if (req.method === 'DELETE') {
      const token = String(req.query.token || '')
      if (!token || token.length < 20) return res.status(400).json({ error: 'Token inválido.' })
      const contract = await readContract(token)
      if (!contract) return res.status(204).end()
      if (contract.status === 'signed') return res.status(409).json({ error: 'Contrato assinado não pode ser revogado.' })
      await del(pathnameFor(token))
      return res.status(204).end()
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const { event, menu, services, settings, total, contractTemplate } = body

      if (!event?.id || !event?.clientName || !event?.eventDate || !settings?.businessName) {
        return res.status(400).json({ error: 'Dados obrigatórios do contrato não foram informados.' })
      }

      const token = randomBytes(32).toString('base64url')
      const createdAt = new Date().toISOString()
      const contract = {
        token,
        version: 1,
        status: 'pending',
        createdAt,
        event: {
          ...event,
          signature: undefined,
          contractStatus: 'Enviado'
        },
        menu: menu || null,
        services: Array.isArray(services) ? services : [],
        settings,
        total: Number(total) || 0,
        contractTemplate: contractTemplate || null,
        signature: null
      }

      await put(pathnameFor(token), JSON.stringify(contract), {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json'
      })

      return res.status(201).json({
        token,
        url: publicUrl(req, token),
        contract
      })
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Método não permitido.' })
  } catch (error) {
    console.error('contracts_api_error', error)
    return res.status(500).json({ error: 'Não foi possível processar o contrato agora.' })
  }
}
