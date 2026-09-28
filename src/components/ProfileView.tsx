import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { AccountUser } from '../auth'

type Props = { user: AccountUser; onPasswordChanged: () => void }
export function ProfileView({ user, onPasswordChanged }: Props) {
  const [current,setCurrent]=useState('')
  const [next,setNext]=useState('')
  const [confirm,setConfirm]=useState('')
  const [visible,setVisible]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const submit=async(event:FormEvent)=>{
    event.preventDefault()
    if(next!==confirm){setError('A confirmação não corresponde à nova senha.');return}
    setBusy(true);setError('')
    try{
      const r=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({currentPassword:current,newPassword:next})})
      const body=await r.json()
      if(!r.ok)throw new Error(body.error||'Não foi possível alterar a senha.')
      setCurrent('');setNext('');setConfirm('')
      onPasswordChanged()
    }catch(err){setError(err instanceof Error?err.message:'Falha ao alterar senha.')}
    finally{setBusy(false)}
  }
  return <div className="profile-page">
    <div className="section-intro"><div><span className="eyebrow">PERFIL E SEGURANÇA</span>
      <h2>Minha conta</h2><p>Confira sua identificação e mantenha sua senha protegida.</p></div></div>
    <div className="profile-grid">
      <section className="panel profile-card">
        <div className="profile-avatar"><ShieldCheck size={34}/></div>
        <h3>{user.name}</h3>
        <div className="profile-identity">
          <div><span>Usuário</span><strong>@{user.username}</strong></div>
          <div><span>Perfil</span><strong>{user.role==='admin'?'Administrador':'Operador'}</strong></div>
          {user.email&&<div><span>E-mail</span><strong>{user.email}</strong></div>}
        </div>
      </section>
      <section className="panel profile-password">
        <div><div className="profile-subhead"><LockKeyhole size={20}/><h3>Alterar minha senha</h3></div>
          <p>Use uma senha exclusiva de 12 caracteres ou mais. Ao alterar, todas as suas sessões serão encerradas.</p></div>
        <form onSubmit={(e)=>void submit(e)}>
          <div className="field"><label>Senha atual</label>
            <input type={visible?'text':'password'} value={current} required autoComplete="current-password"
              onChange={(e)=>setCurrent(e.target.value)} /></div>
          <div className="field"><label>Nova senha</label>
            <input type={visible?'text':'password'} value={next} required minLength={12} maxLength={128}
              autoComplete="new-password" onChange={(e)=>setNext(e.target.value)}/></div>
          <div className="field"><label>Confirmar nova senha</label>
            <input type={visible?'text':'password'} value={confirm} required
              autoComplete="new-password" onChange={(e)=>setConfirm(e.target.value)}/></div>
          <label className="profile-show"><input type="checkbox" checked={visible} onChange={()=>setVisible(!visible)}/>
            {visible?<EyeOff size={15}/>:<Eye size={15}/>} Mostrar senhas</label>
          {error&&<p className="users-error" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={!current||next.length<12||!confirm||busy}>
            {busy?'Alterando...':<><KeyRound size={16}/> Atualizar senha</>}
          </button>
        </form>
      </section>
    </div>
  </div>
}
