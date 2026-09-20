import { get, put } from '@vercel/blob'
import { createHash } from 'node:crypto'

const pathnameFor = (token) => 'contracts/' + token + '.json'

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  return req.headers['x-real-ip'] || 'não identificado'
}

async function readStored(token) {
  const result = await get(pathnameFor(token), { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200) return null
  const text = await new Response(result.stream).text()
  return { contract: JSON.parse(text) }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método não permitido.' })
  }

  try {
    const { token, signerName, signerDocument, dataUrl, accepted } = req.body || {}
    if (!token || !signerName || !signerDocument || !dataUrl || accepted !== true) {
      return res.status(400).json({ error: 'Preencha os dados, aceite os termos e faça sua assinatura.' })
    }
    if (String(dataUrl).length > 700000 || !String(dataUrl).startsWith('data:image/png;base64,')) {
      return res.status(400).json({ error: 'Assinatura inválida ou muito grande.' })
    }

    const stored = await readStored(String(token))
    if (!stored) return res.status(404).json({ error: 'Contrato não encontrado ou link inválido.' })

    const contract = stored.contract
    if (contract.status === 'signed' || contract.signature) {
      return res.status(409).json({ error: 'Este contrato já foi assinado.', contract })
    }

    const signedAt = new Date().toISOString()
    const ip = clientIp(req)
    const userAgent = String(req.headers['user-agent'] || 'não identificado').slice(0, 500)
    const auditHash = createHash('sha256')
      .update(JSON.stringify({
        event: contract.event,
        menu: contract.menu,
        services: contract.services,
        settings: contract.settings,
        total: contract.total,
        signerName: String(signerName).trim(),
        signerDocument: String(signerDocument).trim(),
        dataUrl,
        signedAt,
        ip,
        userAgent
      }))
      .digest('hex')

    const signature = {
      signerName: String(signerName).trim(),
      signerDocument: String(signerDocument).trim(),
      dataUrl,
      signedAt,
      auditHash,
      ip,
      userAgent,
      method: 'drawn-electronic-signature',
      accepted: true
    }

    const updated = {
      ...contract,
      status: 'signed',
      signedAt,
      signature,
      event: {
        ...contract.event,
        contractStatus: 'Assinado',
        status: 'Confirmado',
        signature
      }
    }

    await put(pathnameFor(String(token)), JSON.stringify(updated), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    })
    return res.status(200).json({ contract: updated })
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('precondition')) {
      return res.status(409).json({ error: 'Este contrato foi alterado ou já assinado. Recarregue a página.' })
    }
    console.error('sign_api_error', error)
    return res.status(500).json({ error: 'Não foi possível registrar a assinatura agora.' })
  }
}
