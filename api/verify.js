import { get } from '@vercel/blob'
import { canonicalHash, isCode, verifyAudit, maskedEmail } from './_audit.js'
const read = async (path) => {
  const file = await get(path, { access: 'private', useCache: false })
  if (!file || file.statusCode !== 200) return null
  return JSON.parse(await new Response(file.stream).text())
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' })
  const code = String(req.query.code || '')
  if (!isCode(code)) return res.status(400).json({ error: 'Código de verificação inválido.' })
  try {
    const pointer = await read('verification/' + code + '.json')
    if (!pointer || !/^signed-archives\/[a-f0-9]{64}\/[a-f0-9]{64}\.json$/.test(pointer.archivePath))
      return res.status(404).json({ error: 'Registro não encontrado.' })
    const archived = await read(pointer.archivePath)
    if (!archived?.signature?.receipt) return res.status(404).json({ error: 'Registro não encontrado.' })
    const receipt = archived.signature.receipt
    const documentHashOk = archived.document && canonicalHash(archived.document) === archived.documentHash
    const auditOk = pointer.receiptHash === archived.signature.auditHash &&
      receipt.documentHash === archived.documentHash &&
      receipt.verificationCode === code &&
      verifyAudit(receipt, archived.signature.auditHash, archived.signature.auditSeal)
    const integrity = Boolean(documentHashOk && auditOk && archived.status === 'signed')
    return res.status(200).json({
      found: true, integrity,
      method: 'assinatura eletrônica com trilha de auditoria; não é assinatura qualificada ICP-Brasil',
      documentHash: archived.documentHash,
      evidenceHash: archived.signature.auditHash,
      algorithm: archived.signature.auditAlgorithm,
      code,
      signedAt: archived.signedAt,
      signerName: archived.signature.signerName,
      signerEmail: maskedEmail(archived.signature.signerEmail),
      emailVerified: archived.signature.emailVerification?.verified === true,
      contractNumber: archived.document?.event?.contractNumber,
      status: integrity ? 'registro íntegro' : 'inconsistência detectada',
      timestampType: 'horário do servidor, sem carimbo do tempo certificado',
      documentFormat: 'snapshot JSON canônico; não equivale a assinatura PAdES em PDF'
    })
  } catch (error) {
    console.error('verify_api_error', error?.message)
    return res.status(500).json({ error: 'Não foi possível verificar este registro agora.' })
  }
}
