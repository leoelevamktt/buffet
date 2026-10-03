import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, Copy, Download, Printer, Send, X, Pencil, Trash2, Image as ImageIcon, FileDown } from 'lucide-react'
import { buildReceiptFile, downloadReceiptFile, receiptWhatsAppUrl, shareReceiptFile, type ReceiptFileType } from '../receiptFiles'
import { brandMark } from '../brand'
import { amountInWordsBR, type PaymentReceipt } from '../receipts'
import { dateBR, money } from '../utils'

type Props = { receipt: PaymentReceipt; onClose: () => void; onCancel: (receipt: PaymentReceipt) => void;
  onEdit: (receipt: PaymentReceipt) => void; onDelete: (receipt: PaymentReceipt) => void }

export function ReceiptPreview({ receipt, onClose, onCancel, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [fileAction, setFileAction] = useState('')
  const [fileFeedback, setFileFeedback] = useState('')
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
    receipt.status === 'cancelled' ? 'RECIBO CANCELADO' : receipt.status === 'deleted' ? 'RECIBO EXCLUÍDO' : ''
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
  const handleFile = async (type: ReceiptFileType, share: boolean) => {
    setFileAction((share ? 'share-' : 'save-') + type)
    setFileFeedback('')
    try {
      const sheet = document.querySelector<HTMLElement>('.receipt-print-root .receipt-sheet')
      if (!sheet) throw new Error('A prévia do recibo não foi encontrada.')
      const file = await buildReceiptFile(receipt, sheet, type)
      if (share) {
        const result = await shareReceiptFile(file, receipt)
        setFileFeedback(result === 'downloaded'
          ? 'Arquivo salvo no dispositivo. Use o botão “Abrir WhatsApp” abaixo para anexá-lo à conversa.'
          : result === 'shared' ? 'Compartilhamento concluído.' : 'Compartilhamento cancelado.')
      } else {
        downloadReceiptFile(file)
        setFileFeedback(type === 'pdf' ? 'PDF gerado e salvo.' : 'Imagem PNG gerada e salva.')
      }
    } catch (error) {
      setFileFeedback(error instanceof Error ? error.message : 'Não foi possível gerar o arquivo.')
    } finally { setFileAction('') }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(asText); setCopied(true) } catch { setCopied(false) }
  }
  const whatsapp = receiptWhatsAppUrl(receipt)

  return createPortal(
    <div className="receipt-print-root">
      <div className="receipt-backdrop">
        <div className="receipt-topbar no-print">
          <button className="receipt-back" onClick={onClose}><ChevronLeft size={18} /> Voltar</button>
          <div className="receipt-topbar-title"><span className="eyebrow">COMPROVANTE DE RECEBIMENTO</span>
            <strong>{receipt.number}</strong></div>
          <div className="receipt-topbar-actions">
            <button className="btn btn-quiet" onClick={copy}><Copy size={15}/>{copied ? 'Copiado' : 'Copiar dados'}</button>
            {receipt.status === 'issued' && <button className="btn btn-quiet" onClick={() => onEdit(receipt)}><Pencil size={16}/> Editar</button>}
            <button className="btn btn-quiet" disabled={Boolean(fileAction)} onClick={() => void handleFile('pdf', false)}>
              <FileDown size={16}/> Baixar PDF</button>
            <button className="btn btn-quiet" disabled={Boolean(fileAction)} onClick={() => void handleFile('image', false)}>
              <ImageIcon size={16}/> Baixar imagem</button>
            {receipt.status === 'issued' && <>
              <button className="btn btn-primary" disabled={Boolean(fileAction)} onClick={() => void handleFile('pdf', true)}>
                <Send size={16}/> WhatsApp PDF</button>
              <button className="btn btn-primary" disabled={Boolean(fileAction)} onClick={() => void handleFile('image', true)}>
                <Send size={16}/> WhatsApp imagem</button>
            </>}
            <button className="btn btn-quiet" onClick={print} disabled={printing}>
              <Printer size={16}/> {printing ? 'Preparando...' : 'Imprimir'}</button>
            <button className="receipt-close" onClick={onClose} title="Fechar prévia"><X size={19}/></button>
          </div>
        </div>
        <article className={'receipt-sheet' + (receipt.status !== 'issued' ? ' receipt-sheet--cancelled' : '')}>
          {receipt.status !== 'issued' && <div className="receipt-watermark" aria-label="Recibo arquivado">{receipt.status === 'deleted' ? 'EXCLUÍDO' : 'CANCELADO'}</div>}
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
              <small>{receipt.status === 'issued' ? 'Emitido em ' + issued : receipt.status === 'deleted' ? 'EXCLUÍDO' : 'CANCELADO'}</small>
              {receipt.updatedAt && <small>Retificado em {new Date(receipt.updatedAt).toLocaleDateString('pt-BR')}</small>}</div>
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
          {receipt.status === 'deleted' && <div className="receipt-cancellation"><strong>RECIBO EXCLUÍDO DO PAINEL</strong>
            <p>Excluído em {receipt.deletedAt ? new Date(receipt.deletedAt).toLocaleString('pt-BR') : 'data não informada'}.
              Motivo: {receipt.deletedReason || 'Não informado'}. O histórico permanece para auditoria.</p></div>}
          <footer className="receipt-footer"><span>{receipt.issuer.businessName} · {receipt.number}</span>
            <span>Documento de controle financeiro — não substitui nota fiscal.</span></footer>
        </article>
        <div className="receipt-bottom no-print">
          <div><span>Compartilhamento:</span> no celular, use WhatsApp PDF ou imagem para enviar o próprio arquivo.
            No computador, o arquivo será baixado; depois, anexe-o à conversa no WhatsApp.
            {fileFeedback && <p className="receipt-file-feedback" role="status">{fileFeedback}</p>}
            {fileAction && <p className="receipt-file-feedback">Preparando {fileAction.includes('pdf') ? 'PDF' : 'imagem'} com a logo...</p>}
            {receipt.revisions?.length ? <p className="receipt-file-feedback">{receipt.revisions.length} alteração(ões) preservada(s) no histórico.</p> : null}
          </div>
          <div className="receipt-bottom-actions">
            {receipt.status !== 'deleted' && <button className="receipt-delete-btn" onClick={() => onDelete(receipt)}><Trash2 size={15}/> Excluir recibo</button>}
            {receipt.status === 'issued' && <button className="receipt-cancel-btn" onClick={() => onCancel(receipt)}>Cancelar recibo</button>}
            {receipt.status === 'issued' && <a className="btn btn-quiet" href={whatsapp} target="_blank" rel="noreferrer">
              <Send size={16}/> Abrir WhatsApp</a>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
