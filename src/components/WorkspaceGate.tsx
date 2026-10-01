import { useEffect, useState } from 'react'
import type { ReactNode, FormEvent } from 'react'
import { ArrowRight, Cloud, Database, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { brandMark } from '../brand'
import { browserSnapshot, initialWorkspace, normalizeWorkspace, type WorkspaceData } from '../workspace'
import type { AccountUser } from '../auth'

type Props = { children: (data: WorkspaceData, revision: number, user: AccountUser, logout: () => void) => ReactNode }
type Loaded = { data: WorkspaceData; revision: number }
export function WorkspaceGate({ children }: Props) {
  const [phase, setPhase] = useState<'loading' | 'login' | 'bootstrap' | 'ready' | 'failed'>('loading')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('admin')
  const [user, setUser] = useState<AccountUser | null>(null)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [local] = useState(browserSnapshot)
  const localAvailable = ['maison-events','maison-menus','maison-services','maison-settings','akela-receipts','akela-clients']
    .some((key) => window.localStorage.getItem(key) !== null)

  const load = async () => {
    const status = await fetch('/api/session', { cache: 'no-store' })
    if (!status.ok) throw new Error('Autenticação do servidor indisponível. Verifique as configurações do painel.')
    const session = await status.json()
    if (!session.authenticated || !session.user) { setUser(null); setPhase('login'); return }
    setUser(session.user)
    const result = await fetch('/api/workspace', { cache: 'no-store' })
    if (result.status === 401) { setPhase('login'); return }
    const body = await result.json()
    if (!result.ok) throw new Error(body.error || 'Não foi possível consultar o Neon.')
    if (!body.initialized) { setPhase('bootstrap'); return }
    const normalized = normalizeWorkspace(body.data)
    let revision = body.revision
    if (!Array.isArray(body.data?.clients)) {
      const migration = await fetch('/api/workspace', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: normalized, revision })
      })
      const migrated = await migration.json()
      if (!migration.ok) throw new Error(migrated.error || 'Não foi possível migrar os clientes existentes.')
      revision = migrated.revision
    }
    setLoaded({ data: normalized, revision })
    setPhase('ready')
  }
  useEffect(() => { void load().catch((err) => { setError(err.message); setPhase('failed') }) }, [])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    if (working) return
    setWorking(true); setError('')
    try {
      const result = await fetch('/api/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const body = await result.json()
      if (!result.ok) throw new Error(body.error || 'Falha no acesso.')
      setPassword('')
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao entrar.') }
    finally { setWorking(false) }
  }
  const bootstrap = async (importLegacy: boolean) => {
    setWorking(true); setError('')
    try {
      const payload = importLegacy ? local : initialWorkspace()
      const response = await fetch('/api/workspace', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload, revision: 0 })
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível inicializar o banco.')
      setLoaded({ data: payload, revision: body.revision })
      setPhase('ready')
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao importar.') }
    finally { setWorking(false) }
  }
  const logout = () => {
    void fetch('/api/session', { method: 'DELETE' }).finally(() => {
      setLoaded(null); setUser(null); setPhase('login'); setPassword('')
    })
  }
  if (phase === 'ready' && loaded && user) return <>{children(loaded.data, loaded.revision, user, logout)}</>
  return (
    <main className="workspace-access">
      <section className="workspace-access-card">
        <img src={brandMark} alt="Buffet Akela" className="workspace-access-logo"/>
        <div className="workspace-access-eyebrow"><ShieldCheck size={14}/> GESTÃO SEGURA DO BUFFET</div>
        {phase === 'loading' && <><h1>Conectando ao banco...</h1><p>Verificando o acesso à plataforma.</p></>}
        {phase === 'login' && <>
          <h1>Bem-vindo ao Buffet Akela</h1>
          <p>Faça login com seu usuário individual para acessar os eventos, recibos e contratos armazenados no Neon.</p>
          <form className="workspace-access-form" onSubmit={login}>
            <label htmlFor="admin-username">Usuário ou e-mail</label>
            <div className="workspace-password"><ShieldCheck size={18}/><input id="admin-username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu usuário" /></div>
            <label htmlFor="admin-password">Senha</label>
            <div className="workspace-password">
              <Lock size={18}/><input id="admin-password" type={visible ? 'text':'password'}
                autoComplete="current-password" autoFocus required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha"/>
              <button type="button" onClick={()=>setVisible(!visible)}
                aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button>
            </div>
            <button className="btn btn-primary" disabled={working || !password || !username} type="submit">
              {working ? 'Validando...' : 'Entrar no painel'}<ArrowRight size={17}/>
            </button>
          </form>
        </>}
        {phase === 'bootstrap' && <>
          <div className="workspace-intro-icon"><Database size={25}/></div>
          <h1>Preparar armazenamento Neon</h1>
          <p>Seu banco ainda está vazio. Escolha como criar o ambiente de trabalho.</p>
          {localAvailable ? (
            <button className="workspace-choice" onClick={()=>void bootstrap(true)} disabled={working}>
              <Cloud size={23}/><span><strong>Importar os dados deste navegador</strong>
              <small>{local.events.length} evento(s), {local.clients.length} cliente(s), {local.receipts.length} recibo(s), cardápios e configurações locais.</small></span><ArrowRight size={18}/>
            </button>
          ) : <div className="workspace-import-info">Nenhum evento ou recibo local foi encontrado neste navegador.</div>}
          <button className="workspace-choice" onClick={()=>void bootstrap(false)} disabled={working}>
            <Database size={23}/><span><strong>Começar com um banco vazio</strong>
            <small>Carregar cardápios oficiais e configurações iniciais, sem importar eventos.</small></span><ArrowRight size={18}/>
          </button>
          <p className="workspace-import-warning">A importação é feita apenas após sua escolha e não apaga os dados locais.</p>
        </>}
        {phase === 'failed' && <><h1>Conexão indisponível</h1><p>O painel não foi liberado para evitar gravar dados fora do banco.</p>
          <button className="btn btn-quiet" onClick={()=>{setPhase('loading');setError('');void load().catch((e)=>{setError(e.message);setPhase('failed')})}}>Tentar novamente</button></>}
        {working && phase === 'bootstrap' && <p className="workspace-activity">Salvando os dados no Neon...</p>}
        {error && <p className="workspace-access-error" role="alert">{error}</p>}
        <footer><ShieldCheck size={14}/> Acesso restrito · conexão segura com PostgreSQL</footer>
      </section>
    </main>
  )
}
