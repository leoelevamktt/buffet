import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Props = { initialStage: string; onComplete: () => void; onCancel: () => void }
export function MfaAccess({ initialStage, onComplete, onCancel }: Props) {
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
    void fetch('/api/mfa',{cache:'no-store'}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error);setDisplay(body)})
      .catch(e=>setError(e.message||'Não foi possível iniciar a configuração.'))
  },[stage])
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(busy)return
    setBusy(true);setError('')
    try{
      const action=stage==='invite'?'activate':stage==='setup'?'enroll':recovery?'recover':'verify'
      const r=await fetch('/api/mfa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,code,invitation})})
      const body=await r.json();if(!r.ok)throw new Error(body.error||'Não foi possível validar o código.')
      setCode('');setInvitation('')
      if(body.recoveryCodes){setCodes(body.recoveryCodes);setStage('codes')}
      else if(body.authenticated)onComplete()
      else {setRecovery(false);setStage(body.stage)}
    }catch(err){setError(err instanceof Error?err.message:'Falha de conexão.')}
    finally{setBusy(false)}
  }
  if(stage==='codes')return <><h1>Guarde seus códigos de recuperação</h1><p>Cada código pode ser usado uma vez se você perder o autenticador. Guarde-os em local seguro; eles não serão mostrados novamente.</p>
    <pre>{codes.join('\n')}</pre><button type="button" className="btn btn-quiet" onClick={()=>void navigator.clipboard.writeText(codes.join('\n'))}>Copiar códigos</button>
    <button type="button" className="btn btn-primary" onClick={()=>{setCodes([]);onComplete()}}>Já guardei os códigos</button></>
  return <><h1>{stage==='invite'?'Ativar autenticação em duas etapas':stage==='setup'?'Configure seu autenticador':'Verificação em duas etapas'}</h1>
    {stage==='invite'&&<p>Informe o convite individual fornecido pelo administrador.</p>}
    {stage==='setup'&&<><p>Leia o QR code com seu aplicativo autenticador ou digite a chave manualmente.</p>
      {display.qrImage&&<img src={display.qrImage} width={240} height={240} alt="QR code para adicionar a conta no autenticador"/>}
      {display.secret&&<p>Chave: <strong>{display.secret}</strong></p>}</>}
    {stage==='verify'&&<p>{recovery?'Digite um dos seus códigos de recuperação. Você configurará um novo autenticador.':'Digite o código exibido pelo seu aplicativo autenticador.'}</p>}
    <form className="workspace-access-form" onSubmit={e=>void submit(e)}>
      {stage==='invite'?<><label htmlFor="mfa-invitation">Convite individual</label><input id="mfa-invitation" required autoComplete="off" value={invitation} onChange={e=>setInvitation(e.target.value.trim())}/></>:
        <><label htmlFor="mfa-code">{recovery?'Código de recuperação':'Código de seis dígitos'}</label><input id="mfa-code" required autoComplete="one-time-code" inputMode={recovery?'text':'numeric'} maxLength={recovery?64:6} pattern={recovery?undefined:'[0-9]{6}'} value={code} onChange={e=>setCode(e.target.value)}/></>}
      <button className="btn btn-primary" disabled={busy || (stage==='setup'&&!display.secret)}>{busy?'Validando...':'Continuar'}</button>
      {stage==='verify'&&<button type="button" className="btn btn-quiet" onClick={()=>{setRecovery(!recovery);setCode('');setError('')}}>{recovery?'Usar autenticador':'Usar código de recuperação'}</button>}
      <button type="button" className="btn btn-quiet" onClick={onCancel}>Cancelar</button>
    </form>{error&&<p className="workspace-access-error" role="alert">{error}</p>}</>
}
