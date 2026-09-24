import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, FileCheck2, Printer, ShieldCheck } from 'lucide-react'
import { brandMark } from '../brand'

type Result = {
  found: boolean; integrity: boolean; code: string
  contractNumber?: string; documentHash: string; evidenceHash: string
  signerName: string; signerEmail: string; signedAt: string
  emailVerified: boolean; algorithm: string; status: string
  method: string; documentFormat: string; timestampType: string
}
export function VerificationPage({ code }: { code: string }) {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/verify?code=' + encodeURIComponent(code), { signal: ctrl.signal, cache: 'no-store' })
      .then(async (res) => { const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Registro não encontrado.'); return body })
      .then((body) => setResult(body))
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [code])
  return (
    <div className="verification-page">
      <header className="verification-header no-print">
        <div><img src={brandMark} alt="Buffet Akela" /><span><strong>Buffet Akela</strong><small>Conferência de registro eletrônico</small></span></div>
        <button className="btn btn-quiet" onClick={() => window.print()}><Printer size={16} /> Imprimir comprovante</button>
      </header>
      <main className="verification-sheet">
        <div className="verification-eyebrow"><ShieldCheck size={17} /> AUTENTICIDADE E INTEGRIDADE</div>
        <h1>Conferência de assinatura eletrônica</h1>
        {loading && <p className="verification-muted">Conferindo os dados do registro...</p>}
        {error && <div className="verification-status bad"><CircleAlert size={23} /><div><strong>Não foi possível conferir o registro</strong><span>{error}</span></div></div>}
        {result && <>
          <div className={'verification-status ' + (result.integrity ? 'good' : 'bad')}>
            {result.integrity ? <CheckCircle2 size={26} /> : <CircleAlert size={26} />}
            <div><strong>{result.integrity ? 'Integridade do registro confirmada' : 'Inconsistência detectada'}</strong>
              <span>{result.integrity ? 'Os hashes do documento e do recibo correspondem ao registro selado pelo servidor.' : 'O registro apresenta divergência e precisa ser investigado.'}</span></div>
          </div>
          <div className="verification-details">
            <div><span>Contrato</span><strong>{result.contractNumber || 'Não informado'}</strong></div>
            <div><span>Signatário declarado</span><strong>{result.signerName}</strong></div>
            <div><span>E-mail</span><strong>{result.signerEmail}</strong></div>
            <div><span>Verificação por e-mail</span><strong>{result.emailVerified ? 'Confirmado por código' : 'Não confirmada independentemente'}</strong></div>
            <div><span>Data/hora registrada (UTC)</span><strong>{new Date(result.signedAt).toISOString().replace('T', ' ').replace('.000Z', ' UTC')}</strong></div>
            <div><span>Código de verificação</span><code>{result.code}</code></div>
          </div>
          <section className="verification-hashes">
            <h2><FileCheck2 size={17} /> Códigos de integridade</h2>
            <label>SHA-256 da versão contratual congelada</label><code>{result.documentHash}</code>
            <label>SHA-256 do recibo de assinatura</label><code>{result.evidenceHash}</code>
            <small>{result.documentFormat}. {result.timestampType}.</small>
          </section>
          <div className="verification-disclaimer">
            Esta página confere a trilha de auditoria produzida pela plataforma. Não é um validador oficial ICP-Brasil,
            não certifica por si só a identidade civil do signatário e não atesta assinatura PAdES.
            Para assinatura qualificada ICP-Brasil, é necessário certificado válido e processo de assinatura compatível.
          </div>
        </>}
        <footer>Buffet Akela · Comprovante de conferência técnica</footer>
      </main>
    </div>
  )
}
