import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { ServiceItem } from '../types'
import { uid } from '../storage'

type Props = { initial?: ServiceItem; onSave: (service: ServiceItem) => void; onClose: () => void }
export function ServiceEditor({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [price, setPrice] = useState(initial?.price || 0)
  const [pricing, setPricing] = useState<ServiceItem['pricing']>(initial?.pricing || 'fixed')
  const valid = name.trim().length > 0 && Number.isFinite(price) && price >= 0
  const save = () => {
    if (!valid) return
    onSave({ id: initial?.id || uid('service'), name: name.trim(), description: description.trim(),
      price, pricing })
  }
  return (
    <div className="modal-backdrop service-editor-backdrop">
      <section className="finance-modal service-catalog-modal" role="dialog" aria-modal="true" aria-label="Cadastro de serviço">
        <header className="finance-modal-header">
          <div><span className="eyebrow">CATÁLOGO DE SERVIÇOS</span>
            <h2>{initial ? 'Editar serviço' : 'Novo serviço'}</h2>
            <p>Cadastre e altere o preço-base. Cada evento poderá negociar outro valor.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>
        <div className="form-grid two">
          <div className="field span-2"><label>Nome do serviço *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: DJ, fotografia, recreação" /></div>
          <div className="field span-2"><label>Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="field"><label>Preço-base (R$)</label>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} /></div>
          <div className="field"><label>Forma de cobrança</label>
            <select value={pricing} onChange={(e) => setPricing(e.target.value as ServiceItem['pricing'])}>
              <option value="fixed">Preço por unidade</option><option value="person">Por convidado</option>
            </select></div>
        </div>
        <footer className="finance-modal-footer">
          <button className="btn btn-quiet" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}><Check size={17} /> Salvar serviço</button>
        </footer>
      </section>
    </div>
  )
}
