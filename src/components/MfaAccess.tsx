import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Props = { initialStage: string; onComplete: () => void; onRestart: (message: string) => void; onCancel: () => void }
export function MfaAccess({ initialStage, onComplete, onRestart, onCancel }: Props) {
  const [stage,setStage]=useState(initialStage)
  const [code,setCode]=useState('')
  const [invitation,setInvitation]=useState('')
  const [recovery,setRecovery]=useState(false)
  const [display,setDisplay]=useState<{secret?:string;qrImage?:string}>({})
  const [codes,setCodes]=useState<string[]>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{
    const match=window.location.hash.match(/^#ativar-2fa=([A-Za-z0-9_-]{32})$/)
    if(match){setInvitation(match[1]);window.history.replaceState(null,'',window.location.pathname+window.location.search)}
  },[])
  useEffect(()=>{
    if(stage!=='setup')return
    void fetch('/api/session?flow=mfa',{cache:'no-store'}).then(async r=>{
      const body=await r.json()
      if(body.restartLogin){onRestart(body.error);return}
      if(!r.ok)throw new Error(body.error)
      setDisplay(body)
    }).catch(e=>setError(e.message||'Não foi possível iniciar a configuração.'))
  },[stage])
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(busy)return
    setBusy(true);setError('')
    try{
      const action=stage==='invite'?'activate':stage==='setup'?'enroll':stage==='email'?'verify_email':recovery?'recover':'verify'
      const r=await fetch('/api/session?flow=mfa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,code,invitation})})
      const body=await r.json()
      if(body.restartLogin){onRestart(body.error);return}
      if(!r.ok){
        if(action==='verify' && r.status===401){
          setCode('')
          throw new Error('O código não foi aceito. Aguarde um novo código no autenticador e tente novamente.')
        }
        if(action==='verify_email' && r.status===401){
          setCode('')
          throw new Error('Confira os seis dígitos do e-mail mais recente e tente novamente.')
        }
        throw new Error(body.error||'Não foi possível validar o código.')
      }
      setCode('');setInvitation('')
      if(body.recoveryCodes){setCodes(body.recoveryCodes);setStage('codes')}
      else if(body.authenticated)onComplete()
      else {setRecovery(false);setStage(body.stage)}
    }catch(err){setError(err instanceof Error?err.message:'Falha de conexão.')}
    finally{setBusy(false)}
  }
  if(stage==='codes')return <><h1>Guarde seus códigos de recuperação</h1><p>Cada código pode ser usado uma vez se você perder o autenticador. Guarde-os em local seguro. Eles aparecem apenas agora.</p>
    <pre>{codes.join('\n')}</pre><button type="button" className="btn btn-quiet" onClick={()=>void navigator.clipboard.writeText(codes.join('\n'))}>Copiar códigos</button>
    <button type="button" className="btn btn-primary" onClick={()=>{setCodes([]);onComplete()}}>Já guardei os códigos</button></>
  return <><h1>{stage==='invite'?'Ativar autenticação em duas etapas':stage==='setup'?'Configure seu autenticador':stage==='email'?'Confira seu e-mail':recovery?'Recuperar acesso':'Confirme seu acesso'}</h1>
    {stage==='invite'&&<p>Use o convite individual enviado pelo administrador para configurar o acesso.</p>}
    {stage==='setup'&&<><p>No aplicativo autenticador, adicione a conta pelo QR code ou pela chave abaixo. Depois, volte aqui e digite o código gerado.</p>
      {display.qrImage&&<img className="workspace-access-qr" src={display.qrImage} width={240} height={240} alt="QR code para adicionar a conta no autenticador"/>}
      {display.secret&&<p>Chave de configuração <strong>{display.secret}</strong></p>}</>}
    {stage==='email'&&<p>Enviamos um código de seis dígitos ao e-mail cadastrado. Ele vale por 5 minutos. Se não aparecer, confira a pasta de spam.</p>}
    {stage==='verify'&&<p>{recovery?'Use um dos códigos que você guardou na ativação. Depois, configure um novo autenticador.':'Abra o aplicativo autenticador, procure a conta Buffet Akela e digite o código de seis dígitos.'}</p>}
    <form className="workspace-access-form" onSubmit={e=>void submit(e)}>
      {stage==='invite'?<><label htmlFor="mfa-invitation">Convite individual</label><input className="input" id="mfa-invitation" autoFocus required autoComplete="off" autoCapitalize="none" spellCheck={false} value={invitation} onChange={e=>setInvitation(e.target.value.trim())}/></>:
        <><label htmlFor="mfa-code">{recovery?'Código de recuperação':'Código de seis dígitos'}</label><input key={recovery?'recovery':'otp'} className="input" id="mfa-code" required autoFocus={stage==='verify'||stage==='email'}
          autoComplete={recovery?'off':'one-time-code'} autoCapitalize="none" spellCheck={false}
          inputMode={recovery?'text':'numeric'} maxLength={recovery?64:undefined} pattern={recovery?undefined:'[0-9]{6}'}
          value={code} onChange={e=>setCode(recovery?e.target.value:e.target.value.replace(/[\s-]/g,''))}/></>}
      <button className="btn btn-primary" disabled={busy || (stage==='setup'&&!display.secret)}>{busy?'Verificando…':(stage==='email'||stage==='verify'&&!recovery)?'Entrar no painel':'Continuar'}</button>
      {stage==='verify'&&<button type="button" className="btn btn-quiet" disabled={busy} onClick={()=>{setRecovery(!recovery);setCode('');setError('')}}>{recovery?'Usar autenticador':'Usar código de recuperação'}</button>}
      <button type="button" className="btn btn-quiet" disabled={busy} onClick={onCancel}>{stage==='email'?'Voltar e solicitar novo código':'Voltar para o login'}</button>
    </form>{error&&<p className="workspace-access-error" role="alert">{error}</p>}</>
}
