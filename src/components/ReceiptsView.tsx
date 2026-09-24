import { useMemo, useState } from 'react'
import { ArrowRight, FileCheck2, FileText, ReceiptText, Search } from 'lucide-react'
import type { BuffetEvent } from '../types'
import type { PaymentReceipt } from '../receipts'
import { dateBR, money } from '../utils'

interface Props {
  receipts: PaymentReceipt[]
  events: BuffetEvent[]
  onPreview: (id: string) => void
  onOpenPayments: (eventId: string) => void
  onGoEvents: () => void
}

export function ReceiptsView({ receipts, events, onPreview, onOpenPayments, onGoEvents }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'issued' | 'cancelled'>('all')
  const active = receipts.filter((item) => item.status === 'issued')
  const total = active.reduce((sum, item) => sum + item.payment.amount, 0)
  const rows = useMemo(() => receipts
    .filter((item) => filter === 'all' || item.status === filter)
    .filter((item) => {
      const text = [item.number,item.payer.name,item.event.contractNumber,item.payment.method,item.description]
        .join(' ').toLocaleLowerCase('pt-BR')
      return text.includes(query.trim().toLocaleLowerCase('pt-BR'))
    })
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)), [receipts,filter,query])
  const eventChoices = events.filter((event) =>
    (event.receivedPayments || (event.deposit > 0 ? [{ id: 'legacy-' + event.id }] : [])).length)

  return (
    <div className="receipts-section">
      <div className="section-intro">
        <div><span className="eyebrow">GESTÃO FINANCEIRA</span><h2>Recibos de pagamento</h2>
          <p>Emita, visualize e imprima comprovantes individuais de pagamentos registrados.</p></div>
        <button className="btn btn-primary" onClick={onGoEvents}><ReceiptText size={17}/> Emitir a partir dos eventos</button>
      </div>
      <div className="receipt-metrics">
        <div><ReceiptText size={20}/><span>Emitidos e ativos</span><strong>{active.length}</strong></div>
        <div><FileCheck2 size={20}/><span>Valor documentado</span><strong>{money(total)}</strong></div>
        <div><FileText size={20}/><span>Cancelados</span><strong>{receipts.filter((item) => item.status === 'cancelled').length}</strong></div>
      </div>
      {eventChoices.length > 0 && <div className="receipt-shortcuts">
        <strong>Gerar recibo de um pagamento</strong>
        <div>{eventChoices.slice(0, 5).map((event) =>
          <button key={event.id} onClick={() => onOpenPayments(event.id)}>
            {event.clientName} <span>{event.contractNumber}</span><ArrowRight size={14}/>
          </button>)}</div>
      </div>}
      <section className="panel receipt-list-panel">
        <div className="receipt-filters">
          <div className="filter-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar número, cliente, contrato..." aria-label="Buscar recibos"/></div>
          <div className="receipt-tabs">
            {([['all','Todos'],['issued','Ativos'],['cancelled','Cancelados']] as const).map(([id,label])=>
              <button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}
          </div>
        </div>
        {rows.length===0 ? <div className="receipt-empty">
          <ReceiptText size={36}/><h3>{receipts.length ? 'Nenhum recibo encontrado' : 'Você ainda não emitiu recibos'}</h3>
          <p>Registre o recebimento de um pagamento e escolha “Emitir recibo” no histórico financeiro do evento.</p>
          <button className="btn btn-quiet" onClick={onGoEvents}>Ver eventos <ArrowRight size={15}/></button>
        </div> : <div className="receipt-results">
          {rows.map((receipt)=>
            <button className="receipt-result" key={receipt.id} onClick={()=>onPreview(receipt.id)}>
              <div className="receipt-result-icon"><ReceiptText size={21}/></div>
              <div className="receipt-result-person"><strong>{receipt.payer.name}</strong>
                <small>{receipt.number} · {receipt.event.contractNumber} · Pago em {dateBR(receipt.payment.date)}</small></div>
              <div className="receipt-result-amount"><strong>{money(receipt.payment.amount)}</strong>
                <span className={'receipt-state '+(receipt.status==='issued'?'issued':'cancelled')}>{receipt.status==='issued'?'Emitido':'Cancelado'}</span></div>
              <ArrowRight size={17}/>
            </button>)}
        </div>}
      </section>
      <p className="receipt-storage-notice">Os recibos ficam armazenados neste navegador. Guarde os PDFs emitidos e mantenha um backup dos dados administrativos.</p>
    </div>
  )
}
