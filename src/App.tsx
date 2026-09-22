import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardSignature, FileSignature,
  LayoutDashboard, Menu as MenuIcon, Plus, Search, Settings, Sparkles, Users,
  UtensilsCrossed, X, Printer, Send, PenLine, Trash2, MoreHorizontal, MapPin,
  Clock3, CalendarCheck, WalletCards, ArrowUpRight, CheckCircle2, CircleDollarSign,
  UserRound, Building2, Phone, Mail, FileText, ChevronDown
} from 'lucide-react'
import { defaultEvents, defaultMenus, defaultServices, defaultSettings } from './data'
import { contractTemplates, getContractTemplate } from './materials'
import { getSourceMaterialText } from './sourceMaterials'
import { useLocalStorage, uid } from './storage'
import type { BuffetEvent, BusinessSettings, ContractTemplate, MenuItem, Section, ServiceItem } from './types'
import { contractSequence, dateBR, eventTotal, money, phoneDigits, shortDate, statusClass } from './utils'
import { brandMark } from './brand'
import './styles.css'

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'events', label: 'Eventos', icon: Sparkles },
  { id: 'menus', label: 'Cardápios', icon: UtensilsCrossed },
  { id: 'contracts', label: 'Contratos', icon: FileSignature },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'settings', label: 'Configurações', icon: Settings }
]

const eventTypes = ['Casamento', 'Aniversário', 'Corporativo', 'Confraternização', 'Formatura', 'Outro']

interface RemoteContract {
  token: string
  status: 'pending' | 'signed'
  createdAt: string
  signedAt?: string
  event: BuffetEvent
  menu: MenuItem | null
  services: ServiceItem[]
  settings: BusinessSettings
  total: number
  contractTemplate?: ContractTemplate
  signature?: NonNullable<BuffetEvent['signature']> | null
}

interface RemoteQuote {
  token: string
  createdAt: string
  expiresAt: string
  event: BuffetEvent
  menu: MenuItem | null
  services: ServiceItem[]
  settings: BusinessSettings
  total: number
  contractTemplate?: ContractTemplate
}

function AdminApp() {
  const [section, setSection] = useState<Section>('dashboard')
  const [events, setEvents] = useLocalStorage<BuffetEvent[]>('maison-events', defaultEvents)
  const [menus, setMenus] = useLocalStorage<MenuItem[]>('maison-menus', defaultMenus)
  const [services, setServices] = useLocalStorage<ServiceItem[]>('maison-services', defaultServices)
  const [settings, setSettings] = useLocalStorage<BusinessSettings>('maison-settings', defaultSettings)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [menuEditorOpen, setMenuEditorOpen] = useState(false)
  const [activeContractId, setActiveContractId] = useState<string | null>(null)
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const activeContract = events.find((item) => item.id === activeContractId)
  const activeQuote = events.find((item) => item.id === activeQuoteId)

  useEffect(() => {
    const migrationKey = 'akela-materials-2027-v2-complete'
    if (window.localStorage.getItem(migrationKey)) return

    const legacyMenuIds = new Set(['menu-classico', 'menu-celebracao', 'menu-signature', 'menu-coquetel'])
    setMenus((current) => {
      const custom = current.filter((menu) => !legacyMenuIds.has(menu.id) && !defaultMenus.some((official) => official.id === menu.id))
      const official = defaultMenus.map((source) => {
        const previous = current.find((menu) => menu.id === source.id)
        return {
          ...source,
          pricePerPerson: previous?.pricePerPerson ?? source.pricePerPerson,
          active: previous?.active ?? source.active
        }
      })
      return [...official, ...custom]
    })
    setEvents((current) => current.map((event) => {
      if (event.id === 'event-demo-1') return { ...defaultEvents[0] }
      const officialMenu = defaultMenus.find((menu) => menu.id === event.menuId)
      const paymentSchedule = event.paymentSchedule?.length
        ? event.paymentSchedule
        : Array.from({ length: 5 }, () => ({ date: '', checkNumber: '', amount: 0 }))
      if (officialMenu) {
        return {
          ...event,
          contractTemplateId: officialMenu.contractTemplateId,
          menuPricePerPerson: event.menuPricePerPerson ?? officialMenu.pricePerPerson,
          cakeDescription: event.cakeDescription || '',
          paymentMethod: event.paymentMethod || '',
          paymentSchedule
        }
      }
      if (event.contractTemplateId === 'akela-services-2027') {
        return { ...event, contractTemplateId: 'akela-infinity-2027', paymentSchedule }
      }
      return { ...event, paymentSchedule }
    }))
    setSettings((current) => current.businessName === 'Maison Buffet' ? defaultSettings : current)
    window.localStorage.setItem(migrationKey, '1')
  }, [setMenus, setEvents, setSettings])

  useEffect(() => {
    const syncPendingContracts = async () => {
      const pending = events.filter((item) => item.shareToken && item.contractStatus !== 'Assinado')
      if (!pending.length) return

      const results = await Promise.all(pending.map(async (item) => {
        try {
          const response = await fetch('/api/contracts?token=' + encodeURIComponent(item.shareToken!), { cache: 'no-store' })
          if (!response.ok) return null
          const data = await response.json()
          return data.contract?.status === 'signed' ? { id: item.id, signature: data.contract.signature } : null
        } catch {
          return null
        }
      }))

      const signed = results.filter(Boolean) as { id: string; signature: NonNullable<BuffetEvent['signature']> }[]
      if (!signed.length) return

      setEvents((current) => current.map((item) => {
        const remote = signed.find((result) => result.id === item.id)
        return remote ? { ...item, signature: remote.signature, contractStatus: 'Assinado' as const, status: 'Confirmado' as const } : item
      }))
    }

    void syncPendingContracts()
    const timer = window.setInterval(() => void syncPendingContracts(), 30000)
    return () => window.clearInterval(timer)
  }, [events, setEvents])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const createEvent = (event: BuffetEvent) => {
    setEvents((current) => [event, ...current])
    setWizardOpen(false)
    notify('Evento criado e contrato preparado.')
    setSection('events')
  }

  const deleteEvent = (id: string) => {
    if (!window.confirm('Excluir este evento e o contrato relacionado?')) return
    setEvents((current) => current.filter((item) => item.id !== id))
    notify('Evento removido.')
  }

  const updateEvent = (id: string, patch: Partial<BuffetEvent>) => {
    setEvents((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  return (
    <div className="app-shell">
      <Sidebar section={section} onNavigate={setSection} onNewEvent={() => setWizardOpen(true)} settings={settings} />
      <main className="main">
        <Topbar section={section} onNewEvent={() => setWizardOpen(true)} />
        <div className="page">
          {section === 'dashboard' && (
            <Dashboard events={events} menus={menus} services={services} onNavigate={setSection} onOpenContract={setActiveContractId} />
          )}
          {section === 'events' && (
            <EventsView events={events} menus={menus} services={services} onNew={() => setWizardOpen(true)} onOpenContract={setActiveContractId} onOpenQuote={setActiveQuoteId} onDelete={deleteEvent} />
          )}
          {section === 'menus' && (
            <MenusView menus={menus} services={services} setMenus={setMenus} setServices={setServices} onNewMenu={() => setMenuEditorOpen(true)} notify={notify} />
          )}
          {section === 'contracts' && (
            <ContractsView events={events} menus={menus} services={services} onOpen={setActiveContractId} />
          )}
          {section === 'agenda' && <AgendaView events={events} />}
          {section === 'settings' && <SettingsView settings={settings} setSettings={setSettings} notify={notify} />}
        </div>
      </main>

      <MobileNav section={section} onNavigate={setSection} onNewEvent={() => setWizardOpen(true)} />

      {wizardOpen && (
        <EventWizard events={events} menus={menus} services={services} onClose={() => setWizardOpen(false)} onSave={createEvent} />
      )}
      {menuEditorOpen && (
        <MenuEditor onClose={() => setMenuEditorOpen(false)} onSave={(menu) => {
          setMenus((current) => [...current, menu])
          setMenuEditorOpen(false)
          notify('Novo cardápio adicionado.')
        }} />
      )}
      {activeQuote && (
        <QuoteModal
          event={activeQuote}
          menus={menus}
          services={services}
          settings={settings}
          onClose={() => setActiveQuoteId(null)}
          onUpdate={(patch) => updateEvent(activeQuote.id, patch)}
          notify={notify}
        />
      )}
      {activeContract && (
        <ContractModal
          event={activeContract}
          menus={menus}
          services={services}
          settings={settings}
          onClose={() => setActiveContractId(null)}
          onUpdate={(patch) => updateEvent(activeContract.id, patch)}
          notify={notify}
        />
      )}

      {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  )
}

function Sidebar({ section, onNavigate, onNewEvent, settings }: {
  section: Section
  onNavigate: (section: Section) => void
  onNewEvent: () => void
  settings: BusinessSettings
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-emblem" src={brandMark} alt="Buffet Akela" />
        <div><strong>{settings.businessName}</strong><span>Eventos & contratos</span></div>
      </div>
      <button className="new-event-button" onClick={onNewEvent}><Plus size={18} /> Novo evento</button>
      <nav className="side-nav">
        <span className="nav-label">ESPAÇO DE TRABALHO</span>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={section === id ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(id)}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">MB</div>
        <div><strong>Administração</strong><span>Dados salvos localmente</span></div>
      </div>
    </aside>
  )
}

function MobileNav({ section, onNavigate, onNewEvent }: {
  section: Section
  onNavigate: (section: Section) => void
  onNewEvent: () => void
}) {
  const items = navItems.slice(0, 4)
  return (
    <nav className="mobile-nav">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} className={section === id ? 'active' : ''} onClick={() => onNavigate(id)}>
          <Icon size={19} /><span>{label}</span>
        </button>
      ))}
      <button className="mobile-add" onClick={onNewEvent}><Plus size={22} /></button>
    </nav>
  )
}

function Topbar({ section, onNewEvent }: { section: Section; onNewEvent: () => void }) {
  const current = navItems.find((item) => item.id === section)
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">GESTÃO AKELA</span>
        <h1>{current?.label}</h1>
      </div>
      <div className="topbar-actions">
        <div className="global-search"><Search size={17} /><input placeholder="Buscar evento, cliente..." /></div>
        <button className="btn btn-primary desktop-only" onClick={onNewEvent}><Plus size={17} /> Novo evento</button>
      </div>
    </header>
  )
}

function Dashboard({ events, menus, services, onNavigate, onOpenContract }: {
  events: BuffetEvent[]
  menus: MenuItem[]
  services: ServiceItem[]
  onNavigate: (section: Section) => void
  onOpenContract: (id: string) => void
}) {
  const now = new Date()
  const upcoming = [...events].filter((item) => new Date(item.eventDate + 'T23:59:00') >= now).sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  const confirmed = events.filter((item) => item.status === 'Confirmado')
  const signed = events.filter((item) => item.contractStatus === 'Assinado')
  const revenue = confirmed.reduce((sum, event) => sum + eventTotal(event, menus, services), 0)
  const proposals = events.filter((item) => item.status === 'Proposta')
  const proposalValue = proposals.reduce((sum, event) => sum + eventTotal(event, menus, services), 0)
  const pipelineValue = events.reduce((sum, event) => sum + eventTotal(event, menus, services), 0)
  const deposits = events.reduce((sum, event) => sum + (event.deposit || 0), 0)
  const receivable = confirmed.reduce((sum, event) => sum + Math.max(0, eventTotal(event, menus, services) - (event.deposit || 0)), 0)
  const averageTicket = confirmed.length ? revenue / confirmed.length : 0
  const conversion = events.length ? Math.round((signed.length / events.length) * 100) : 0
  const confirmedGuests = confirmed.reduce((sum, event) => sum + event.guests, 0)
  const averagePerGuest = confirmedGuests ? revenue / confirmedGuests : 0
  const guests = upcoming.reduce((sum, event) => sum + event.guests, 0)
  const bars = useMemo(() => {
    const values = Array.from({ length: 6 }, (_, offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      const total = events.filter((item) => {
        const eventDate = new Date(item.eventDate + 'T12:00:00')
        return eventDate.getMonth() === d.getMonth() && eventDate.getFullYear() === d.getFullYear()
      }).reduce((sum, item) => sum + eventTotal(item, menus, services), 0)
      return { label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), total }
    })
    const max = Math.max(...values.map((item) => item.total), 1)
    return values.map((item) => ({ ...item, height: Math.max(8, (item.total / max) * 100) }))
  }, [events, menus, services])

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">OPERAÇÃO DE EVENTOS</span>
          <h2>Seu próximo evento,<br /><em>sem improviso.</em></h2>
          <p>Orçamentos, cardápios, contratos e agenda conectados em um único fluxo de trabalho.</p>
        </div>
        <div className="hero-date">
          <CalendarCheck size={21} />
          <div><span>Próximo compromisso</span><strong>{upcoming[0] ? shortDate(upcoming[0].eventDate) + ' · ' + upcoming[0].startTime : 'Agenda livre'}</strong></div>
        </div>
      </section>

      <div className="metric-grid">
        <Metric icon={CircleDollarSign} label="Receita confirmada" value={money(revenue)} note={confirmed.length + ' eventos confirmados'} />
        <Metric icon={WalletCards} label="Pipeline de propostas" value={money(proposalValue)} note={proposals.length + ' propostas em aberto'} />
        <Metric icon={CheckCircle2} label="Sinais registrados" value={money(deposits)} note="valores já registrados" />
        <Metric icon={CircleDollarSign} label="Saldo a receber" value={money(receivable)} note="dos eventos confirmados" />
        <Metric icon={WalletCards} label="Ticket médio" value={money(averageTicket)} note="por evento confirmado" />
        <Metric icon={CalendarDays} label="Próximos eventos" value={String(upcoming.length).padStart(2, '0')} note="na agenda atual" />
        <Metric icon={ClipboardSignature} label="Conversão em assinatura" value={conversion + '%'} note={signed.length + ' contratos assinados'} />
        <Metric icon={Users} label="Convidados previstos" value={guests.toLocaleString('pt-BR')} note="nos próximos eventos" />
      </div>

      <div className="dashboard-grid">
        <section className="panel revenue-panel">
          <div className="panel-head"><div><span className="eyebrow">PREVISÃO</span><h3>Volume dos próximos meses</h3></div><span className="muted">Contratos em carteira</span></div>
          <div className="bar-chart">
            {bars.map((bar) => (
              <div className="bar-col" key={bar.label}>
                <div className="bar-track"><div className="bar-fill" style={{ height: bar.height + '%' }} /></div>
                <span>{bar.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel next-panel">
          <div className="panel-head"><div><span className="eyebrow">AGENDA</span><h3>Próximos eventos</h3></div><button className="link-btn" onClick={() => onNavigate('agenda')}>Ver agenda <ArrowUpRight size={15} /></button></div>
          <div className="next-list">
            {upcoming.slice(0, 4).map((event) => (
              <button className="next-event" key={event.id} onClick={() => onOpenContract(event.id)}>
                <div className="date-chip"><strong>{new Date(event.eventDate + 'T12:00:00').getDate()}</strong><span>{new Date(event.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div>
                <div className="next-copy"><strong>{event.clientName}</strong><span>{event.eventType} · {event.guests} pessoas</span></div>
                <span className={statusClass(event.contractStatus)}>{event.contractStatus}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="financial-grid">
        <section className="panel financial-panel">
          <div className="panel-head"><div><span className="eyebrow">FINANCEIRO</span><h3>Composição da carteira</h3></div><span className="muted">{money(pipelineValue)} em negócios</span></div>
          <div className="financial-lines">
            {[
              ['Confirmado', revenue, pipelineValue ? revenue / pipelineValue : 0],
              ['Em proposta', proposalValue, pipelineValue ? proposalValue / pipelineValue : 0],
              ['Sinais registrados', deposits, pipelineValue ? deposits / pipelineValue : 0],
              ['A receber', receivable, revenue ? receivable / revenue : 0]
            ].map(([label, value, ratio]) => (
              <div className="financial-line" key={String(label)}>
                <div><span>{label}</span><strong>{money(Number(value))}</strong></div>
                <div className="finance-track"><i style={{ width: Math.max(3, Math.min(100, Number(ratio) * 100)) + '%' }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel commercial-health">
          <div className="panel-head"><div><span className="eyebrow">SAÚDE COMERCIAL</span><h3>Conversão e valor</h3></div></div>
          <div className="health-content">
            <div className="conversion-ring" style={{ background: 'conic-gradient(#9a7440 ' + conversion + '%, #e9e5dc ' + conversion + '%)' }}>
              <div><strong>{conversion}%</strong><span>assinados</span></div>
            </div>
            <div className="health-stats">
              <div><span>Ticket médio</span><strong>{money(averageTicket)}</strong></div>
              <div><span>Receita por convidado</span><strong>{money(averagePerGuest)}</strong></div>
              <div><span>Eventos em proposta</span><strong>{proposals.length}</strong></div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><Icon size={19} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function EventsView({ events, menus, services, onNew, onOpenContract, onOpenQuote, onDelete }: {
  events: BuffetEvent[]
  menus: MenuItem[]
  services: ServiceItem[]
  onNew: () => void
  onOpenContract: (id: string) => void
  onOpenQuote: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = events.filter((item) => (item.clientName + item.eventType + item.venue).toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="panel table-panel">
      <div className="panel-toolbar">
        <div>
          <span className="eyebrow">CARTEIRA</span>
          <h2>Eventos e propostas</h2>
          <p className="muted">Acompanhe cada negociação do primeiro contato à assinatura.</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}><Plus size={17} /> Criar evento</button>
      </div>
      <div className="filters"><div className="filter-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, tipo ou local" /></div><button className="btn btn-quiet">Todos <ChevronDown size={15} /></button></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Cliente / evento</th><th>Data</th><th>Convidados</th><th>Valor</th><th>Contrato</th><th></th></tr></thead>
          <tbody>
            {filtered.map((event) => (
              <tr key={event.id}>
                <td><div className="client-cell"><div className="event-dot" /><div><strong>{event.clientName}</strong><span>{event.eventType} · {event.venue}</span></div></div></td>
                <td><strong>{shortDate(event.eventDate)}</strong><span className="subcell">{event.startTime}</span></td>
                <td>{event.guests}</td>
                <td><strong>{money(eventTotal(event, menus, services))}</strong></td>
                <td><span className={statusClass(event.contractStatus)}>{event.contractStatus}</span></td>
                <td><div className="row-actions"><button title="Criar orçamento" onClick={() => onOpenQuote(event.id)}><WalletCards size={17} /></button><button title="Abrir contrato" onClick={() => onOpenContract(event.id)}><FileText size={17} /></button><button title="Excluir" onClick={() => onDelete(event.id)}><Trash2 size={17} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <EmptyState title="Nenhum evento encontrado" subtitle="Ajuste a busca ou crie um novo evento." />}
    </section>
  )
}

function MenusView({ menus, services, setMenus, setServices, onNewMenu, notify }: {
  menus: MenuItem[]
  services: ServiceItem[]
  setMenus: React.Dispatch<React.SetStateAction<MenuItem[]>>
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>
  onNewMenu: () => void
  notify: (message: string) => void
}) {
  const [tab, setTab] = useState<'menus' | 'services'>('menus')
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const activeCount = menus.filter((menu) => menu.active !== false).length

  const deleteMenu = (id: string) => {
    if (!window.confirm('Excluir este cardápio permanentemente?')) return
    setMenus((current) => current.filter((item) => item.id !== id))
    notify('Cardápio removido.')
  }

  const toggleMenu = (menu: MenuItem) => {
    const active = menu.active !== false
    setMenus((current) => current.map((item) => item.id === menu.id ? { ...item, active: !active } : item))
    notify(active ? 'Cardápio desativado.' : 'Cardápio ativado.')
  }

  return (
    <>
      <div className="section-intro">
        <div><span className="eyebrow">CATÁLOGO</span><h2>Sua oferta, organizada.</h2><p>{activeCount} cardápios ativos para novas propostas. Edite preços e itens sem perder o histórico dos eventos.</p></div>
        {tab === 'menus' && <button className="btn btn-primary" onClick={onNewMenu}><Plus size={17} /> Novo cardápio</button>}
      </div>
      <div className="tabs"><button className={tab === 'menus' ? 'active' : ''} onClick={() => setTab('menus')}>Cardápios <span>{menus.length}</span></button><button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>Serviços adicionais <span>{services.length}</span></button></div>
      {tab === 'menus' ? (
        <div className="menu-grid">
          {menus.map((menu, index) => {
            const active = menu.active !== false
            return (
              <article className={active ? 'menu-card' : 'menu-card inactive'} key={menu.id}>
                <div className="menu-card-top">
                  <span className="menu-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="menu-card-badges"><span className={active ? 'status status--success' : 'status status--neutral'}>{active ? 'Ativo' : 'Inativo'}</span><span className="pill">{menu.category}</span></div>
                </div>
                <h3>{menu.name}</h3><p>{menu.description}</p>
                {menu.unitRestriction && <div className="menu-source-note"><MapPin size={13} /> {menu.unitRestriction}</div>}
                <div className="menu-items">{menu.items.slice(0, 6).map((item) => <span key={item}><Check size={13} />{item}</span>)}</div>
                {menu.sourceLabel && <small className="menu-source">Fonte: {menu.sourceLabel}</small>}
                <div className="menu-card-foot">
                  <div><span>Valor por pessoa</span><strong>{menu.pricePerPerson > 0 ? money(menu.pricePerPerson) : 'Definir no evento'} <small>{menu.pricePerPerson > 0 ? '/ pessoa' : ''}</small></strong></div>
                  <div className="menu-actions">
                    <button title="Editar" onClick={() => setEditingMenu(menu)}><PenLine size={16} /></button>
                    <button title={active ? 'Desativar' : 'Ativar'} onClick={() => toggleMenu(menu)}>{active ? <X size={16} /> : <CheckCircle2 size={16} />}</button>
                    <button className="danger" title="Remover" onClick={() => deleteMenu(menu.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="service-list">
          {services.map((service) => (
            <div className="service-row" key={service.id}>
              <div className="service-icon"><Sparkles size={18} /></div>
              <div className="service-copy"><strong>{service.name}</strong><span>{service.description}</span></div>
              <div className="service-price"><strong>{money(service.price)}</strong><span>{service.pricing === 'person' ? 'por pessoa' : 'valor fixo'}</span></div>
              <button className="icon-button danger" onClick={() => setServices((current) => current.filter((item) => item.id !== service.id))}><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      )}
      {editingMenu && (
        <MenuEditor
          initial={editingMenu}
          onClose={() => setEditingMenu(null)}
          onSave={(updated) => {
            setMenus((current) => current.map((item) => item.id === updated.id ? updated : item))
            setEditingMenu(null)
            notify('Cardápio atualizado.')
          }}
        />
      )}
    </>
  )
}

function ContractsView({ events, menus, services, onOpen }: {
  events: BuffetEvent[]
  menus: MenuItem[]
  services: ServiceItem[]
  onOpen: (id: string) => void
}) {
  return (
    <section className="panel table-panel">
      <div className="panel-toolbar"><div><span className="eyebrow">DOCUMENTOS</span><h2>Contratos</h2><p className="muted">Documentos gerados a partir dos dados de cada evento.</p></div></div>
      <div className="contract-cards">
        {events.map((event) => (
          <button className="contract-card" key={event.id} onClick={() => onOpen(event.id)}>
            <div className="contract-icon"><FileSignature size={22} /></div>
            <div className="contract-main"><span>{event.contractNumber}</span><strong>{event.clientName}</strong><small>{dateBR(event.eventDate)} · {event.eventType}</small></div>
            <div className="contract-value"><strong>{money(eventTotal(event, menus, services))}</strong><span className={statusClass(event.contractStatus)}>{event.contractStatus}</span></div>
            <ArrowUpRight size={18} className="contract-arrow" />
          </button>
        ))}
      </div>
    </section>
  )
}

function AgendaView({ events }: { events: BuffetEvent[] }) {
  const [cursor, setCursor] = useState(() => new Date())
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1)
  while (cells.length % 7) cells.push(null)

  const moveMonth = (amount: number) => setCursor(new Date(year, month + amount, 1))
  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <section className="panel calendar-panel">
      <div className="calendar-head">
        <div><span className="eyebrow">PLANEJAMENTO</span><h2>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</h2></div>
        <div className="calendar-controls"><button onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button><button onClick={() => setCursor(new Date())}>Hoje</button><button onClick={() => moveMonth(1)}><ChevronRight size={18} /></button></div>
      </div>
      <div className="calendar-grid weekdays">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          const dayEvents = day ? events.filter((event) => {
            const date = new Date(event.eventDate + 'T12:00:00')
            return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year
          }) : []
          return (
            <div className={day ? 'calendar-day' : 'calendar-day empty'} key={index}>
              {day && <span className="day-number">{day}</span>}
              {dayEvents.map((event) => <div className="calendar-event" key={event.id}><strong>{event.startTime}</strong><span>{event.clientName}</span></div>)}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SettingsView({ settings, setSettings, notify }: {
  settings: BusinessSettings
  setSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>
  notify: (message: string) => void
}) {
  const [draft, setDraft] = useState(settings)
  const field = (key: keyof BusinessSettings, value: string) => setDraft((current) => ({ ...current, [key]: value }))
  return (
    <section className="settings-layout">
      <div className="section-intro"><div><span className="eyebrow">PERSONALIZAÇÃO</span><h2>Dados da empresa</h2><p>Estas informações aparecem automaticamente nos contratos gerados.</p></div></div>
      <div className="panel form-panel">
        <div className="form-section-title"><Building2 size={18} /><div><strong>Identificação</strong><span>Dados jurídicos e comerciais do buffet.</span></div></div>
        <div className="form-grid two">
          <Field label="Nome da marca" value={draft.businessName} onChange={(v) => field('businessName', v)} />
          <Field label="Razão social" value={draft.legalName} onChange={(v) => field('legalName', v)} />
          <Field label="CNPJ / CPF" value={draft.document} onChange={(v) => field('document', v)} />
          <Field label="Telefone" value={draft.phone} onChange={(v) => field('phone', v)} />
          <Field label="E-mail" value={draft.email} onChange={(v) => field('email', v)} />
          <Field label="E-mail financeiro" value={draft.financeEmail || ''} onChange={(v) => field('financeEmail', v)} />
          <Field label="Cidade" value={draft.city} onChange={(v) => field('city', v)} />
          <Field label="Site" value={draft.website || ''} onChange={(v) => field('website', v)} />
          <Field label="Instagram" value={draft.instagram || ''} onChange={(v) => field('instagram', v)} />
          <div className="field span-2"><label>Endereço</label><input value={draft.address} onChange={(e) => field('address', e.target.value)} /></div>
        </div>
        <div className="form-section-title spaced"><FileText size={18} /><div><strong>Cláusulas padrão</strong><span>Textos utilizados em todos os novos contratos.</span></div></div>
        <div className="field"><label>Condições de pagamento</label><textarea value={draft.paymentTerms} onChange={(e) => field('paymentTerms', e.target.value)} /></div>
        <div className="field"><label>Cancelamento</label><textarea value={draft.cancellationTerms} onChange={(e) => field('cancellationTerms', e.target.value)} /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={() => { setSettings(draft); notify('Configurações salvas.') }}><Check size={17} /> Salvar alterações</button></div>
      </div>

      <div className="section-intro materials-heading"><div><span className="eyebrow">MATERIAIS OFICIAIS</span><h2>Modelos contratuais 2027</h2><p>Conteúdo estruturado a partir dos documentos operacionais enviados para a plataforma.</p></div></div>
      <div className="contract-template-grid">
        {contractTemplates.map((template) => (
          <article className="contract-template-card" key={template.id}>
            <div className="contract-template-card-head"><FileText size={20} /><span className="pill">{template.type === 'space-rental' ? 'Locação' : 'Serviços'}</span></div>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <div className="template-facts">
              <span><strong>{template.clauses.length}</strong> cláusulas estruturadas</span>
              {template.extraGuestPrice && <span><strong>{money(template.extraGuestPrice)}</strong> convidado excedente</span>}
              {template.toleranceMinutes && <span><strong>{template.toleranceMinutes} min</strong> tolerância</span>}
              {template.overtimePenaltyPercent && <span><strong>{template.overtimePenaltyPercent}%</strong> multa por excedente</span>}
              {template.paymentScheduleSlots && <span><strong>{template.paymentScheduleSlots}</strong> linhas de parcelas/cheques</span>}
            </div>
            <details className="template-details">
              <summary>Ver conteúdo completo</summary>
              <div className="template-details-body">
                <p><strong>Financeiro:</strong> {template.financialEmail}</p>
                <p><strong>Formas de pagamento:</strong> {template.paymentMethods.join(', ')}</p>
                <p><strong>Cancelamento:</strong> {template.cancellationSummary}</p>
                {template.paymentData?.pixLabel && <p><strong>PIX:</strong> {template.paymentData.pixLabel}{template.paymentData.pixKey ? ' · ' + template.paymentData.pixKey : ' · chave não informada no documento'}</p>}
                <h4>Cláusulas</h4>
                <ol>{template.clauses.map((clause) => <li key={clause}>{clause}</li>)}</ol>
                {template.operationalNotes?.length ? <><h4>Orientações</h4><ul>{template.operationalNotes.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                {template.excludedItems?.length ? <><h4>Não inclusos</h4><ul>{template.excludedItems.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                {template.deliveryInstructions?.length ? <><h4>Entrega / atenção</h4><ul>{template.deliveryInstructions.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
                {template.contacts?.length ? <><h4>Contatos do documento</h4><ul>{template.contacts.map((contact, index) => <li key={index}>{[contact.name, contact.phone, contact.note].filter(Boolean).join(' — ')}</li>)}</ul></> : null}
                {template.website && <p><strong>Site:</strong> {template.website}</p>}
                {template.socials?.length ? <p><strong>Redes:</strong> {template.socials.join(' · ')}</p> : null}
              </div>
            </details>
            {getSourceMaterialText(template.id) && (
              <details className="source-verbatim">
                <summary>Transcrição integral do DOCX</summary>
                <div className="source-verbatim-head"><FileText size={14} /><span>{getSourceMaterialText(template.id)?.fileName}</span></div>
                <pre>{getSourceMaterialText(template.id)?.text}</pre>
              </details>
            )}
            <small>Fonte: {template.sourceLabel}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function EventWizard({ events, menus, services, onClose, onSave }: {
  events: BuffetEvent[]
  menus: MenuItem[]
  services: ServiceItem[]
  onClose: () => void
  onSave: (event: BuffetEvent) => void
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<BuffetEvent>({
    id: uid('event'),
    contractNumber: contractSequence(events),
    clientName: '',
    clientDocument: '',
    clientRg: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    eventType: 'Casamento',
    eventDate: '',
    startTime: '18:00',
    endTime: '23:00',
    venue: '',
    guests: 50,
    menuId: menus.find((menu) => menu.active !== false)?.id || menus[0]?.id || '',
    basePrice: 0,
    menuPricePerPerson: menus.find((menu) => menu.active !== false)?.pricePerPerson || 0,
    menuSelections: {},
    cakeDescription: '',
    contractTemplateId: menus.find((menu) => menu.active !== false)?.contractTemplateId || contractTemplates[0]?.id,
    paymentMethod: '',
    paymentSchedule: Array.from({ length: 5 }, () => ({ date: '', checkNumber: '', amount: 0 })),
    serviceIds: [],
    notes: '',
    discount: 0,
    deposit: 0,
    status: 'Proposta',
    contractStatus: 'Rascunho',
    createdAt: new Date().toISOString()
  })
  const set = <K extends keyof BuffetEvent>(key: K, value: BuffetEvent[K]) => setForm((current) => ({ ...current, [key]: value }))
  const total = eventTotal(form, menus, services)
  const selectedMenu = menus.find((menu) => menu.id === form.menuId)
  const selectedTemplate = getContractTemplate(form.contractTemplateId)
  const isRental = selectedTemplate.type === 'space-rental'
  const requiredChoicesComplete = (selectedMenu?.choiceGroups || []).filter((group) => group.required).every((group) => {
    const value = form.menuSelections?.[group.id]
    return Array.isArray(value) ? value.length > 0 : Boolean(value)
  })
  const canContinue = step === 1
    ? Boolean(form.clientName && form.eventDate && form.venue && form.guests)
    : step === 2
      ? (isRental ? (form.basePrice ?? 0) > 0 : Boolean(form.menuId && (form.menuPricePerPerson ?? 0) > 0 && requiredChoicesComplete))
      : true
  const updatePaymentEntry = (index: number, key: 'date' | 'checkNumber' | 'amount', value: string | number) => {
    const current = form.paymentSchedule || Array.from({ length: 5 }, () => ({ date: '', checkNumber: '', amount: 0 }))
    const next = current.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry)
    set('paymentSchedule', next)
  }

  return (
    <div className="modal-backdrop">
      <div className="wizard">
        <div className="wizard-side">
          <div className="brand mini"><img className="brand-emblem" src={brandMark} alt="Buffet Akela" /><div><strong>Novo evento</strong><span>{form.contractNumber}</span></div></div>
          <div className="step-list">
            {[['01', 'Cliente & data'], ['02', 'Cardápio'], ['03', 'Serviços & valores']].map((item, index) => (
              <div className={step === index + 1 ? 'step active' : step > index + 1 ? 'step done' : 'step'} key={item[0]}>
                <span>{step > index + 1 ? <Check size={14} /> : item[0]}</span><strong>{item[1]}</strong>
              </div>
            ))}
          </div>
          <div className="wizard-total"><span>Valor estimado</span><strong>{money(total)}</strong><small>{form.guests} convidados</small></div>
        </div>
        <div className="wizard-main">
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
          {step === 1 && (
            <div className="wizard-content">
              <span className="eyebrow">PASSO 1 DE 3</span><h2>Comece pelo essencial.</h2><p className="lead">Identifique o cliente e reserve a data do evento.</p>
              <div className="form-grid two">
                <Field label="Nome do cliente *" value={form.clientName} onChange={(v) => set('clientName', v)} placeholder="Nome do contratante" />
                <Field label="CPF / CNPJ" value={form.clientDocument} onChange={(v) => set('clientDocument', v)} placeholder="Documento" />
                <Field label="RG" value={form.clientRg || ''} onChange={(v) => set('clientRg', v)} placeholder="RG do contratante" />
                <Field label="E-mail" value={form.clientEmail} onChange={(v) => set('clientEmail', v)} type="email" />
                <Field label="WhatsApp" value={form.clientPhone} onChange={(v) => set('clientPhone', v)} placeholder="(11) 99999-9999" />
                <div className="field"><label>Endereço do contratante</label><input value={form.clientAddress || ''} onChange={(e) => set('clientAddress', e.target.value)} placeholder="Rua, número, bairro e cidade" /></div>
                <div className="field"><label>Tipo de evento</label><select value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
                <Field label="Data *" value={form.eventDate} onChange={(v) => set('eventDate', v)} type="date" />
                <Field label="Horário inicial" value={form.startTime} onChange={(v) => set('startTime', v)} type="time" />
                <Field label="Horário final" value={form.endTime} onChange={(v) => set('endTime', v)} type="time" />
                <div className="field span-2"><label>Local do evento *</label><input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Salão, endereço ou espaço de eventos" /></div>
                <Field label="Número de convidados *" value={String(form.guests)} onChange={(v) => set('guests', Math.max(1, Number(v)))} type="number" />
              </div>
              {form.eventType === 'Aniversário' && (
                <>
                  <div className="form-section-title spaced"><Users size={18} /><div><strong>Dados do aniversariante</strong><span>Campos presentes nos materiais oficiais do Buffet Akela.</span></div></div>
                  <div className="form-grid two compact">
                    <Field label="Aniversariante" value={form.celebrantName || ''} onChange={(v) => set('celebrantName', v)} />
                    <Field label="Idade" value={form.celebrantAge || ''} onChange={(v) => set('celebrantAge', v)} />
                    <Field label="Tema" value={form.theme || ''} onChange={(v) => set('theme', v)} />
                    <Field label="Pai" value={form.fatherName || ''} onChange={(v) => set('fatherName', v)} />
                    <Field label="Mãe" value={form.motherName || ''} onChange={(v) => set('motherName', v)} />
                    <Field label="Irmãos" value={form.siblings || ''} onChange={(v) => set('siblings', v)} />
                  </div>
                </>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="wizard-content">
              <span className="eyebrow">PASSO 2 DE 3</span><h2>Escolha a experiência.</h2><p className="lead">Selecione um cardápio ou utilize o modelo oficial de locação do espaço.</p>
              <div className="wizard-menu-grid">
                <button className={isRental && !form.menuId ? 'select-menu active rental-option' : 'select-menu rental-option'} onClick={() => setForm((current) => ({
                  ...current,
                  menuId: '',
                  basePrice: current.basePrice || 0,
                  menuPricePerPerson: 0,
                  menuSelections: {},
                  contractTemplateId: 'akela-space-rental-2027'
                }))}>
                  <div className="select-check">{isRental && !form.menuId && <Check size={14} />}</div>
                  <span>LOCAÇÃO · 2027</span><h3>Locação do Espaço</h3><p>Reserva da sede com regras próprias para montagem, desmontagem e tempo excedente.</p>
                  <small className="menu-unit-note">Jardim Marisa · SP</small>
                  <div className="select-price"><strong>Definir valor</strong><span>fixo</span></div>
                </button>
                {menus.filter((menu) => menu.active !== false).map((menu) => (
                  <button className={form.menuId === menu.id ? 'select-menu active' : 'select-menu'} key={menu.id} onClick={() => setForm((current) => ({
                    ...current,
                    menuId: menu.id,
                    basePrice: 0,
                    menuPricePerPerson: menu.pricePerPerson,
                    menuSelections: {},
                    contractTemplateId: menu.contractTemplateId || current.contractTemplateId
                  }))}>
                    <div className="select-check">{form.menuId === menu.id && <Check size={14} />}</div>
                    <span>{menu.category}</span><h3>{menu.name}</h3><p>{menu.description}</p>
                    {menu.unitRestriction && <small className="menu-unit-note">{menu.unitRestriction}</small>}
                    <div className="select-price"><strong>{menu.pricePerPerson > 0 ? money(menu.pricePerPerson) : 'Definir valor'}</strong><span>/ pessoa</span></div>
                  </button>
                ))}
              </div>
              {isRental && !form.menuId && (
                <div className="material-config rental-config">
                  <div className="form-section-title spaced"><FileText size={18} /><div><strong>Configurar locação do espaço</strong><span>Baseado no contrato oficial de locação 2027.</span></div></div>
                  <div className="form-grid two compact">
                    <Field label="Valor fixo da locação *" value={String(form.basePrice || 0)} onChange={(v) => set('basePrice', Math.max(0, Number(v)))} type="number" prefix="R$" />
                    <div className="field"><label>Modelo contratual</label><input value="Locação do Espaço 2027" disabled /></div>
                  </div>
                  <div className="rental-rules">
                    <span><strong>Montagem e desmontagem</strong> dentro do intervalo contratado.</span>
                    <span><strong>Tempo excedente</strong> acréscimo proporcional + multa de 10%.</span>
                    <span><strong>Cancelamento</strong> retenção de 50% até 90 dias; após, retenção integral.</span>
                  </div>
                </div>
              )}
              {selectedMenu && !isRental && (
                <div className="material-config">
                  <div className="form-section-title spaced"><UtensilsCrossed size={18} /><div><strong>Configurar {selectedMenu.name}</strong><span>{selectedMenu.sourceLabel || 'Cardápio cadastrado'}</span></div></div>
                  <div className="form-grid two compact">
                    <Field label="Valor por pessoa *" value={String(form.menuPricePerPerson ?? selectedMenu.pricePerPerson ?? 0)} onChange={(v) => set('menuPricePerPerson', Math.max(0, Number(v)))} type="number" prefix="R$" />
                    <div className="field"><label>Modelo contratual vinculado</label><select value={form.contractTemplateId || ''} onChange={(e) => set('contractTemplateId', e.target.value)}>{contractTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></div>
                    {selectedMenu.choiceGroups?.map((group) => {
                      const currentValue = form.menuSelections?.[group.id]
                      if (group.multiple) {
                        const selectedValues = Array.isArray(currentValue) ? currentValue : currentValue ? [String(currentValue)] : []
                        return (
                          <div className="field span-2 material-multi-field" key={group.id}>
                            <label>{group.label}{group.required ? ' *' : ''}</label>
                            <div className="material-check-grid">
                              {group.options.map((option) => {
                                const checked = selectedValues.includes(option)
                                return (
                                  <label className={checked ? 'material-check active' : 'material-check'} key={option}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => set('menuSelections', {
                                        ...(form.menuSelections || {}),
                                        [group.id]: checked ? selectedValues.filter((value) => value !== option) : [...selectedValues, option]
                                      })}
                                    />
                                    <span>{option}</span>
                                  </label>
                                )
                              })}
                            </div>
                            {group.note && <small className="field-note">{group.note}</small>}
                          </div>
                        )
                      }
                      return (
                        <div className="field" key={group.id}>
                          <label>{group.label}{group.required ? ' *' : ''}</label>
                          <select value={typeof currentValue === 'string' ? currentValue : ''} onChange={(e) => set('menuSelections', { ...(form.menuSelections || {}), [group.id]: e.target.value })}>
                            <option value="">Selecionar</option>
                            {group.options.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                          {group.note && <small className="field-note">{group.note}</small>}
                        </div>
                      )
                    })}
                    {selectedMenu.cakeFieldLabel && <Field label={selectedMenu.cakeFieldLabel} value={form.cakeDescription || ''} onChange={(v) => set('cakeDescription', v)} placeholder="Descreva sabor, acabamento ou observação conforme combinado" />}
                  </div>
                  <div className="material-summary">
                    {selectedMenu.sections?.map((section) => <div key={section.title}><strong>{section.title}</strong><span>{section.items.join(' · ')}</span></div>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="wizard-content">
              <span className="eyebrow">PASSO 3 DE 3</span><h2>Feche os detalhes.</h2><p className="lead">Inclua opcionais, sinal e confirme o padrão contratual antes de gerar os documentos.</p>
              <div className="contract-template-preview">
                <div><FileText size={18} /><span><strong>{selectedTemplate.name}</strong><small>{selectedTemplate.description}</small></span></div>
                <span className="pill">{selectedTemplate.type === 'space-rental' ? 'Locação' : 'Prestação de serviços'}</span>
                <p>{selectedTemplate.cancellationSummary}</p>
              </div>
              <div className="service-select-list">
                {services.map((service) => {
                  const selected = form.serviceIds.includes(service.id)
                  return (
                    <button className={selected ? 'service-select active' : 'service-select'} key={service.id} onClick={() => set('serviceIds', selected ? form.serviceIds.filter((id) => id !== service.id) : [...form.serviceIds, service.id])}>
                      <div className="checkbox">{selected && <Check size={14} />}</div>
                      <div><strong>{service.name}</strong><span>{service.description}</span></div>
                      <strong>{money(service.price)} <small>{service.pricing === 'person' ? '/pessoa' : ''}</small></strong>
                    </button>
                  )
                })}
              </div>
              <div className="payment-config">
                <div className="form-section-title spaced"><CircleDollarSign size={18} /><div><strong>Pagamento conforme documento</strong><span>{selectedTemplate.sourceLabel}</span></div></div>
                <div className="form-grid two compact">
                  <div className="field">
                    <label>Forma de pagamento</label>
                    <select value={form.paymentMethod || ''} onChange={(e) => set('paymentMethod', e.target.value)}>
                      <option value="">Selecionar / definir depois</option>
                      {selectedTemplate.paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>E-mail financeiro do modelo</label><input value={selectedTemplate.financialEmail} disabled /></div>
                </div>
                {selectedTemplate.paymentScheduleSlots ? (
                  <div className="payment-schedule">
                    <div className="payment-schedule-head"><span>Parcela</span><span>Data</span><span>Nº do cheque</span><span>Valor</span></div>
                    {Array.from({ length: selectedTemplate.paymentScheduleSlots }).map((_, index) => {
                      const entry = form.paymentSchedule?.[index] || { date: '', checkNumber: '', amount: 0 }
                      return (
                        <div className="payment-schedule-row" key={index}>
                          <strong>{index + 1}</strong>
                          <input type="date" value={entry.date} onChange={(e) => updatePaymentEntry(index, 'date', e.target.value)} />
                          <input value={entry.checkNumber} onChange={(e) => updatePaymentEntry(index, 'checkNumber', e.target.value)} placeholder="Número" />
                          <input type="number" min="0" step="0.01" value={entry.amount || ''} onChange={(e) => updatePaymentEntry(index, 'amount', Number(e.target.value))} placeholder="R$ 0,00" />
                        </div>
                      )
                    })}
                    <small>O material original possui cinco linhas para Data, nº do cheque e Valor. Preencha somente quando aplicável.</small>
                  </div>
                ) : null}
                {selectedTemplate.paymentData?.pixLabel && (
                  <div className="payment-material-note"><strong>PIX / Dados do documento</strong><span>{selectedTemplate.paymentData.pixLabel}{selectedTemplate.paymentData.pixKey ? ' · ' + selectedTemplate.paymentData.pixKey : ' · chave não informada no documento'}</span></div>
                )}
                {selectedTemplate.paymentData?.proofInstructions?.map((instruction) => <p className="payment-instruction" key={instruction}>{instruction}</p>)}
              </div>
              <div className="form-grid two compact">
                <Field label="Desconto" value={String(form.discount)} onChange={(v) => set('discount', Number(v))} type="number" prefix="R$" />
                <Field label="Sinal recebido" value={String(form.deposit)} onChange={(v) => set('deposit', Number(v))} type="number" prefix="R$" />
                <div className="field span-2"><label>Observações do evento</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Restrições alimentares, detalhes de montagem, horários..." /></div>
              </div>
            </div>
          )}
          <div className="wizard-actions">
            <button className="btn btn-quiet" onClick={() => step === 1 ? onClose() : setStep(step - 1)}>{step === 1 ? 'Cancelar' : 'Voltar'}</button>
            {step < 3 ? <button className="btn btn-primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>Continuar <ChevronRight size={17} /></button> : <button className="btn btn-primary" onClick={() => onSave(form)}><FileSignature size={17} /> Gerar evento e contrato</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuEditor({ onClose, onSave, initial }: { onClose: () => void; onSave: (menu: MenuItem) => void; initial?: MenuItem }) {
  const [name, setName] = useState(initial?.name || '')
  const [category, setCategory] = useState(initial?.category || 'Personalizado')
  const [description, setDescription] = useState(initial?.description || '')
  const [price, setPrice] = useState(initial?.pricePerPerson || 0)
  const [items, setItems] = useState(initial?.items.join(', ') || '')
  const [cakeFieldLabel, setCakeFieldLabel] = useState(initial?.cakeFieldLabel || '')
  const [unitRestriction, setUnitRestriction] = useState(initial?.unitRestriction || '')
  const [sectionsText, setSectionsText] = useState((initial?.sections || []).map((section) => section.title + ' | ' + section.items.join('; ')).join('\n'))
  const [choicesText, setChoicesText] = useState((initial?.choiceGroups || []).map((group) => {
    const flags = [group.required ? '[obrigatória]' : '', group.multiple ? '[múltipla]' : ''].filter(Boolean).join(' ')
    return group.label + (flags ? ' ' + flags : '') + ' | ' + group.options.join('; ')
  }).join('\n'))
  const [includedText, setIncludedText] = useState((initial?.includedServices || []).join('\n'))
  const [includedNotesText, setIncludedNotesText] = useState((initial?.includedNotes || []).join('\n'))
  const [excludedText, setExcludedText] = useState((initial?.excludedItems || []).join('\n'))
  const [deliveryText, setDeliveryText] = useState((initial?.deliveryInstructions || []).join('\n'))
  const [contactsText, setContactsText] = useState((initial?.contacts || []).map((contact) => [contact.name || '', contact.phone, contact.note || ''].join(' | ')).join('\n'))
  const [socialsText, setSocialsText] = useState((initial?.socials || []).join('\n'))
  const [website, setWebsite] = useState(initial?.website || '')

  const lines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean)

  const save = () => {
    const sections = lines(sectionsText).map((line) => {
      const [title, ...rest] = line.split('|')
      return { title: title.trim(), items: rest.join('|').split(';').map((item) => item.trim()).filter(Boolean) }
    })
    const choiceGroups = lines(choicesText).map((line, index) => {
      const [rawLabel, ...rest] = line.split('|')
      const existing = initial?.choiceGroups?.[index]
      const required = rawLabel.includes('[obrigatória]')
      const multiple = rawLabel.includes('[múltipla]')
      const label = rawLabel.replace('[obrigatória]', '').replace('[múltipla]', '').trim()
      return {
        id: existing?.id || 'choice-' + (index + 1),
        label,
        options: rest.join('|').split(';').map((item) => item.trim()).filter(Boolean),
        required,
        multiple,
        note: existing?.note
      }
    })
    const contacts = lines(contactsText).map((line) => {
      const [namePart = '', phone = '', note = ''] = line.split('|').map((item) => item.trim())
      return { name: namePart || undefined, phone, note: note || undefined }
    }).filter((contact) => contact.phone)

    onSave({
      ...(initial || {}),
      id: initial?.id || uid('menu'),
      name,
      category,
      description,
      pricePerPerson: price,
      items: items.split(',').map((item) => item.trim()).filter(Boolean),
      cakeFieldLabel: cakeFieldLabel || undefined,
      unitRestriction: unitRestriction || undefined,
      sections,
      choiceGroups,
      includedServices: lines(includedText),
      includedNotes: lines(includedNotesText),
      excludedItems: lines(excludedText),
      deliveryInstructions: lines(deliveryText),
      contacts,
      socials: lines(socialsText),
      website: website || undefined,
      active: initial?.active ?? true
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="simple-modal material-editor-modal">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <span className="eyebrow">{initial ? 'EDITAR CARDÁPIO' : 'NOVO ITEM DE CATÁLOGO'}</span>
        <h2>{initial ? 'Editar cardápio completo' : 'Criar cardápio'}</h2>
        <p className="lead">{initial ? 'Todos os campos estruturados do material podem ser alterados. Eventos e documentos já compartilhados continuam preservados.' : 'Cadastre uma opção para reutilizar em qualquer evento.'}</p>

        <div className="material-editor-section">
          <strong>Informações principais</strong>
          <div className="form-grid two">
            <Field label="Nome" value={name} onChange={setName} />
            <Field label="Categoria" value={category} onChange={setCategory} />
            <Field label="Valor por pessoa" value={String(price)} onChange={(v) => setPrice(Number(v))} type="number" />
            <Field label="Restrição de unidade" value={unitRestriction} onChange={setUnitRestriction} />
            <Field label="Campo de bolo" value={cakeFieldLabel} onChange={setCakeFieldLabel} />
            <Field label="Website do material" value={website} onChange={setWebsite} />
            <div className="field span-2"><label>Descrição</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="field span-2"><label>Resumo de itens <span>— separe por vírgulas</span></label><textarea value={items} onChange={(e) => setItems(e.target.value)} /></div>
          </div>
        </div>

        <div className="material-editor-section">
          <strong>Composição e escolhas</strong>
          <div className="field"><label>Seções do cardápio <span>— uma por linha: Título | item 1; item 2</span></label><textarea className="tall-textarea" value={sectionsText} onChange={(e) => setSectionsText(e.target.value)} /></div>
          <div className="field"><label>Escolhas configuráveis <span>— Label [obrigatória] [múltipla] | opção 1; opção 2</span></label><textarea className="tall-textarea" value={choicesText} onChange={(e) => setChoicesText(e.target.value)} /></div>
        </div>

        <div className="material-editor-section">
          <strong>Inclusos, exclusões e operação</strong>
          <div className="form-grid two">
            <div className="field"><label>Itens incluídos <span>— um por linha</span></label><textarea className="tall-textarea" value={includedText} onChange={(e) => setIncludedText(e.target.value)} /></div>
            <div className="field"><label>Itens não incluídos <span>— um por linha</span></label><textarea className="tall-textarea" value={excludedText} onChange={(e) => setExcludedText(e.target.value)} /></div>
            <div className="field"><label>Notas e alertas <span>— um por linha</span></label><textarea className="tall-textarea" value={includedNotesText} onChange={(e) => setIncludedNotesText(e.target.value)} /></div>
            <div className="field"><label>Entrega / instruções <span>— uma por linha</span></label><textarea className="tall-textarea" value={deliveryText} onChange={(e) => setDeliveryText(e.target.value)} /></div>
            <div className="field"><label>Contatos <span>— Nome | Telefone | Observação</span></label><textarea value={contactsText} onChange={(e) => setContactsText(e.target.value)} /></div>
            <div className="field"><label>Redes sociais <span>— uma por linha</span></label><textarea value={socialsText} onChange={(e) => setSocialsText(e.target.value)} /></div>
          </div>
        </div>

        {initial?.sourceLabel && <div className="material-source-lock"><FileText size={16} /><span><strong>Fonte documental</strong><small>{initial.sourceLabel}. A referência de origem é preservada mesmo após edição.</small></span></div>}
        <div className="form-actions"><button className="btn btn-quiet" onClick={onClose}>Cancelar</button><button className="btn btn-primary" disabled={!name} onClick={save}>Salvar cardápio completo</button></div>
      </div>
    </div>
  )
}

function QuoteModal({ event, menus, services, settings, onClose, onUpdate, notify }: {
  event: BuffetEvent
  menus: MenuItem[]
  services: ServiceItem[]
  settings: BusinessSettings
  onClose: () => void
  onUpdate: (patch: Partial<BuffetEvent>) => void
  notify: (message: string) => void
}) {
  const [sharing, setSharing] = useState(false)
  const menu = menus.find((item) => item.id === event.menuId)
  const selectedServices = services.filter((item) => event.serviceIds.includes(item.id))
  const baseContractTemplate = getContractTemplate(event.contractTemplateId || menu?.contractTemplateId)
  const contractTemplate: ContractTemplate = {
    ...baseContractTemplate,
    sourceText: getSourceMaterialText(baseContractTemplate.id)?.text || baseContractTemplate.sourceText
  }
  const total = eventTotal(event, menus, services)

  const createQuoteLink = async () => {
    if (event.quoteUrl && event.quoteToken) return event.quoteUrl
    setSharing(true)
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, menu, services: selectedServices, settings, total, contractTemplate })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar o orçamento.')
      onUpdate({ quoteToken: data.token, quoteUrl: data.url, quoteSharedAt: new Date().toISOString() })
      notify('Orçamento online criado.')
      return data.url as string
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Falha ao gerar orçamento.')
      return ''
    } finally {
      setSharing(false)
    }
  }

  const copyLink = async () => {
    const url = await createQuoteLink()
    if (!url) return
    await navigator.clipboard.writeText(url)
    notify('Link do orçamento copiado.')
  }

  const openQuote = async () => {
    const popup = window.open('about:blank', '_blank')
    const url = await createQuoteLink()
    if (!url) {
      popup?.close()
      return
    }
    if (popup) {
      popup.opener = null
      popup.location.replace(url)
    } else {
      await navigator.clipboard.writeText(url)
      notify('Link copiado. O navegador bloqueou a nova aba.')
    }
  }

  const sendWhatsApp = async () => {
    const popup = window.open('about:blank', '_blank')
    const url = await createQuoteLink()
    if (!url) {
      popup?.close()
      return
    }
    const text = 'Olá, ' + event.clientName + '! Preparamos seu orçamento para ' + event.eventType + '. Confira todos os detalhes aqui: ' + url
    const phone = phoneDigits(event.clientPhone)
    const target = phone
      ? 'https://wa.me/' + (phone.startsWith('55') ? phone : '55' + phone) + '?text=' + encodeURIComponent(text)
      : 'https://wa.me/?text=' + encodeURIComponent(text)
    if (popup) {
      popup.opener = null
      popup.location.replace(target)
    } else {
      await navigator.clipboard.writeText(text)
      notify('Mensagem copiada. O navegador bloqueou a nova aba.')
    }
  }

  return (
    <div className="quote-overlay">
      <div className="contract-shell">
        <div className="contract-toolbar no-print">
          <div><button className="back-button" onClick={onClose}><ChevronLeft size={18} /> Voltar</button><div><strong>ORÇAMENTO</strong><span>{event.clientName}</span></div></div>
          <div className="contract-actions">
            <button className="btn btn-quiet" onClick={() => window.print()}><Printer size={17} /> Imprimir / PDF</button>
            {event.quoteUrl && <button className="btn btn-quiet" onClick={copyLink}><FileText size={17} /> Copiar link</button>}
            <button className="btn btn-quiet" onClick={sendWhatsApp} disabled={sharing}><Send size={17} /> WhatsApp</button>
            <button className="btn btn-primary" onClick={openQuote} disabled={sharing}><ArrowUpRight size={17} /> {event.quoteUrl ? 'Abrir orçamento' : 'Gerar link'}</button>
          </div>
        </div>
        {event.quoteUrl && (
          <div className="share-banner no-print">
            <div><CheckCircle2 size={17} /><span><strong>Orçamento online disponível</strong><small>O cliente pode abrir pelo celular, imprimir ou salvar em PDF.</small></span></div>
            <button onClick={copyLink}>Copiar link</button>
          </div>
        )}
        <QuoteDocument event={event} menu={menu} services={selectedServices} settings={settings} total={total} templateOverride={contractTemplate} />
      </div>
    </div>
  )
}

function MenuMaterialDetails({ menu, event }: { menu?: MenuItem; event: BuffetEvent }) {
  if (!menu) return null
  const choices = (menu.choiceGroups || [])
    .map((group) => ({ label: group.label, value: event.menuSelections?.[group.id] }))
    .filter((item) => Array.isArray(item.value) ? item.value.length > 0 : Boolean(item.value))

  return (
    <>
      {(choices.length > 0 || event.cakeDescription) && (
        <div className="doc-choice-grid">
          {choices.map((choice) => <div key={choice.label}><span>{choice.label}</span><strong>{Array.isArray(choice.value) ? choice.value.join(' · ') : choice.value}</strong></div>)}
          {event.cakeDescription && <div><span>{menu.cakeFieldLabel || 'Bolo'}</span><strong>{event.cakeDescription}</strong></div>}
        </div>
      )}
      {menu.sections && menu.sections.length > 0 && (
        <div className="doc-menu-sections">
          {menu.sections.map((section) => (
            <div key={section.title}><strong>{section.title}</strong><p>{section.items.join(' · ')}</p>{section.note && <small>{section.note}</small>}</div>
          ))}
        </div>
      )}
      {menu.includedServices && menu.includedServices.length > 0 && (
        <div className="doc-package-included">
          <span>INCLUSO NO PACOTE</span>
          <div>{menu.includedServices.map((item) => <p key={item}><Check size={12} />{item}</p>)}</div>
        </div>
      )}
      {menu.excludedItems && menu.excludedItems.length > 0 && (
        <div className="doc-package-excluded">
          <span>ITENS NÃO INCLUSOS — CONFORME DOCUMENTO</span>
          <div>{menu.excludedItems.map((item) => <p key={item}><X size={12} />{item}</p>)}</div>
        </div>
      )}
      {menu.deliveryInstructions && menu.deliveryInstructions.length > 0 && (
        <div className="doc-material-ops">
          <span>ORIENTAÇÕES DO MATERIAL</span>
          {menu.deliveryInstructions.map((item) => <p key={item}><CheckCircle2 size={12} />{item}</p>)}
        </div>
      )}
      {menu.contacts && menu.contacts.length > 0 && (
        <div className="doc-material-contacts">
          <span>CONTATOS DO DOCUMENTO</span>
          <p>{menu.contacts.map((contact) => [contact.name, contact.phone, contact.note].filter(Boolean).join(' — ')).join(' · ')}</p>
          {menu.website && <p>{menu.website}</p>}
          {menu.socials?.length ? <p>{menu.socials.join(' · ')}</p> : null}
        </div>
      )}
      {menu.includedNotes?.map((note) => <p className="doc-material-note" key={note}>{note}</p>)}
    </>
  )
}

function PaymentDocumentDetails({ event, template }: { event: BuffetEvent; template: ContractTemplate }) {
  const slotCount = template.paymentScheduleSlots || 0
  const entries = slotCount
    ? Array.from({ length: slotCount }, (_, index) => event.paymentSchedule?.[index] || { date: '', checkNumber: '', amount: 0 })
    : (event.paymentSchedule || []).filter((entry) => entry.date || entry.checkNumber || entry.amount > 0)
  return (
    <div className="doc-payment-details">
      <div className="doc-payment-summary">
        <div><span>Forma de pagamento selecionada</span><strong>{event.paymentMethod || 'A definir'}</strong></div>
        <div><span>E-mail financeiro do modelo</span><strong>{template.financialEmail}</strong></div>
      </div>
      {entries.length > 0 && (
        <div className="doc-payment-table">
          <div className="doc-payment-table-head"><span>Parcela</span><span>Data</span><span>Nº do cheque</span><span>Valor</span></div>
          {entries.map((entry, index) => (
            <div className="doc-payment-table-row" key={index}>
              <strong>{index + 1}</strong>
              <span>{entry.date ? dateBR(entry.date) : '—'}</span>
              <span>{entry.checkNumber || '—'}</span>
              <strong>{entry.amount > 0 ? money(entry.amount) : '—'}</strong>
            </div>
          ))}
        </div>
      )}
      {template.paymentData?.pixLabel && (
        <div className="doc-payment-note"><strong>DADOS PARA PAGAMENTO / PIX</strong><span>{template.paymentData.pixLabel}{template.paymentData.pixKey ? ' · ' + template.paymentData.pixKey : ' · chave PIX não informada no documento de origem'}</span></div>
      )}
      {template.paymentData?.proofInstructions?.map((instruction) => <p className="doc-clause" key={instruction}><strong>Comprovante.</strong> {instruction}</p>)}
    </div>
  )
}

function TemplateOperationalDetails({ template }: { template: ContractTemplate }) {
  const hasContent = Boolean(
    template.operationalNotes?.length ||
    template.excludedItems?.length ||
    template.deliveryInstructions?.length ||
    template.contacts?.length ||
    template.socials?.length ||
    template.website
  )
  if (!hasContent) return null
  return (
    <div className="template-document-details">
      {template.operationalNotes?.length ? (
        <div className="doc-material-ops">
          <span>ORIENTAÇÕES OPERACIONAIS DO DOCUMENTO</span>
          {template.operationalNotes.map((note) => <p key={note}><CheckCircle2 size={12} />{note}</p>)}
        </div>
      ) : null}
      {template.excludedItems?.length ? (
        <div className="doc-package-excluded">
          <span>ITENS NÃO INCLUSOS — TEXTO DO MATERIAL</span>
          <div>{template.excludedItems.map((item) => <p key={item}><X size={12} />{item}</p>)}</div>
        </div>
      ) : null}
      {template.deliveryInstructions?.length ? (
        <div className="doc-material-ops warning">
          <span>REGRAS DE ENTREGA / ATENÇÃO</span>
          {template.deliveryInstructions.map((item) => <p key={item}><CheckCircle2 size={12} />{item}</p>)}
        </div>
      ) : null}
      {template.contacts?.length || template.website || template.socials?.length ? (
        <div className="doc-material-contacts">
          <span>CONTATOS E CANAIS DO DOCUMENTO</span>
          {template.contacts?.length ? <p>{template.contacts.map((contact) => [contact.name, contact.phone, contact.note].filter(Boolean).join(' — ')).join(' · ')}</p> : null}
          {template.website && <p>{template.website}</p>}
          {template.socials?.length ? <p>{template.socials.join(' · ')}</p> : null}
          {template.paymentData?.proofWhatsapp && <p>WhatsApp indicado no material: {template.paymentData.proofWhatsapp}</p>}
        </div>
      ) : null}
    </div>
  )
}

function QuoteDocument({ event, menu, services, settings, total, expiresAt, templateOverride }: {
  event: BuffetEvent
  menu?: MenuItem
  services: ServiceItem[]
  settings: BusinessSettings
  total: number
  expiresAt?: string
  templateOverride?: ContractTemplate
}) {
  const template = templateOverride || getContractTemplate(event.contractTemplateId || menu?.contractTemplateId)
  const isRental = template.type === 'space-rental'
  const menuPrice = event.menuPricePerPerson ?? menu?.pricePerPerson ?? 0
  const menuSubtotal = isRental ? (event.basePrice || 0) : menuPrice * event.guests
  const servicesSubtotal = services.reduce((sum, service) => sum + (service.pricing === 'person' ? service.price * event.guests : service.price), 0)
  const quoteNumber = event.contractNumber.replace('CTR-', 'ORC-')
  const expiry = expiresAt
    ? new Date(expiresAt)
    : (() => { const date = new Date(); date.setDate(date.getDate() + 7); return date })()

  return (
    <article className="quote-document">
      <header className="quote-header">
        <div className="doc-brand"><img className="brand-emblem brand-emblem--doc" src={brandMark} alt="Buffet Akela" /><div><strong>{settings.businessName}</strong><span>Eventos & buffet</span></div></div>
        <div className="doc-number"><span>ORÇAMENTO</span><strong>{quoteNumber}</strong></div>
      </header>

      <section className="quote-hero">
        <div><span className="eyebrow">PROPOSTA PERSONALIZADA</span><h1>Uma experiência pensada<br />para o seu evento.</h1><p>Olá, <strong>{event.clientName}</strong>. Reunimos abaixo a composição, serviços e investimento para {event.eventType.toLowerCase()}.</p></div>
        <div className="quote-total-highlight"><span>Investimento</span><strong>{money(total)}</strong><small>{isRental ? 'valor da locação' : money(total / Math.max(1, event.guests)) + ' por convidado'}</small></div>
      </section>

      <section className="quote-section">
        <div className="doc-section-head"><span>01</span><h2>Informações do evento</h2></div>
        <div className="doc-data-grid">
          <div><span>Evento</span><strong>{event.eventType}</strong></div>
          <div><span>Data</span><strong>{dateBR(event.eventDate)}</strong></div>
          <div><span>Horário</span><strong>{event.startTime} — {event.endTime}</strong></div>
          <div><span>Convidados</span><strong>{event.guests} pessoas</strong></div>
          <div className="wide"><span>Local</span><strong>{event.venue}</strong></div>
        </div>
      </section>

      {!isRental ? (
        <section className="quote-section">
          <div className="doc-section-head"><span>02</span><h2>Experiência gastronômica</h2></div>
          <div className="quote-menu">
            <div><span>{menu?.category || 'Cardápio'}</span><h3>{menu?.name || 'Cardápio a definir'}</h3><p>{menu?.description}</p></div>
            <div><strong>{money(menuPrice)}</strong><span>por pessoa</span></div>
          </div>
          <div className="doc-tags">{menu?.items.map((item) => <span key={item}>{item}</span>)}</div>
          <MenuMaterialDetails menu={menu} event={event} />
        </section>
      ) : (
        <section className="quote-section">
          <div className="doc-section-head"><span>02</span><h2>Locação do espaço</h2></div>
          <div className="quote-menu"><div><span>LOCAÇÃO · 2027</span><h3>Reserva do espaço Buffet Akela</h3><p>Montagem e desmontagem dentro do período contratado, conforme modelo oficial de locação.</p></div><div><strong>{money(event.basePrice || 0)}</strong><span>valor fixo</span></div></div>
        </section>
      )}

      <section className="quote-section">
        <div className="doc-section-head"><span>03</span><h2>Serviços e estrutura</h2></div>
        {services.length ? <div className="doc-service-list">{services.map((service) => <div key={service.id}><CheckCircle2 size={16} /><span><strong>{service.name}</strong>{service.description}</span><b>{service.pricing === 'person' ? money(service.price) + '/pessoa' : money(service.price)}</b></div>)}</div> : <p className="doc-muted">Nenhum serviço adicional incluído nesta proposta.</p>}
      </section>

      <section className="quote-section quote-finance-section">
        <div className="doc-section-head"><span>04</span><h2>Resumo financeiro</h2></div>
        <div className="quote-breakdown">
          <div><span>{isRental ? 'Locação do espaço' : 'Cardápio × ' + event.guests + ' convidados'}</span><strong>{money(menuSubtotal)}</strong></div>
          <div><span>Serviços adicionais</span><strong>{money(servicesSubtotal)}</strong></div>
          {event.discount > 0 && <div className="discount"><span>Desconto comercial</span><strong>− {money(event.discount)}</strong></div>}
          <div className="quote-grand-total"><span>Valor total da proposta</span><strong>{money(total)}</strong></div>
        </div>
        <p className="doc-clause"><strong>Condições de pagamento.</strong> {settings.paymentTerms}</p>
        <p className="doc-clause"><strong>Formas previstas no documento.</strong> {template.paymentMethods.join(', ')}.</p>
        <PaymentDocumentDetails event={event} template={template} />
        {event.notes && <p className="doc-clause"><strong>Observações.</strong> {event.notes}</p>}
      </section>

      <section className="quote-validity">
        <CalendarCheck size={18} /><div><span>VALIDADE DA PROPOSTA</span><strong>Até {expiry.toLocaleDateString('pt-BR')}</strong></div>
        <p>Valores e disponibilidade de agenda estão sujeitos à confirmação após esta data.</p>
      </section>

      <footer className="doc-footer"><span>{settings.businessName} · {settings.phone} · {settings.email}</span><span>{quoteNumber}</span></footer>
    </article>
  )
}

function ContractModal({ event, menus, services, settings, onClose, onUpdate, notify }: {
  event: BuffetEvent
  menus: MenuItem[]
  services: ServiceItem[]
  settings: BusinessSettings
  onClose: () => void
  onUpdate: (patch: Partial<BuffetEvent>) => void
  notify: (message: string) => void
}) {
  const [sharing, setSharing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const menu = menus.find((item) => item.id === event.menuId)
  const selectedServices = services.filter((item) => event.serviceIds.includes(item.id))
  const baseContractTemplate = getContractTemplate(event.contractTemplateId || menu?.contractTemplateId)
  const contractTemplate: ContractTemplate = {
    ...baseContractTemplate,
    sourceText: getSourceMaterialText(baseContractTemplate.id)?.text || baseContractTemplate.sourceText
  }
  const total = eventTotal(event, menus, services)

  const syncRemote = async (silent = false) => {
    if (!event.shareToken) return
    if (!silent) setSyncing(true)
    try {
      const response = await fetch('/api/contracts?token=' + encodeURIComponent(event.shareToken), { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json()
      const remote = data.contract
      if (remote?.status === 'signed' && remote.signature) {
        onUpdate({ signature: remote.signature, contractStatus: 'Assinado', status: 'Confirmado' })
        if (!silent) notify('Assinatura do cliente sincronizada.')
      }
    } finally {
      if (!silent) setSyncing(false)
    }
  }

  useEffect(() => {
    if (!event.shareToken || event.contractStatus === 'Assinado') return
    void syncRemote(true)
    const timer = window.setInterval(() => void syncRemote(true), 10000)
    return () => window.clearInterval(timer)
  }, [event.shareToken, event.contractStatus])

  const createSigningLink = async () => {
    if (event.contractStatus === 'Assinado') return event.shareUrl || ''
    if (event.shareUrl && event.shareToken) return event.shareUrl

    setSharing(true)
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, menu, services: selectedServices, settings, total, contractTemplate })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível criar o link.')

      const patch = {
        contractStatus: 'Enviado' as const,
        shareToken: data.token as string,
        shareUrl: data.url as string,
        sharedAt: new Date().toISOString()
      }
      onUpdate(patch)
      notify('Link seguro de assinatura criado.')
      return data.url as string
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Falha ao criar link de assinatura.')
      return ''
    } finally {
      setSharing(false)
    }
  }

  const copySigningLink = async () => {
    const url = await createSigningLink()
    if (!url) return
    await navigator.clipboard.writeText(url)
    notify('Link de assinatura copiado.')
  }

  const sendWhatsApp = async () => {
    const popup = window.open('about:blank', '_blank')
    const url = await createSigningLink()
    if (!url) {
      popup?.close()
      return
    }
    const text = 'Olá, ' + event.clientName + '! Seu contrato ' + event.contractNumber + ' está disponível para leitura e assinatura eletrônica: ' + url
    const phone = phoneDigits(event.clientPhone)
    const target = phone ? 'https://wa.me/' + (phone.startsWith('55') ? phone : '55' + phone) + '?text=' + encodeURIComponent(text) : 'https://wa.me/?text=' + encodeURIComponent(text)
    if (popup) {
      popup.opener = null
      popup.location.replace(target)
    } else {
      await navigator.clipboard.writeText(text)
      notify('Mensagem copiada. O navegador bloqueou a nova aba.')
    }
  }

  const openSigning = async () => {
    const popup = window.open('about:blank', '_blank')
    const url = await createSigningLink()
    if (!url) {
      popup?.close()
      return
    }
    if (popup) {
      popup.opener = null
      popup.location.replace(url)
    } else {
      await navigator.clipboard.writeText(url)
      notify('Link copiado. O navegador bloqueou a nova aba.')
    }
  }

  return (
    <div className="contract-overlay">
      <div className="contract-shell">
        <div className="contract-toolbar no-print">
          <div><button className="back-button" onClick={onClose}><ChevronLeft size={18} /> Voltar</button><div><strong>{event.contractNumber}</strong><span>{event.clientName}</span></div></div>
          <div className="contract-actions">
            <button className="btn btn-quiet" onClick={() => window.print()}><Printer size={17} /> Imprimir / PDF</button>
            {event.shareUrl && <button className="btn btn-quiet" onClick={copySigningLink}><FileText size={17} /> Copiar link</button>}
            <button className="btn btn-quiet" onClick={sendWhatsApp} disabled={sharing || event.contractStatus === 'Assinado'}><Send size={17} /> {sharing ? 'Gerando...' : 'WhatsApp'}</button>
            {event.shareToken && event.contractStatus !== 'Assinado' && <button className="btn btn-quiet" onClick={() => syncRemote(false)} disabled={syncing}><CheckCircle2 size={17} /> {syncing ? 'Verificando...' : 'Verificar'}</button>}
            <button className="btn btn-primary" onClick={openSigning} disabled={sharing || event.contractStatus === 'Assinado'}><PenLine size={17} /> {event.contractStatus === 'Assinado' ? 'Assinado' : event.shareUrl ? 'Abrir assinatura' : 'Gerar link'}</button>
          </div>
        </div>
        {event.shareUrl && event.contractStatus !== 'Assinado' && (
          <div className="share-banner no-print">
            <div><CheckCircle2 size={17} /><span><strong>Contrato disponível para assinatura</strong><small>Envie o link ao cliente. O painel verifica automaticamente quando ele assinar.</small></span></div>
            <button onClick={copySigningLink}>Copiar link</button>
          </div>
        )}
        <ContractDocument event={event} menu={menu} services={selectedServices} settings={settings} total={total} templateOverride={contractTemplate} />
      </div>
    </div>
  )
}

function ContractDocument({ event, menu, services, settings, total, templateOverride }: {
  event: BuffetEvent
  menu?: MenuItem
  services: ServiceItem[]
  settings: BusinessSettings
  total: number
  templateOverride?: ContractTemplate
}) {
  const template = templateOverride || getContractTemplate(event.contractTemplateId || menu?.contractTemplateId)
  const menuPrice = event.menuPricePerPerson ?? menu?.pricePerPerson ?? 0
  const title = template.type === 'space-rental' ? 'Contrato de Locação do Espaço' : 'Contrato de Prestação de Serviços'
  const subtitle = template.type === 'space-rental' ? 'LOCAÇÃO DO ESPAÇO' : 'PRESTAÇÃO DE SERVIÇOS'
  const signatureDate = event.signature
    ? new Date(event.signature.signedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '_____ de __________________ de 20_____'

  return (
    <article className="contract-document">
      <header className="doc-header">
        <div className="doc-brand"><img className="brand-emblem brand-emblem--doc" src={brandMark} alt={settings.businessName} /><div><strong>{settings.businessName}</strong><span>Eventos & buffet</span></div></div>
        <div className="doc-number"><span>CONTRATO</span><strong>{event.contractNumber}</strong></div>
      </header>

      <div className="doc-title"><span>{subtitle}</span><h1>{title}</h1><p>Modelo: {template.name} · documento gerado em {new Date(event.createdAt).toLocaleDateString('pt-BR')}.</p></div>

      <section className="doc-party-grid">
        <div><span>CONTRATADA</span><strong>{settings.legalName}</strong><p>{settings.document}<br />{settings.address}<br />{settings.city}<br />{settings.financeEmail || settings.email}</p></div>
        <div><span>CONTRATANTE</span><strong>{event.clientName}</strong><p>CPF/CNPJ: {event.clientDocument || 'Não informado'}{event.clientRg ? <><br />RG: {event.clientRg}</> : null}{event.clientAddress ? <><br />{event.clientAddress}</> : null}<br />{event.clientEmail || 'E-mail não informado'}<br />{event.clientPhone || 'Telefone não informado'}</p></div>
      </section>

      <section className="doc-section">
        <div className="doc-section-head"><span>01</span><h2>Dados do evento</h2></div>
        <div className="doc-data-grid">
          <div><span>Tipo</span><strong>{event.eventType}</strong></div>
          <div><span>Data</span><strong>{dateBR(event.eventDate)}</strong></div>
          <div><span>Horário</span><strong>{event.startTime} — {event.endTime}</strong></div>
          <div><span>Convidados</span><strong>{event.guests} pessoas</strong></div>
          <div className="wide"><span>Local</span><strong>{event.venue}</strong></div>
        </div>
        {event.eventType === 'Aniversário' && (event.celebrantName || event.theme || event.celebrantAge) && (
          <div className="doc-celebrant-grid">
            <div><span>Aniversariante</span><strong>{event.celebrantName || '—'}</strong></div>
            <div><span>Idade</span><strong>{event.celebrantAge || '—'}</strong></div>
            <div><span>Tema</span><strong>{event.theme || '—'}</strong></div>
            <div><span>Pai / Mãe</span><strong>{[event.fatherName, event.motherName].filter(Boolean).join(' / ') || '—'}</strong></div>
            {event.siblings && <div className="wide"><span>Irmãos</span><strong>{event.siblings}</strong></div>}
          </div>
        )}
      </section>

      {template.type === 'services' && (
        <section className="doc-section">
          <div className="doc-section-head"><span>02</span><h2>Cardápio contratado</h2></div>
          <div className="doc-menu">
            <div><span>{menu?.category || 'Cardápio'}</span><h3>{menu?.name || 'Não selecionado'}</h3><p>{menu?.description}</p>{menu?.unitRestriction && <small>{menu.unitRestriction}</small>}</div>
            <strong>{money(menuPrice)} <small>/ pessoa</small></strong>
          </div>
          <div className="doc-tags">{menu?.items.map((item) => <span key={item}>{item}</span>)}</div>
          <MenuMaterialDetails menu={menu} event={event} />
        </section>
      )}

      <section className="doc-section">
        <div className="doc-section-head"><span>{template.type === 'services' ? '03' : '02'}</span><h2>{template.type === 'services' ? 'Opcionais e serviços adicionais' : 'Condições da locação'}</h2></div>
        {services.length ? <div className="doc-service-list">{services.map((service) => <div key={service.id}><CheckCircle2 size={16} /><span><strong>{service.name}</strong>{service.description}</span><b>{service.pricing === 'person' ? money(service.price) + '/pessoa' : service.price > 0 ? money(service.price) : 'A definir'}</b></div>)}</div> : <p className="doc-muted">Nenhum opcional adicional selecionado.</p>}
      </section>

      <section className="doc-section">
        <div className="doc-section-head"><span>{template.type === 'services' ? '04' : '03'}</span><h2>Condições comerciais</h2></div>
        <div className="doc-financial">
          <div><span>Valor por pessoa</span><strong>{template.type === 'services' ? money(menuPrice) : '—'}</strong></div>
          <div><span>Valor total</span><strong>{money(total)}</strong></div>
          <div><span>Sinal registrado</span><strong>{money(event.deposit)}</strong></div>
          <div><span>Saldo previsto</span><strong>{money(Math.max(0, total - event.deposit))}</strong></div>
        </div>
        <p className="doc-clause"><strong>Pagamento.</strong> {settings.paymentTerms}</p>
        <p className="doc-clause"><strong>Cancelamento.</strong> {template.cancellationSummary}</p>
        <p className="doc-clause"><strong>Formas de pagamento previstas.</strong> {template.paymentMethods.join(', ')}.</p>
        <PaymentDocumentDetails event={event} template={template} />
        {template.extraGuestPrice && <p className="doc-clause"><strong>Convidado excedente.</strong> {money(template.extraGuestPrice)} por pessoa, conforme o documento selecionado. Pagantes a partir de 6 anos e 12 meses quando assim previsto no material.</p>}
        {template.overtimePenaltyPercent && <p className="doc-clause"><strong>Tempo excedente.</strong> Acréscimo proporcional mais multa de {template.overtimePenaltyPercent}% conforme o modelo de locação.</p>}
        {event.notes && <p className="doc-clause"><strong>Observações específicas.</strong> {event.notes}</p>}
      </section>

      <section className="doc-section contract-clauses">
        <div className="doc-section-head"><span>{template.type === 'services' ? '05' : '04'}</span><h2>Cláusulas do modelo {template.name}</h2></div>
        <div className="clause-list">{template.clauses.map((clause, index) => <p key={index}><strong>{index + 1}.</strong> {clause}</p>)}</div>
        <TemplateOperationalDetails template={template} />
      </section>

      <div className="contract-location-date">São Paulo, {signatureDate}</div>
      <section className="doc-signatures">
        <div className="signature-box"><span>CONTRATADA</span><div className="signature-line" /><strong>{settings.legalName}</strong><small>{settings.document}</small></div>
        <div className="signature-box"><span>CONTRATANTE</span>{event.signature?.dataUrl ? <img src={event.signature.dataUrl} alt="Assinatura do contratante" /> : <div className="signature-line" />}<strong>{event.signature?.signerName || event.clientName}</strong><small>{event.signature ? 'Assinado eletronicamente em ' + new Date(event.signature.signedAt).toLocaleString('pt-BR') : event.clientEmail || event.clientDocument}</small></div>
      </section>

      {event.signature?.auditHash && (
        <section className="audit-evidence">
          <div><CheckCircle2 size={16} /><strong>Registro eletrônico de assinatura</strong></div>
          <p>Assinado em {new Date(event.signature.signedAt).toLocaleString('pt-BR')} por {event.signature.signerName}.</p>
          <span>SHA-256: {event.signature.auditHash}</span>
        </section>
      )}
      <footer className="doc-footer"><span>{settings.businessName} · {settings.phone} · {settings.email}{settings.website ? ' · ' + settings.website : ''}</span><span>{event.contractNumber}</span></footer>
    </article>
  )
}

function SignatureModal({ event, onClose, onSign }: {
  event: BuffetEvent
  onClose: () => void
  onSign: (signature: NonNullable<BuffetEvent['signature']>) => Promise<void> | void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [name, setName] = useState(event.clientName)
  const [document, setDocument] = useState(event.clientDocument)
  const [accepted, setAccepted] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const drawing = useRef(false)

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = point(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (!p || !ctx) return
    drawing.current = true
    setHasDrawn(true)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const p = point(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (!p || !ctx) return
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#17211b'
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  const stop = () => { drawing.current = false }
  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    setError('')
  }
  const submit = async () => {
    if (!accepted || !name.trim() || !document.trim() || !hasDrawn || !canvasRef.current) return
    setSubmitting(true)
    setError('')
    try {
      await onSign({
        signerName: name.trim(),
        signerDocument: document.trim(),
        dataUrl: canvasRef.current.toDataURL('image/png'),
        signedAt: new Date().toISOString(),
        accepted: true
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir a assinatura.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="signature-backdrop">
      <div className="signature-modal">
        <button className="modal-close" onClick={onClose} disabled={submitting}><X size={20} /></button>
        <div className="signature-icon"><PenLine size={22} /></div>
        <span className="eyebrow">ASSINATURA ELETRÔNICA</span><h2>Confirme o aceite.</h2>
        <p className="lead">Revise seus dados e desenhe sua assinatura. Ao confirmar, o sistema registra a evidência técnica deste aceite.</p>
        <div className="form-grid two"><Field label="Nome completo *" value={name} onChange={setName} /><Field label="CPF / CNPJ *" value={document} onChange={setDocument} /></div>
        <div className="signature-pad-head"><label>Assinatura *</label><button onClick={clear} disabled={submitting}>Limpar</button></div>
        <canvas ref={canvasRef} width={800} height={220} className="signature-pad" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onPointerLeave={stop} />
        <label className="accept-row"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} disabled={submitting} /><span>Declaro que li integralmente o contrato, concordo com seus termos e reconheço esta assinatura eletrônica como manifestação do meu aceite.</span></label>
        {error && <div className="signature-error">{error}</div>}
        <button className="btn btn-primary full" disabled={!accepted || !name.trim() || !document.trim() || !hasDrawn || submitting} onClick={submit}><ClipboardSignature size={17} /> {submitting ? 'Registrando assinatura...' : 'Assinar e concluir contrato'}</button>
        <small className="legal-note">O registro inclui data e hora, IP, dispositivo/navegador e hash SHA-256 do conteúdo assinado. Guarde uma cópia do contrato após a conclusão.</small>
      </div>
    </div>
  )
}

function PublicSigningPage({ token }: { token: string }) {
  const [contract, setContract] = useState<RemoteContract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signing, setSigning] = useState(false)

  const loadContract = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/contracts?token=' + encodeURIComponent(token), { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Contrato não encontrado.')
      setContract(data.contract)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o contrato.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadContract()
  }, [token])

  const signContract = async (signature: NonNullable<BuffetEvent['signature']>) => {
    const response = await fetch('/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        signerName: signature.signerName,
        signerDocument: signature.signerDocument,
        dataUrl: signature.dataUrl,
        accepted: true
      })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Não foi possível registrar a assinatura.')
    setContract(data.contract)
    setSigning(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return <div className="public-state"><div className="public-state-card"><img className="brand-emblem brand-emblem--state" src={brandMark} alt="Buffet Akela" /><strong>Carregando contrato...</strong><span>Estamos buscando a versão segura do documento.</span></div></div>
  }

  if (error || !contract) {
    return <div className="public-state"><div className="public-state-card"><FileSignature size={34} /><strong>Não foi possível abrir este contrato</strong><span>{error || 'O link pode ter expirado ou estar incorreto.'}</span><button className="btn btn-quiet" onClick={loadContract}>Tentar novamente</button></div></div>
  }

  const signedEvent: BuffetEvent = {
    ...contract.event,
    signature: contract.signature || contract.event.signature
  }
  const isSigned = contract.status === 'signed' && Boolean(contract.signature)

  return (
    <div className="public-contract-page">
      <header className="public-contract-header no-print">
        <div className="public-brand">
          <img className="brand-emblem" src={brandMark} alt="Buffet Akela" />
          <div><strong>{contract.settings.businessName}</strong><span>Documento para assinatura</span></div>
        </div>
        <div className="public-header-actions">
          <span className={isSigned ? 'status status--success' : 'status status--info'}>{isSigned ? 'Assinado' : 'Aguardando assinatura'}</span>
          <button className="btn btn-quiet" onClick={() => window.print()}><Printer size={16} /> Imprimir / PDF</button>
        </div>
      </header>

      {isSigned ? (
        <div className="signed-success no-print">
          <CheckCircle2 size={22} />
          <div><strong>Contrato assinado com sucesso</strong><span>Uma cópia pode ser salva usando “Imprimir / PDF”. O documento abaixo já contém a evidência da assinatura.</span></div>
        </div>
      ) : (
        <div className="signing-intro no-print">
          <div><span className="eyebrow">ASSINATURA DIGITAL</span><strong>Olá, {contract.event.clientName}.</strong><p>Leia o contrato completo. Quando estiver de acordo, use o botão abaixo para assinar eletronicamente.</p></div>
          <button className="btn btn-primary" onClick={() => setSigning(true)}><PenLine size={17} /> Revisar e assinar</button>
        </div>
      )}

      <ContractDocument event={signedEvent} menu={contract.menu || undefined} services={contract.services} settings={contract.settings} total={contract.total} templateOverride={contract.contractTemplate} />

      {!isSigned && (
        <div className="public-sign-sticky no-print">
          <div><strong>Pronto para concluir?</strong><span>Sua assinatura será vinculada a esta versão do contrato.</span></div>
          <button className="btn btn-primary" onClick={() => setSigning(true)}><ClipboardSignature size={17} /> Assinar contrato</button>
        </div>
      )}

      {signing && <SignatureModal event={contract.event} onClose={() => setSigning(false)} onSign={signContract} />}
    </div>
  )
}

function PublicQuotePage({ token }: { token: string }) {
  const [quote, setQuote] = useState<RemoteQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQuote = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/quotes?token=' + encodeURIComponent(token), { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Orçamento não encontrado.')
      setQuote(data.quote)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o orçamento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadQuote()
  }, [token])

  if (loading) {
    return <div className="public-state"><div className="public-state-card"><img className="brand-emblem brand-emblem--state" src={brandMark} alt="Buffet Akela" /><strong>Carregando orçamento...</strong><span>Estamos preparando a sua proposta.</span></div></div>
  }

  if (error || !quote) {
    return <div className="public-state"><div className="public-state-card"><WalletCards size={34} /><strong>Não foi possível abrir este orçamento</strong><span>{error || 'O link pode estar incorreto.'}</span><button className="btn btn-quiet" onClick={loadQuote}>Tentar novamente</button></div></div>
  }

  const expired = new Date(quote.expiresAt).getTime() < Date.now()
  const phone = phoneDigits(quote.settings.phone)
  const whatsappText = encodeURIComponent('Olá! Gostaria de conversar sobre o orçamento ' + quote.event.contractNumber.replace('CTR-', 'ORC-') + ' para ' + quote.event.eventType + '.')

  return (
    <div className="public-quote-page">
      <header className="public-contract-header no-print">
        <div className="public-brand">
          <img className="brand-emblem" src={brandMark} alt="Buffet Akela" />
          <div><strong>{quote.settings.businessName}</strong><span>Proposta comercial</span></div>
        </div>
        <div className="public-header-actions">
          <span className={expired ? 'status status--neutral' : 'status status--success'}>{expired ? 'Validade encerrada' : 'Proposta válida'}</span>
          <button className="btn btn-quiet" onClick={() => window.print()}><Printer size={16} /> Salvar PDF</button>
        </div>
      </header>

      <div className="quote-public-intro no-print">
        <div><span className="eyebrow">PROPOSTA EXCLUSIVA</span><strong>Olá, {quote.event.clientName}.</strong><p>Confira abaixo todos os detalhes preparados para seu evento. Você pode salvar esta proposta em PDF ou falar diretamente com o buffet.</p></div>
        <a className="btn btn-primary" href={'https://wa.me/' + (phone.startsWith('55') ? phone : '55' + phone) + '?text=' + whatsappText} target="_blank" rel="noreferrer"><Send size={16} /> Falar com o buffet</a>
      </div>

      <QuoteDocument event={quote.event} menu={quote.menu || undefined} services={quote.services} settings={quote.settings} total={quote.total} expiresAt={quote.expiresAt} templateOverride={quote.contractTemplate} />
    </div>
  )
}

function App() {
  const signingMatch = window.location.pathname.match(/^\/assinar\/([^/]+)$/)
  const quoteMatch = window.location.pathname.match(/^\/orcamento\/([^/]+)$/)
  if (signingMatch) return <PublicSigningPage token={signingMatch[1]} />
  if (quoteMatch) return <PublicQuotePage token={quoteMatch[1]} />
  return <AdminApp />
}

function Field({ label, value, onChange, type = 'text', placeholder = '', prefix = '' }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  prefix?: string
}) {
  return <div className="field"><label>{label}</label><div className={prefix ? 'input-prefix' : ''}>{prefix && <span>{prefix}</span>}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div></div>
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="empty-state"><CalendarDays size={28} /><strong>{title}</strong><span>{subtitle}</span></div>
}

export default App
