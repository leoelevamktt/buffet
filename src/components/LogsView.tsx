import { useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'

type Entry={id:string;created_at:string;event:string;ip:string;user_agent:string;username:string|null;country:string|null;city:string|null;section:string|null;path:string|null;method:string|null}
const areas:Record<string,string>={dashboard:'Visão geral',events:'Eventos',clients:'Clientes',menus:'Cardápios',contracts:'Contratos',receipts:'Recibos',agenda:'Agenda',settings:'Configurações',users:'Usuários',profile:'Minha conta',logs:'Registros',protected:'Dados protegidos'}
const events:Record<string,string>={login_success:'Login com autenticador',login_failure:'Senha de acesso incorreta',login_password_verified:'Senha de acesso verificada',login_throttled:'Tentativas de login bloqueadas',mfa_enrolled:'Autenticador ativado',mfa_failure:'Falha no segundo fator',mfa_recovery_used:'Recuperação de acesso',mfa_invitation_issued:'Convite emitido',master_unlock_success:'Dados protegidos liberados',master_unlock_failure:'Senha mestra incorreta',password_changed:'Senha alterada',logout:'Saída',page_view:'Acesso a área',admin_request:'Requisição administrativa'}
function device(ua:string) {
  if(!ua)return 'Não disponível'
  const platform=/Android/i.test(ua)?'Android':/iPhone|iPad/i.test(ua)?'iPhone/iPad':/Windows/i.test(ua)?'Windows':/Macintosh|Mac OS/i.test(ua)?'macOS':/Linux/i.test(ua)?'Linux':'Dispositivo não identificado'
  const browser=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Navegador não identificado'
  return platform+' · '+browser
}
export function recordSection(section:string) {
  void fetch('/api/session?flow=activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({section})}).catch(()=>{})
}
export function LogsView() {
  const [items,setItems]=useState<Entry[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(false)
  const load=async(more=false)=>{setLoading(true);setError('');try{const before=more?items[items.length-1]?.id:null;const r=await fetch('/api/session?flow=activity'+(before?'&before='+encodeURIComponent(before):''),{cache:'no-store'});const b=await r.json();if(!r.ok)throw Error(b.error);setItems(more?old=>[...old,...b.events]:b.events)}catch(e){setError(e instanceof Error?e.message:'Falha de conexão.')}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])
  return <div className="users-page"><div className="section-intro"><div><span className="eyebrow">SEGURANÇA</span><h2>Registros de acesso</h2>
    <p>Cidade e país são estimativas do IP; dispositivo e navegador são informados pelo acesso.</p></div>
    <button className="btn btn-quiet" disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/> Atualizar</button></div>
    {error&&<p className="users-error" role="alert">{error}</p>}
    <section className="panel users-panel" aria-label="Histórico de acesso">
      {loading?<p className="users-empty">Carregando registros...</p>:items.length?items.map(item=><article className="access-log-row" key={item.id}>
        <div><ShieldCheck size={17}/><strong>{events[item.event]||item.event}</strong><span>{item.section?areas[item.section]||item.section:item.path||'—'}</span></div>
        <div><strong>{item.username||'Usuário não identificado'}</strong><span>{new Date(item.created_at).toLocaleString('pt-BR')}</span></div>
        <div><strong>{item.ip||'IP indisponível'}</strong><span>{[item.city,item.country].filter(Boolean).join(', ')||'Localização indisponível'}</span></div>
        <div><strong>{device(item.user_agent)}</strong><span>{item.method||'Acesso pelo painel'}</span></div>
      </article>):<p className="users-empty">Nenhum registro encontrado.</p>}
    </section>{items.length>0&&<button className="btn btn-quiet" disabled={loading} onClick={()=>void load(true)}>Carregar registros anteriores</button>}</div>
}
