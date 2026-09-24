import { get } from '@vercel/blob'
import { isCode, canonicalHash, verifyAudit } from './_audit.js'
const contractPath = (token) => 'contracts/' + token + '.json'
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' })
  const token = String(req.query.token || '')
  if (!isCode(token)) return res.status(400).json({ error: 'Link inválido.' })
  try {
    const file = await get(contractPath(token), { access: 'private', useCache: false })
    if (!file || file.statusCode !== 200) return res.status(404).json({ error: 'Contrato não encontrado.' })
    const contract = JSON.parse(await new Response(file.stream).text())
    if (contract.status !== 'signed' || !contract.signature?.receipt)
      return res.status(409).json({ error: 'Este contrato ainda não possui o novo comprovante técnico de assinatura.' })
    const signature = contract.signature
    const integrity = Boolean(contract.document && canonicalHash(contract.document) === contract.documentHash &&
      signature.receipt.documentHash === contract.documentHash &&
      verifyAudit(signature.receipt, signature.auditHash, signature.auditSeal))
    const report = {
      title: 'Comprovante técnico de assinatura eletrônica — Buffet Akela',
      caveat: 'Registro de assinatura eletrônica com evidências técnicas. Não é um certificado digital ICP-Brasil nem um PDF PAdES.',
      integrity, generatedAt: new Date().toISOString(), contractNumber: contract.document?.event?.contractNumber,
      signedAt: contract.signedAt, documentHash: contract.documentHash,
      documentContentType: 'snapshot JSON canônico do contrato', verificationCode: signature.verificationCode,
      verifyUrl: 'https://' + (req.headers['x-forwarded-host'] || req.headers.host) + '/verificar/' + signature.verificationCode,
      evidenceHash: signature.auditHash, evidenceSeal: signature.auditSeal,
      evidence: signature.receipt
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="comprovante-assinatura-' + String(contract.document?.event?.contractNumber || 'contrato').replace(/[^a-z0-9_-]/gi,'').slice(0,35) + '.json"')
    return res.status(200).send(JSON.stringify(report, null, 2))
  } catch (error) {
    console.error('evidence_api_error', error?.message)
    return res.status(500).json({ error: 'Falha ao gerar o comprovante de auditoria.' })
  }
}
