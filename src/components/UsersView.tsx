import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, CircleAlert, Eye, EyeOff, KeyRound, Plus, RefreshCw, Search, ShieldCheck, UserRound, UserRoundX, Users, X } from 'lucide-react'
import type { AccountUser } from '../auth'

type Props = { current: AccountUser; notify: (message: string) => void }
type UserForm = { id?: string; name: string; username: string; email: string; role: 'admin'|'operador'; active: boolean; password: string }
const blank = (): UserForm => ({ name: '', username: '', email: '', role: 'operador', active: true, password: '' })
const fromUser = (u: AccountUser): UserForm => ({
  id:u.id,name:u.name,username:u.username,email:u.email||'',role:u.role,active:u.active,password:''
})
const strongPassword = () => {
  const bytes=new Uint8Array(24)
  window.crypto.getRandomValues(bytes)
  const alphabet='abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*'
  return Array.from(bytes,(n)=>alphabet[n%alphabet.length]).join('')
}
export function UsersView({ current, notify }: Props) {
  const [users,setUsers]=useState<AccountUser[]>([])
  const [form,setForm]=useState<UserForm|null>(null)
  const [query,setQuery]=useState('')
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [confirm,setConfirm]=useState('')
  const load=async () => {
    setError('');setLoading(true)
    try {
      const r=await fetch('/api/users',{cache:'no-store'})
      const body=await r.json()
      if(!r.ok)throw new Error(body.error||'Não foi possível carregar os usuários.')
      setUsers(body.users)
    }catch(e){setError(e instanceof Error?e.message:'Falha de conexão.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[])
  const change=(patch:Partial<UserForm>)=>setForm((old)=>old?{...old,...patch}:old)
  const open=(user?:AccountUser)=>{setForm(user?fromUser(user):blank());setError('');setConfirm('');setShowPassword(false)}
  const submit=async (event:FormEvent) => {
    event.preventDefault()
    if(!form||busy)return
    if(form.password && form.password!==confirm){setError('A confirmação da senha não confere.');return}
    if(!form.id && !form.password){setError('Crie uma senha para o novo usuário.');return}
    setBusy(true);setError('')
    try {
      const patch:Record<string,unknown>={
        name:form.name,username:form.username,email:form.email,
        role:form.role,active:form.active
      }
      if(form.id) patch.id=form.id
      if(form.password)patch.password=form.password
      const r=await fetch('/api/users',{method:form.id?'PATCH':'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)})
      const body=await r.json()
      if(!r.ok)throw new Error(body.error||'Não foi possível salvar o usuário.')
      notify(form.id?'Usuário atualizado.':'Usuário criado e pronto para acessar.')
      setForm(null);setConfirm('')
      await load()
    }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar.')}
    finally{setBusy(false)}
  }
  const toggle=async (user:AccountUser)=>{
    if(user.id===current.id){setError('Você não pode desativar seu próprio usuário.');return}
    const verb=user.active?'desativar':'reativar'
    if(!window.confirm('Deseja '+verb+' o acesso de '+user.name+'?'))return
    setBusy(true);setError('')
    try{
      const r=await fetch('/api/users',{method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:user.id,name:user.name,email:user.email||'',role:user.role,active:!user.active})})
      const body=await r.json()
      if(!r.ok)throw new Error(body.error||'Não foi possível alterar o acesso.')
      notify(user.active?'Acesso desativado e sessões encerradas.':'Acesso reativado.')
      await load()
    }catch(e){setError(e instanceof Error?e.message:'Falha ao alterar acesso.')}
    finally{setBusy(false)}
  }
  const filtered=users.filter(u=>[u.name,u.username,u.email||''].join(' ').toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="users-page">
      <div className="section-intro">
        <div><span className="eyebrow">CONTROLE DE ACESSO</span><h2>Usuários da plataforma</h2>
          <p>Gerencie quem pode entrar no Buffet Akela e quais permissões terá.</p></div>
        <button className="btn btn-primary" onClick={()=>open()}><Plus size={18}/> Novo usuário</button>
      </div>
      <div className="users-stats">
        <div><Users size={19}/><span>Total cadastrado</span><strong>{users.length}</strong></div>
        <div><ShieldCheck size={19}/><span>Administradores ativos</span><strong>{users.filter(u=>u.active&&u.role==='admin').length}</strong></div>
        <div><UserRound size={19}/><span>Operadores ativos</span><strong>{users.filter(u=>u.active&&u.role==='operador').length}</strong></div>
      </div>
      <div className="users-permission-notice">
        <ShieldCheck size={20}/><span><strong>Administrador:</strong> pode gerenciar usuários e utilizar toda a plataforma.
          <br/><strong>Operador:</strong> pode gerenciar eventos, cardápios, contratos e recibos, sem alterar contas ou permissões.</span>
      </div>
      <section className="panel users-panel">
        <div className="users-tools">
          <label><Search size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)}
            placeholder="Buscar pelo nome, usuário ou e-mail" /></label>
          <button className="btn btn-quiet" disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/> Atualizar</button>
        </div>
        {loading?<div className="users-empty">Carregando usuários...</div>:
          filtered.length?filtered.map(user=><div className="users-row" key={user.id}>
            <div className="users-avatar"><UserRound size={20}/></div>
            <div className="users-info"><strong>{user.name} {user.id===current.id&&<small>(você)</small>}</strong>
              <span>@{user.username}{user.email?' · '+user.email:''}</span>
              {user.last_login_at&&<small>Último acesso: {new Date(user.last_login_at).toLocaleString('pt-BR')}</small>}
            </div>
            <div className="users-tags">
              <span className={'users-role '+user.role}>{user.role==='admin'?'Administrador':'Operador'}</span>
              <span className={'users-active '+(user.active?'on':'off')}>{user.active?'Ativo':'Inativo'}</span>
            </div>
            <div className="users-actions">
              <button className="btn btn-quiet" onClick={()=>open(user)}>Editar</button>
              {user.id!==current.id&&<button className="btn btn-quiet" disabled={busy}
                onClick={()=>void toggle(user)}>
                {user.active?<UserRoundX size={15}/>:<Check size={15}/>}
                {user.active?'Desativar':'Reativar'}
              </button>}
            </div>
          </div>):<div className="users-empty">Nenhum usuário encontrado.</div>}
      </section>
      {error&&!form&&<p className="users-error" role="alert"><CircleAlert size={17}/>{error}</p>}
      {form&&<div className="modal-backdrop users-modal-backdrop">
        <form className="users-modal" onSubmit={(event)=>void submit(event)}>
          <header className="users-modal-heading"><div><span className="eyebrow">ADMINISTRAÇÃO</span>
            <h2>{form.id?'Editar usuário':'Adicionar usuário'}</h2>
            <p>{form.id?'Edite os dados e permissões. Deixe a senha vazia para mantê-la.':
                'Crie um acesso individual protegido por senha.'}</p></div>
            <button className="icon-button" type="button" aria-label="Fechar" onClick={()=>setForm(null)}><X size={20}/></button>
          </header>
          <div className="users-form">
            <div className="field"><label>Nome completo *</label><input required minLength={3} maxLength={100}
              value={form.name} onChange={(e)=>change({name:e.target.value})} placeholder="Nome do colaborador" /></div>
            <div className="field"><label>Usuário *</label><input required disabled={Boolean(form.id)} autoCapitalize="none"
              pattern="[a-z][a-z0-9._-]{2,39}" value={form.username}
              onChange={(e)=>change({username:e.target.value.toLowerCase().trim()})} placeholder="ex.: atendente" />
              <small>De 3 a 40 caracteres. Letras, números, ponto, hífen e sublinhado.</small></div>
            <div className="field"><label>E-mail (opcional)</label><input type="email" value={form.email}
              onChange={(e)=>change({email:e.target.value})} placeholder="colaborador@empresa.com" /></div>
            <div className="field"><label>Perfil de acesso *</label><select value={form.role}
              disabled={form.id===current.id}
              onChange={(e)=>change({role:e.target.value as UserForm['role']})}>
              <option value="operador">Operador — acesso operacional</option>
              <option value="admin">Administrador — acesso completo</option>
            </select></div>
            {form.id&&<div className="field"><label>Status do acesso</label>
              <select value={form.active?'active':'inactive'} disabled={form.id===current.id}
                onChange={(e)=>change({active:e.target.value==='active'})}>
                <option value="active">Ativo</option><option value="inactive">Inativo</option>
              </select></div>}
            {form.id===current.id?<div className="users-self-note"><KeyRound size={17}/>
                Para alterar sua própria senha, utilize a opção “Minha conta”.</div>:<>
              <div className="field"><label>{form.id?'Nova senha (opcional)':'Senha provisória *'}</label>
                <div className="users-password-row">
                  <input type={showPassword?'text':'password'} minLength={12} maxLength={128}
                    required={!form.id} autoComplete="new-password"
                    value={form.password} onChange={(e)=>change({password:e.target.value})}
                    placeholder="Mínimo de 12 caracteres"/>
                  <button type="button" onClick={()=>setShowPassword(!showPassword)}
                    aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                </div>
              </div>
              <div className="field"><label>Confirmar {form.id?'nova ':''}senha</label>
                <input type={showPassword?'text':'password'} required={Boolean(form.password)}
                  value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="Repita a senha"/></div>
              <button type="button" className="users-generate" onClick={()=>{const generated=strongPassword();
                change({password:generated});setConfirm(generated);setShowPassword(true)}}>
                <KeyRound size={15}/> Gerar senha forte
              </button>
              <p className="users-form-note">Copie a senha e entregue ao colaborador por um canal privado.
                A senha não poderá ser consultada após salvar.</p>
            </>}
          </div>
          {error&&<p className="users-error" role="alert"><CircleAlert size={16}/>{error}</p>}
          <footer className="users-modal-actions">
            <button type="button" className="btn btn-quiet" onClick={()=>setForm(null)} disabled={busy}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <Check size={17}/>{busy?'Salvando...':form.id?'Salvar alterações':'Criar acesso'}
            </button>
          </footer>
        </form>
      </div>}
    </div>
  )
}
