import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, Copy, Download, Printer, Send, X } from 'lucide-react'
import { brandMark } from '../brand'
import { amountInWordsBR, type PaymentReceipt } from '../receipts'
import { dateBR, money, phoneDigits } from '../utils'

type Props = { receipt: PaymentReceipt; onClose: () => void; onCancel: (receipt: PaymentReceipt) => void }

export function ReceiptPreview({ receipt, onClose, onCancel }: Props) {
  const [copied, setCopied] = useState(false)
  const [printing, setPrinting] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onEscape)
    return () => { document.body.style.overflow = original; window.removeEventListener('keydown', onEscape) }
  }, [])

  const issued = new Date(receipt.issuedAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
  const asText = [
    'RECIBO ' + receipt.number,
    receipt.issuer.legalName || receipt.issuer.businessName,
    'Recebemos de ' + receipt.payer.name + ' o valor de ' + money(receipt.payment.amount),
    'Referente a: ' + receipt.description,
    'Data do pagamento: ' + dateBR(receipt.payment.date),
    'Forma: ' + receipt.payment.method,
    'Emitido em: ' + issued,
    receipt.status === 'cancelled' ? 'RECIBO CANCELADO' : ''
  ].filter(Boolean).join('\n')
  const print = async () => {
    setPrinting(true)
    try {
      const logo = document.querySelector<HTMLImageElement>('.receipt-print-root .receipt-brand img')
      if (logo && !logo.complete) await new Promise<void>((resolve) => {
        logo.onload = () => resolve()
        logo.onerror = () => resolve()
        window.setTimeout(resolve, 2000)
      })
      window.print()
    } finally { setPrinting(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(asText); setCopied(true) } catch { setCopied(false) }
  }
  const contact = phoneDigits(receipt.payer.phone)
  const whatsapp = contact
    ? 'https://wa.me/' + (contact.startsWith('55') ? contact : '55' + contact) +
      '?text=' + encodeURIComponent('Olá, ' + receipt.payer.name + '! Seguem os dados do recibo emitido pelo ' +
        receipt.issuer.businessName + '.\n\n' + asText + '\n\nO recibo em PDF pode ser enviado como anexo.')
    : null

  return createPortal(
    <div className="receipt-print-root">
      <div className="receipt-backdrop">
        <div className="receipt-topbar no-print">
          <button className="receipt-back" onClick={onClose}><ChevronLeft size={18} /> Voltar</button>
          <div className="receipt-topbar-title"><span className="eyebrow">COMPROVANTE DE RECEBIMENTO</span>
            <strong>{receipt.number}</strong></div>
          <div className="receipt-topbar-actions">
            <button className="btn btn-quiet" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copiado' : 'Copiar'}</button>
            {whatsapp && receipt.status === 'issued' && <a className="btn btn-quiet" href={whatsapp} target="_blank" rel="noreferrer">
              <Send size={16} /> Texto para WhatsApp
            </a>}
            <button className="btn btn-primary" onClick={print} disabled={printing}>
              <Printer size={16} /> <Download size={15} /> {printing ? 'Preparando...' : 'Imprimir / Salvar PDF'}
            </button>
            <button className="receipt-close" onClick={onClose} title="Fechar prévia"><X size={19}/></button>
          </div>
        </div>
        <article className={'receipt-sheet' + (receipt.status === 'cancelled' ? ' receipt-sheet--cancelled' : '')}>
          {receipt.status === 'cancelled' && <div className="receipt-watermark" aria-label="Recibo cancelado">CANCELADO</div>}
          <header className="receipt-brand">
            <img src={brandMark} alt={'Logomarca ' + receipt.issuer.businessName} />
            <div className="receipt-brand-copy">
              <span className="receipt-eyebrow">DOCUMENTO DE RECEBIMENTO</span>
              <h2>{receipt.issuer.businessName}</h2>
              <strong>{receipt.issuer.legalName}</strong>
              {receipt.issuer.document && <span>CNPJ/CPF: {receipt.issuer.document}</span>}
              {[receipt.issuer.address,receipt.issuer.city].filter(Boolean).length > 0 &&
                <span>{[receipt.issuer.address,receipt.issuer.city].filter(Boolean).join(' · ')}</span>}
              <span>{[receipt.issuer.phone,receipt.issuer.email].filter(Boolean).join(' · ')}</span>
            </div>
          </header>
          <div className="receipt-heading">
            <div><span className="receipt-eyebrow">COMPROVANTE PARTICULAR</span><h1>Recibo de pagamento</h1>
              <p>Declaração de recebimento referente ao serviço contratado.</p></div>
            <div className="receipt-id"><span>RECIBO Nº</span><strong>{receipt.number}</strong>
              <small>{receipt.status === 'issued' ? 'Emitido em ' + issued : 'CANCELADO'}</small></div>
          </div>
          <section className="receipt-value">
            <span>VALOR RECEBIDO</span>
            <strong>{money(receipt.payment.amount)}</strong>
            <p>{amountInWordsBR(receipt.payment.amount)}.</p>
          </section>
          <div className="receipt-details">
            <section><h3>Recebemos de</h3><strong>{receipt.payer.name}</strong>
              {receipt.payer.document && <p>CPF/CNPJ: {receipt.payer.document}</p>}
              {receipt.payer.address && <p>{receipt.payer.address}</p>}
              {receipt.payer.email && <p>{receipt.payer.email}</p>}
            </section>
            <section><h3>Identificação do evento</h3>
              <p>Contrato: <strong>{receipt.event.contractNumber}</strong></p>
              <p>Tipo: <strong>{receipt.event.type}</strong></p>
              <p>Data prevista: <strong>{dateBR(receipt.event.date)}</strong></p>
              {receipt.event.venue && <p>Local: <strong>{receipt.event.venue}</strong></p>}
            </section>
          </div>
          <section className="receipt-purpose"><h3>Referente a</h3><p>{receipt.description}</p></section>
          <section className="receipt-transaction">
            <div><span>DATA DO RECEBIMENTO</span><strong>{dateBR(receipt.payment.date)}</strong></div>
            <div><span>FORMA DE PAGAMENTO</span><strong>{receipt.payment.method}</strong></div>
            {receipt.payment.reference && <div><span>CHEQUE / COMPROVANTE</span><strong>{receipt.payment.reference}</strong></div>}
          </section>
          {receipt.payment.notes && <p className="receipt-notes">Observações registradas: {receipt.payment.notes}</p>}
          <p className="receipt-declaration">
            Declaramos ter recebido do(a) pagador(a) acima identificado(a) o valor indicado neste recibo,
            referente exclusivamente ao pagamento descrito. Este documento não representa quitação integral
            de outros valores eventualmente devidos.
          </p>
          <div className="receipt-signature"><span className="receipt-sign-line"/>
            <strong>{receipt.issuer.legalName || receipt.issuer.businessName}</strong>
            <span>Responsável pelo recebimento</span>
          </div>
          {receipt.status === 'cancelled' && <div className="receipt-cancellation">
            <strong>RECIBO CANCELADO</strong>
            <p>Cancelado em {receipt.cancelledAt ? new Date(receipt.cancelledAt).toLocaleString('pt-BR') : 'data não informada'}.
              Motivo: {receipt.cancelReason || 'Não informado'}.</p>
          </div>}
          <footer className="receipt-footer"><span>{receipt.issuer.businessName} · {receipt.number}</span>
            <span>Documento de controle financeiro — não substitui nota fiscal.</span></footer>
        </article>
        <div className="receipt-bottom no-print">
          <div>Os dados deste recibo foram preservados na data de emissão. Para enviar o PDF, salve-o e anexe ao WhatsApp ou e-mail.</div>
          <div>{receipt.status === 'issued' && <button className="receipt-cancel-btn" onClick={() => onCancel(receipt)}>Cancelar recibo</button>}
            <button className="btn btn-primary" onClick={print}><Printer size={16}/> Imprimir / Salvar PDF</button></div>
        </div>
      </div>
    </div>,
    document.body
  )
}
