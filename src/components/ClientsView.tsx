import { useMemo, useState } from 'react'
import { CalendarPlus, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2, UserRound, Users, X } from 'lucide-react'
import type { BuffetEvent, Client } from '../types'
import { uid } from '../storage'

type Props = {
  clients: Client[]
  events: BuffetEvent[]
  onChange: (clients: Client[]) => void
  onStartEvent: (clientId: string) => void
  notify: (message: string) => void
}

const blank = (): Client => ({
  id: uid('client'),
  name: '',
  document: '',
  rg: '',
  address: '',
  email: '',
  phone: '',
  phoneSecondary: '',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

export function ClientsView({ clients, events, onChange, onStartEvent, notify }: Props) {
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Client | null>(null)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase()
    if (!key) return clients
    return clients.filter((client) =>
      [client.name, client.document, client.rg || '', client.email, client.phone, client.phoneSecondary || '', client.address || '']
        .join(' ').toLowerCase().includes(key))
  }, [clients, query])

  const eventCount = (clientId: string) => events.filter((event) => event.clientId === clientId).length
  const lastEvent = (clientId: string) => events.filter((event) => event.clientId === clientId)
    .sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''))[0]

  const save = () => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) { setError('Informe o nome do cliente.'); return }
    const normalized = {
      ...draft,
      name,
      document: draft.document.trim(),
      rg: draft.rg?.trim() || undefined,
      address: draft.address?.trim() || undefined,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      phoneSecondary: draft.phoneSecondary?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }
    const duplicate = clients.find((item) => item.id !== normalized.id && (
      (normalized.document && item.document.replace(/\D/g, '') === normalized.document.replace(/\D/g, '')) ||
      (normalized.email && item.email.toLowerCase() === normalized.email.toLowerCase()) ||
      (normalized.phone && item.phone.replace(/\D/g, '') === normalized.phone.replace(/\D/g, ''))
    ))
    if (duplicate) {
      setError('Já existe outro cliente com o mesmo CPF/CNPJ, e-mail ou telefone principal.')
      return
    }
    const exists = clients.some((item) => item.id === normalized.id)
    onChange(exists
      ? clients.map((item) => item.id === normalized.id ? normalized : item)
      : [normalized, ...clients])
    setDraft(null)
    setError('')
    notify(exists ? 'Cadastro do cliente atualizado.' : 'Cliente cadastrado.')
  }

  const remove = (client: Client) => {
    const linked = eventCount(client.id)
    if (linked) {
      setError('Este cliente possui ' + linked + ' evento(s) vinculado(s). O cadastro foi mantido para preservar o histórico.')
      return
    }
    if (!window.confirm('Excluir o cadastro de ' + client.name + '?')) return
    onChange(clients.filter((item) => item.id !== client.id))
    notify('Cliente removido.')
  }

  return (
    <>
      <div className="section-intro clients-heading">
        <div><span className="eyebrow">RELACIONAMENTO</span><h2>Clientes</h2>
          <p>Cadastros reutilizáveis para preencher novos eventos sem digitar os mesmos dados novamente.</p></div>
        <button className="btn btn-primary" onClick={() => { setDraft(blank()); setError('') }}><Plus size={17}/> Novo cliente</button>
      </div>

      <div className="clients-stats">
        <div><Users size={18}/><span>Clientes cadastrados</span><strong>{clients.length}</strong></div>
        <div><CalendarPlus size={18}/><span>Eventos vinculados</span><strong>{events.filter((event) => event.clientId).length}</strong></div>
      </div>

      <section className="panel clients-panel">
        <div className="clients-tools">
          <label><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone" /></label>
        </div>
        {error && !draft && <p className="clients-error">{error}</p>}
        <div className="clients-grid">
          {filtered.map((client) => {
            const linked = eventCount(client.id)
            const recent = lastEvent(client.id)
            return <article className="client-card" key={client.id}>
              <div className="client-card-head">
                <div className="client-avatar"><UserRound size={19}/></div>
                <div><strong>{client.name}</strong><span>{client.document || 'Documento não informado'}</span></div>
                <span className="client-events-count">{linked} evento{linked === 1 ? '' : 's'}</span>
              </div>
              <div className="client-contact-list">
                <p><Phone size={14}/><span>{[client.phone, client.phoneSecondary].filter(Boolean).join(' · ') || 'Telefone não informado'}</span></p>
                <p><Mail size={14}/><span>{client.email || 'E-mail não informado'}</span></p>
                <p><MapPin size={14}/><span>{client.address || 'Endereço não informado'}</span></p>
              </div>
              {recent && <div className="client-last-event"><span>Evento mais recente</span><strong>{recent.eventType} · {recent.eventDate ? new Date(recent.eventDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'sem data'}</strong></div>}
              {client.notes && <p className="client-notes">{client.notes}</p>}
              <footer className="client-card-actions">
                <button className="btn btn-quiet" onClick={() => onStartEvent(client.id)}><CalendarPlus size={15}/> Criar evento</button>
                <button className="icon-button" title="Editar cliente" onClick={() => { setDraft({ ...client }); setError('') }}><Pencil size={16}/></button>
                <button className="icon-button danger" title="Excluir cliente" onClick={() => remove(client)}><Trash2 size={16}/></button>
              </footer>
            </article>
          })}
        </div>
        {!filtered.length && <div className="clients-empty">Nenhum cliente encontrado.</div>}
      </section>

      {draft && <div className="modal-backdrop client-editor-backdrop">
        <div className="client-editor-modal">
          <button className="modal-close" onClick={() => { setDraft(null); setError('') }}><X size={20}/></button>
          <span className="eyebrow">{clients.some((item) => item.id === draft.id) ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'}</span>
          <h2>{clients.some((item) => item.id === draft.id) ? 'Atualizar cadastro' : 'Cadastrar cliente'}</h2>
          <p className="lead">Estes dados poderão ser reutilizados em qualquer novo evento.</p>
          <div className="form-grid two">
            <div className="field span-2"><label>Nome completo / Razão social *</label><input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/></div>
            <div className="field"><label>CPF / CNPJ</label><input value={draft.document} onChange={(e) => setDraft({ ...draft, document: e.target.value })}/></div>
            <div className="field"><label>RG</label><input value={draft.rg || ''} onChange={(e) => setDraft({ ...draft, rg: e.target.value })}/></div>
            <div className="field"><label>E-mail</label><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}/></div>
            <div className="field"><label>WhatsApp principal</label><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}/></div>
            <div className="field"><label>Telefone adicional</label><input value={draft.phoneSecondary || ''} onChange={(e) => setDraft({ ...draft, phoneSecondary: e.target.value })}/></div>
            <div className="field span-2"><label>Endereço</label><input value={draft.address || ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })}/></div>
            <div className="field span-2"><label>Observações do cliente</label><textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Preferências, observações de contato ou informações internas."/></div>
          </div>
          {error && <p className="clients-error">{error}</p>}
          <div className="form-actions"><button className="btn btn-quiet" onClick={() => { setDraft(null); setError('') }}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={!draft.name.trim()}>Salvar cliente</button></div>
        </div>
      </div>}
    </>
  )
}
