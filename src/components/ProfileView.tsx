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
  const [appEnabled,setAppEnabled]=useState(Boolean(user.mfa_enabled_at))
  const [factorError,setFactorError]=useState('')
  const [setup,setSetup]=useState<{secret:string;qrImage:string}|null>(null)
  const [recoveryPassword,setRecoveryPassword]=useState('')
  const [recoveryCode,setRecoveryCode]=useState('')
  const [recoveryCodes,setRecoveryCodes]=useState<string[]>([])
  const configureAuthenticator=async(event:FormEvent)=>{
    event.preventDefault();setBusy(true);setFactorError('')
    const action=appEnabled?'regenerate_codes':setup?'enroll':'start_profile'
    try{
      const r=await fetch('/api/session?flow=mfa',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action,password:recoveryPassword,code:recoveryCode})})
      const body=await r.json()
      if(body.restartLogin){setSetup(null);setRecoveryCode('');throw new Error('A configuração expirou. Informe sua senha para começar novamente.')}
      if(!r.ok)throw new Error(body.error||'Não foi possível configurar o autenticador.')
      setRecoveryPassword('');setRecoveryCode('')
      if(action==='start_profile')setSetup({secret:body.secret,qrImage:body.qrImage})
      else {setSetup(null);setAppEnabled(true);setRecoveryCodes(body.recoveryCodes)}
    }catch(err){setFactorError(err instanceof Error?err.message:'Falha de conexão.')}
    finally{setBusy(false)}
  }
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
        <div className="profile-subhead"><ShieldCheck size={20}/><h3>Aplicativo autenticador</h3></div>
        {recoveryCodes.length?<><p>Guarde estes códigos de recuperação em local seguro. Cada código pode ser usado uma vez.</p>
          <pre>{recoveryCodes.join('\n')}</pre><button className="btn btn-quiet" onClick={()=>void navigator.clipboard.writeText(recoveryCodes.join('\n'))}>Copiar códigos</button>
          <button className="btn btn-primary" onClick={()=>setRecoveryCodes([])}>Já guardei</button></>:
          <form onSubmit={configureAuthenticator}>
            {setup?<><p>Adicione a conta pelo QR code ou pela chave abaixo. Depois, confirme com o código de seis dígitos gerado no aplicativo.</p>
              <img className="workspace-access-qr" src={setup.qrImage} width={200} height={200} alt="QR code para configurar o autenticador"/>
              <p>Chave de configuração <strong>{setup.secret}</strong></p></>:
              <><p>{appEnabled?'O aplicativo está ativo. Confirme sua senha e um código do aplicativo para gerar novos códigos de recuperação.':
                'Opcional. Ao ativar o aplicativo, você passa a usar o código dele nos próximos acessos.'}</p>
              <div className="field"><label htmlFor="recovery-password">Senha atual</label>
                <input id="recovery-password" type="password" required autoComplete="current-password" value={recoveryPassword} onChange={e=>setRecoveryPassword(e.target.value)}/>
              </div></>}
            {(appEnabled||setup)&&<div className="field"><label htmlFor="recovery-code">Código do autenticador</label>
              <input id="recovery-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={recoveryCode}
                onChange={e=>setRecoveryCode(e.target.value.replace(/[\s-]/g,''))}/>
            </div>}
            <button className="btn btn-primary" disabled={busy}>{busy?'Verificando…':appEnabled?'Gerar novos códigos':setup?'Confirmar ativação':'Configurar autenticador'}</button>
            {setup&&<button className="btn btn-quiet" type="button" disabled={busy} onClick={()=>{setSetup(null);setRecoveryCode('');setFactorError('')}}>Cancelar configuração</button>}
          </form>}
        {factorError&&<p className="users-error" role="alert">{factorError}</p>}
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
