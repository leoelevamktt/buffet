import { useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, History, ShieldCheck, X } from 'lucide-react'
import type { PaymentReceipt, ReceiptChanges } from '../receipts'
import { money } from '../utils'

type Props = {
  receipt: PaymentReceipt
  currentUser: string
  onSave: (changes: ReceiptChanges, reason: string) => void
  onClose: () => void
}

export function ReceiptEditor({ receipt, currentUser, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<ReceiptChanges>(() => ({
    issuer: { ...receipt.issuer }, payer: { ...receipt.payer },
    event: { ...receipt.event }, payment: { ...receipt.payment },
    description: receipt.description
  }))
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (reason.trim().length < 5) throw new Error('Informe o motivo da alteração, com pelo menos cinco caracteres.')
      onSave(draft, reason)
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar as alterações.') }
  }
  const change = <K extends keyof Omit<ReceiptChanges,'description'>>(
    section: K, key: keyof ReceiptChanges[K], value: string | number
  ) => setDraft((old) => ({ ...old, [section]: { ...old[section], [key]: value } }))
  const field = (label: string, value: string | number, onChange: (v: string) => void,
    options?: { type?: string; required?: boolean; min?: string }) =>
    <label className="receipt-editor-field"><span>{label}</span><input type={options?.type || 'text'}
      required={options?.required} min={options?.min} step={options?.type === 'number' ? '0.01' : undefined} value={value}
      onChange={(e) => onChange(e.target.value)} /></label>

  return createPortal(<div className="receipt-editor-overlay" role="dialog" aria-modal="true"
    aria-label={'Editar recibo ' + receipt.number}>
    <form className="receipt-editor-modal" onSubmit={submit}>
      <header className="receipt-editor-head">
        <div><span className="eyebrow">ALTERAÇÃO COM HISTÓRICO</span><h2>Editar recibo {receipt.number}</h2>
          <p>Os dados anteriores serão preservados. Alterações de valor, data ou forma também atualizarão o lançamento financeiro vinculado.</p></div>
        <button type="button" className="receipt-editor-close" onClick={onClose} aria-label="Fechar"><X size={20}/></button>
      </header>
      <div className="receipt-editor-content">
        <section><h3>Cliente e pagador</h3><div className="receipt-editor-grid">
          {field('Nome completo *', draft.payer.name, (v) => change('payer','name',v), {required:true})}
          {field('CPF/CNPJ', draft.payer.document, (v) => change('payer','document',v))}
          {field('Telefone / WhatsApp', draft.payer.phone, (v) => change('payer','phone',v))}
          {field('E-mail', draft.payer.email, (v) => change('payer','email',v), {type:'email'})}
          <div className="receipt-editor-wide">{field('Endereço', draft.payer.address, (v) => change('payer','address',v))}</div>
        </div></section>
        <section><h3>Pagamento</h3><div className="receipt-editor-grid">
          {field('Valor recebido (R$) *', draft.payment.amount, (v) =>
            change('payment','amount',Number(v)), {type:'number',min:'0.01',required:true})}
          {field('Data do recebimento *', draft.payment.date, (v) =>
            change('payment','date',v), {type:'date',required:true})}
          {field('Forma de pagamento *', draft.payment.method, (v) =>
            change('payment','method',v), {required:true})}
          {field('Referência / cheque', draft.payment.reference, (v) => change('payment','reference',v))}
          <div className="receipt-editor-wide">
            <label className="receipt-editor-field"><span>Descrição do recebimento *</span>
              <textarea value={draft.description} maxLength={600} required
                onChange={(e) => setDraft((old) => ({...old,description:e.target.value}))} rows={3}/></label>
          </div>
          <div className="receipt-editor-wide">
            <label className="receipt-editor-field"><span>Observações do pagamento</span>
              <textarea value={draft.payment.notes} onChange={(e) => change('payment','notes',e.target.value)} rows={2}/></label>
          </div>
        </div></section>
        <section><h3>Identificação do evento</h3><div className="receipt-editor-grid">
          {field('Número do contrato', draft.event.contractNumber, (v) => change('event','contractNumber',v))}
          {field('Tipo de evento', draft.event.type, (v) => change('event','type',v))}
          {field('Data prevista', draft.event.date, (v) => change('event','date',v), {type:'date'})}
          {field('Local do evento', draft.event.venue, (v) => change('event','venue',v))}
        </div></section>
        <section><h3>Dados do emissor</h3><div className="receipt-editor-grid">
          {field('Nome da empresa *', draft.issuer.businessName, (v) => change('issuer','businessName',v), {required:true})}
          {field('Razão social', draft.issuer.legalName, (v) => change('issuer','legalName',v))}
          {field('CNPJ/CPF', draft.issuer.document, (v) => change('issuer','document',v))}
          {field('Telefone', draft.issuer.phone, (v) => change('issuer','phone',v))}
          {field('E-mail', draft.issuer.email, (v) => change('issuer','email',v), {type:'email'})}
          {field('Cidade', draft.issuer.city, (v) => change('issuer','city',v))}
          <div className="receipt-editor-wide">{field('Endereço', draft.issuer.address, (v) => change('issuer','address',v))}</div>
        </div></section>
        <section className="receipt-revision-section">
          <button type="button" className="receipt-revision-toggle" onClick={() => setShowHistory(!showHistory)}>
            <History size={17}/> Histórico de alterações ({receipt.revisions?.length || 0})
          </button>
          {showHistory && (!receipt.revisions?.length ? <p>Nenhuma edição anterior.</p> :
            <div className="receipt-revision-list">{receipt.revisions.slice().reverse().map((revision, i) =>
              <div key={i}><strong>{new Date(revision.updatedAt).toLocaleString('pt-BR')} — {revision.updatedBy}</strong>
                <p>Motivo: {revision.reason}</p>
                <small>Antes: {money(revision.previous.payment.amount)} · {revision.previous.payment.date} · {revision.previous.payment.method}</small>
                <small>Cliente: {revision.previous.payer.name} · {revision.previous.description}</small>
              </div>)}</div>)}
        </section>
        <div className="receipt-reason-box"><ShieldCheck size={19}/><div>
          <strong>Motivo obrigatório da alteração</strong>
          <textarea required minLength={5} maxLength={500} value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: corrigido o valor após conferência do comprovante bancário." rows={2}/>
          <small>Responsável: {currentUser}. O histórico e a versão anterior serão mantidos.</small>
        </div></div>
        {error && <p className="receipt-editor-error" role="alert">{error}</p>}
      </div>
      <footer className="receipt-editor-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={reason.trim().length < 5}>
          <Check size={16}/> Salvar com histórico
        </button>
      </footer>
    </form>
  </div>, document.body)
}
