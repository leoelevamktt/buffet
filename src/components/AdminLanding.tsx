import { useEffect, useState } from 'react'
import { brandMark } from '../brand'
import type { AccountUser } from '../auth'
import { UsersView } from './UsersView'
import { ProfileView } from './ProfileView'
import { LogsView, recordSection } from './LogsView'

type Page='home'|'users'|'profile'|'logs'
type Props={user:AccountUser;onProtected:()=>void;onLogout:()=>void}
export function AdminLanding({user,onProtected,onLogout}:Props) {
  const [page,setPage]=useState<Page>('home')
  const [notice,setNotice]=useState('')
  useEffect(()=>{recordSection(page==='home'?'dashboard':page)},[page])
  return <main className="admin-landing"><header className="admin-landing-header">
    <img src={brandMark} alt="Buffet Akela"/><div><strong>Buffet Akela</strong><span>{user.name}</span></div>
    <button className="btn btn-quiet" onClick={onLogout}>Sair</button></header>
    <nav className="admin-landing-nav" aria-label="Administração">
      <button className="btn btn-quiet" onClick={()=>setPage('home')}>Início</button>
      {user.role==='admin'&&<button className="btn btn-quiet" onClick={()=>setPage('users')}>Usuários</button>}
      {user.role==='admin'&&<button className="btn btn-quiet" onClick={()=>setPage('logs')}>Registros de acesso</button>}
      <button className="btn btn-quiet" onClick={()=>setPage('profile')}>Minha conta</button>
    </nav>
    <div className="page">{notice&&<p role="status">{notice}</p>}
      {page==='home'&&<section className="panel admin-landing-intro"><span className="eyebrow">PAINEL ADMINISTRATIVO</span>
        <h1>Olá, {user.name}</h1><p>Seu acesso está protegido pela autenticação em duas etapas.</p>
        <p>Para visualizar informações de clientes, eventos, contratos e valores, informe a senha mestra.</p>
        <button className="btn btn-primary" onClick={()=>{recordSection('protected');onProtected()}}>Acessar dados protegidos</button>
      </section>}
      {page==='users'&&user.role==='admin'&&<UsersView current={user} notify={setNotice}/>}
      {page==='logs'&&user.role==='admin'&&<LogsView/>}
      {page==='profile'&&<ProfileView user={user} onPasswordChanged={onLogout}/>}
    </div></main>
}
