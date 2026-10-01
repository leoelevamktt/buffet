import { FileText, ShieldCheck } from 'lucide-react'
import { brandMark } from '../brand'
import { sanitizeAddendumHtml } from '../addenda'
import type { BusinessSettings, ContractAddendum, Signature } from '../types'

type RemoteDocument = {
  number: string
  title: string
  html: string
  originalContract: {
    number: string
    documentHash?: string | null
    verificationCode?: string | null
    signedAt?: string | null
  }
  client: { name: string; document: string; email: string; address?: string }
  settings: Pick<BusinessSettings,'businessName'|'legalName'|'document'|'address'|'city'|'email'|'phone'>
  eventReference: { id: string; type: string; date: string }
}

export function AddendumDocument({ document, signature }: { document: RemoteDocument; signature?: Signature | null }) {
  return (
    <article className="addendum-document">
      <header className="addendum-brand">
        <img src={brandMark} alt={'Logo ' + document.settings.businessName}/>
        <div><span>ADENDO CONTRATUAL</span><strong>{document.settings.businessName}</strong>
          <small>{[document.settings.document,document.settings.email,document.settings.phone].filter(Boolean).join(' · ')}</small></div>
      </header>

      <section className="addendum-reference">
        <div><span>ADENDO Nº</span><strong>{document.number}</strong></div>
        <div><span>CONTRATO ORIGINAL</span><strong>{document.originalContract.number}</strong></div>
        <div><span>CONTRATANTE</span><strong>{document.client.name}</strong></div>
      </section>

      <div className="addendum-content" dangerouslySetInnerHTML={{ __html: sanitizeAddendumHtml(document.html) }}/>

      <section className="addendum-linkage">
        <ShieldCheck size={18}/>
        <div><strong>Vínculo com o contrato original</strong>
          <span>Este adendo é um documento independente que complementa o contrato {document.originalContract.number}. O contrato original permanece preservado.</span>
          {document.originalContract.documentHash && <code>SHA-256 original: {document.originalContract.documentHash}</code>}
          {document.originalContract.verificationCode && <small>Código de verificação original: {document.originalContract.verificationCode}</small>}
        </div>
      </section>

      <section className="addendum-signatures">
        <div><span>CONTRATADA</span><i/><strong>{document.settings.legalName || document.settings.businessName}</strong><small>{document.settings.document}</small></div>
        <div><span>CONTRATANTE</span>
          {signature?.dataUrl ? <img src={signature.dataUrl} alt="Assinatura do contratante"/> : <i/>}
          <strong>{signature?.signerName || document.client.name}</strong>
          <small>{signature ? 'Assinado eletronicamente em ' + new Date(signature.signedAt).toLocaleString('pt-BR') : document.client.email}</small>
        </div>
      </section>

      {signature?.auditHash && <section className="addendum-audit">
        <header><FileText size={17}/><strong>Registro técnico da assinatura deste adendo</strong></header>
        {signature.documentHash && <p><span>SHA-256 do adendo</span><code>{signature.documentHash}</code></p>}
        <p><span>SHA-256 das evidências</span><code>{signature.auditHash}</code></p>
        {signature.verificationCode && <p><span>Código de verificação</span><code>{signature.verificationCode}</code></p>}
        <small>Registro eletrônico com evidências técnicas. Não representa certificado ICP-Brasil nem assinatura PAdES.</small>
      </section>}

      <footer>{document.settings.businessName} · {document.number}</footer>
    </article>
  )
}
