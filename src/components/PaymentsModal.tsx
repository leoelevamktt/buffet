import { useState } from 'react'
import { Check, CircleDollarSign, Plus, Trash2, X } from 'lucide-react'
import type { BuffetEvent, ReceivedPayment } from '../types'
import { dateBR, initialReceivedPayments, money } from '../utils'
import { uid } from '../storage'

type Props = {
  event: BuffetEvent
  total: number
  onClose: () => void
  onSave: (id: string, payments: ReceivedPayment[]) => Promise<void>
}

export function PaymentsModal({ event, total, onClose, onSave }: Props) {
  const [payments, setPayments] = useState<ReceivedPayment[]>(() => initialReceivedPayments(event))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const received = payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const balance = Math.max(0, total - received)
  const change = (id: string, patch: Partial<ReceivedPayment>) =>
    setPayments((old) => old.map((payment) => payment.id === id ? { ...payment, ...patch } : payment))
  const add = () => setPayments((old) => [...old, {
    id: uid('pay'), date: new Date().toISOString().slice(0, 10),
    method: 'PIX', amount: 0, reference: '', notes: ''
  }])
  const save = async () => {
    setError('')
    if (payments.some((payment) => (!payment.date && !payment.id.startsWith('legacy-')) || !(payment.amount > 0))) {
      setError('Informe a data e um valor positivo para cada novo recebimento.')
      return
    }
    setSaving(true)
    try { await onSave(event.id, payments) }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao salvar.') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop finance-modal-backdrop">
      <section className="finance-modal" role="dialog" aria-modal="true" aria-label="Recebimentos do evento">
        <header className="finance-modal-header">
          <div><span className="eyebrow">FINANCEIRO DO EVENTO</span><h2>Recebimentos</h2>
            <p>{event.clientName} · {event.contractNumber}</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>
        <div className="finance-summary">
          <div><span>Valor contratado</span><strong>{money(total)}</strong></div>
          <div><span>Total recebido</span><strong>{money(received)}</strong></div>
          <div><span>Saldo a receber</span><strong>{money(balance)}</strong></div>
        </div>
        {event.contractStatus === 'Assinado' && <p className="finance-notice">
          Novos recebimentos serão registrados no extrato administrativo, sem modificar o contrato já assinado.
        </p>}
        {payments.some((payment) => payment.id.startsWith('legacy-') && !payment.date) && (
          <p className="finance-notice">Existe um sinal antigo sem data informada. Você pode registrar novos pagamentos e atualizar essa data quando a confirmar.</p>
        )}
        <div className="finance-ledger">
          {payments.map((payment, index) => (
            <div className="finance-entry" key={payment.id}>
              <div className="finance-entry-title">
                <strong>Recebimento {index + 1}</strong>
                <button className="icon-button danger" onClick={() => {
                  if (window.confirm('Excluir este recebimento do histórico?'))
                    setPayments((old) => old.filter((item) => item.id !== payment.id))
                }} aria-label="Excluir recebimento"><Trash2 size={17} /></button>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Data de recebimento</label><input type="date" value={payment.date} onChange={(e) => change(payment.id, { date: e.target.value })} /></div>
                <div className="field"><label>Valor recebido (R$)</label><input type="number" min="0.01" step="0.01" value={payment.amount || ''} onChange={(e) => change(payment.id, { amount: Number(e.target.value) })} /></div>
                <div className="field"><label>Forma de pagamento</label><select value={payment.method} onChange={(e) => change(payment.id, { method: e.target.value })}>
                  {['PIX', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência', 'Depósito', 'Cheque', 'Outro', 'A confirmar'].map((method) => <option key={method}>{method}</option>)}
                </select></div>
                <div className="field"><label>Nº do cheque / comprovante</label><input value={payment.reference || ''} onChange={(e) => change(payment.id, { reference: e.target.value })} placeholder="Opcional" /></div>
                <div className="field span-2"><label>Observações</label><input value={payment.notes || ''} onChange={(e) => change(payment.id, { notes: e.target.value })} placeholder="Opcional" /></div>
              </div>
            </div>
          ))}
          {!payments.length && <div className="finance-empty">Nenhum pagamento recebido foi registrado.</div>}
        </div>
        <button className="btn btn-quiet" onClick={add}><Plus size={17} /> Adicionar recebimento</button>
        <p className="finance-help">Cada pagamento terá data, valor e forma de pagamento. As parcelas previstas do contrato não contam como valores recebidos.</p>
        {error && <p className="finance-error">{error}</p>}
        <footer className="finance-modal-footer">
          <button className="btn btn-quiet" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Check size={17} /> {saving ? 'Salvando...' : 'Salvar recebimentos'}</button>
        </footer>
      </section>
    </div>
  )
}
