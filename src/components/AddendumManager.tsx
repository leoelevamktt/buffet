import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bold, Check, Copy, FilePlus2, FileText, Italic, List, ListOrdered, PenLine, Printer, Send, ShieldCheck, Underline, X } from 'lucide-react'
import { defaultAddendumHtml, newAddendum, sanitizeAddendumHtml } from '../addenda'
import type { BuffetEvent, BusinessSettings, ContractAddendum } from '../types'
import { phoneDigits } from '../utils'
import { AddendumDocument } from './AddendumDocument'

type Props = {
  event: BuffetEvent
  settings: BusinessSettings
  onChange: (addenda: ContractAddendum[]) => void
  onClose: () => void
  notify: (message: string) => void
}

const stateLabel = (status: ContractAddendum['status']) =>
  status === 'Assinado' ? 'Assinado' : status === 'Enviado' ? 'Aguardando assinatura' : 'Rascunho'

export function AddendumManager({ event, settings, onChange, onClose, notify }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(event.addenda?.[0]?.id || null)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftHtml, setDraftHtml] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)

  const addenda = event.addenda || []
  const selected = addenda.find((item) => item.id === selectedId) || null

  const patch = (id: string, changes: Partial<ContractAddendum>) =>
    onChange(addenda.map((item) => item.id === id ? { ...item, ...changes } : item))

  const create = () => {
    if (event.contractStatus !== 'Assinado' || !event.signature?.documentHash || !event.shareToken) {
      setError('O contrato original precisa estar assinado e possuir registro técnico antes de criar um adendo.')
      return
    }
    const item = newAddendum(event, settings)
    onChange([item, ...addenda])
    setSelectedId(item.id)
    setDraftTitle(item.title)
    setDraftHtml(item.html)
    setEditing(true)
    setError('')
  }

  const beginEdit = async (item: ContractAddendum) => {
    if (item.status === 'Assinado') {
      setError('Um adendo assinado não pode ser alterado. Crie um novo adendo para registrar outra modificação.')
      return
    }
    if (item.status === 'Enviado' && item.shareToken) {
      if (!window.confirm('Este adendo já possui link de assinatura. Para editar, o link atual será revogado. Continuar?')) return
      setBusy(true)
      try {
        const response = await fetch('/api/addenda?token=' + encodeURIComponent(item.shareToken), { method: 'DELETE' })
        if (![204, 404].includes(response.status)) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Não foi possível revogar o link anterior.')
        }
        patch(item.id, { status: 'Rascunho', shareToken: undefined, shareUrl: undefined, sharedAt: undefined })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível editar este adendo.')
        setBusy(false)
        return
      }
      setBusy(false)
    }
    setSelectedId(item.id)
    setDraftTitle(item.title)
    setDraftHtml(item.html)
    setEditing(true)
    setError('')
    window.setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = sanitizeAddendumHtml(item.html)
    }, 0)
  }

  useEffect(() => {
    if (!editing || !editorRef.current) return
    editorRef.current.innerHTML = sanitizeAddendumHtml(draftHtml)
  }, [editing, selectedId])

  const saveDraft = () => {
    if (!selected) return
    const html = sanitizeAddendumHtml(editorRef.current?.innerHTML || draftHtml)
    const text = new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() || ''
    if (draftTitle.trim().length < 4 || text.length < 30) {
      setError('Informe um título e conteúdo suficiente para o adendo.')
      return
    }
    patch(selected.id, {
      title: draftTitle.trim().slice(0, 180),
      html,
      status: 'Rascunho',
      updatedAt: new Date().toISOString(),
      shareToken: undefined,
      shareUrl: undefined,
      sharedAt: undefined
    })
    setDraftHtml(html)
    setEditing(false)
    setError('')
    notify('Adendo salvo como rascunho.')
  }

  const generateLink = async (item: ContractAddendum) => {
    if (item.status === 'Assinado') return item.shareUrl || ''
    if (item.shareUrl && item.shareToken) return item.shareUrl
    if (!item.originalContractToken) {
      setError('O vínculo com o contrato assinado original não está disponível.')
      return ''
    }
    const text = new DOMParser().parseFromString(item.html, 'text/html').body.textContent?.toLowerCase() || ''
    const draftMarkers = ['preencher se houver alteração', 'descrever inclusões', 'informar novo valor', 'inserir a nova redação', 'substitua este texto', 'descreva itens incluídos', 'informe se haverá']
    if (draftMarkers.some((marker) => text.includes(marker))) {
      const proceed = window.confirm('O adendo ainda contém textos de orientação do modelo. Revise o conteúdo antes de enviar. Deseja gerar o link mesmo assim?')
      if (!proceed) {
        setError('Revise os trechos de orientação e remova o que não fizer parte do acordo antes do envio.')
        return ''
      }
    }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/addenda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContractToken: item.originalContractToken,
          number: item.number,
          title: item.title,
          html: item.html,
          client: {
            name: event.clientName,
            document: event.clientDocument,
            email: event.clientEmail,
            address: event.clientAddress || ''
          },
          settings,
          eventReference: { id: event.id, type: event.eventType, date: event.eventDate }
        })
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível criar o link do adendo.')
      patch(item.id, {
        status: 'Enviado',
        shareToken: body.token,
        shareUrl: body.url,
        sharedAt: new Date().toISOString(),
        originalDocumentHash: body.addendum?.document?.originalContract?.documentHash || item.originalDocumentHash,
        originalVerificationCode: body.addendum?.document?.originalContract?.verificationCode || item.originalVerificationCode
      })
      notify('Link seguro do adendo criado.')
      return body.url as string
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar link.')
      return ''
    } finally { setBusy(false) }
  }

  const sync = async (item: ContractAddendum, quiet = false) => {
    if (!item.shareToken) return
    if (!quiet) setBusy(true)
    try {
      const response = await fetch('/api/addenda?token=' + encodeURIComponent(item.shareToken), { cache: 'no-store' })
      if (!response.ok) return
      const body = await response.json()
      const remote = body.addendum
      if (remote?.status === 'signed' && remote.signature) {
        patch(item.id, {
          status: 'Assinado',
          signedAt: remote.signedAt,
          signature: remote.signature,
          originalDocumentHash: remote.document?.originalContract?.documentHash || item.originalDocumentHash,
          originalVerificationCode: remote.document?.originalContract?.verificationCode || item.originalVerificationCode
        })
        if (!quiet) notify('Assinatura do adendo sincronizada.')
      }
    } finally { if (!quiet) setBusy(false) }
  }

  useEffect(() => {
    const pending = addenda.filter((item) => item.status === 'Enviado' && item.shareToken)
    if (!pending.length) return
    pending.forEach((item) => void sync(item, true))
    const timer = window.setInterval(() => pending.forEach((item) => void sync(item, true)), 15000)
    return () => window.clearInterval(timer)
  }, [addenda.map((item) => item.id + ':' + item.status + ':' + (item.shareToken || '')).join('|')])

  const copy = async (item: ContractAddendum) => {
    const url = await generateLink(item)
    if (!url) return
    await navigator.clipboard.writeText(url)
    notify('Link do adendo copiado.')
  }
  const open = async (item: ContractAddendum) => {
    const popup = window.open('about:blank', '_blank')
    const url = await generateLink(item)
    if (!url) { popup?.close(); return }
    if (popup) { popup.opener = null; popup.location.replace(url) }
    else { await navigator.clipboard.writeText(url); notify('Link copiado. O navegador bloqueou a nova aba.') }
  }
  const whatsapp = async (item: ContractAddendum) => {
    const popup = window.open('about:blank', '_blank')
    const url = await generateLink(item)
    if (!url) { popup?.close(); return }
    const text = 'Olá, ' + event.clientName + '! Foi preparado o adendo ' + item.number +
      ' referente ao contrato ' + event.contractNumber + '. Leia e assine eletronicamente aqui: ' + url
    const digits = phoneDigits(event.clientPhone || event.clientPhoneSecondary || '')
    const target = digits ? 'https://wa.me/' + (digits.startsWith('55') ? digits : '55' + digits) +
      '?text=' + encodeURIComponent(text) : 'https://wa.me/?text=' + encodeURIComponent(text)
    if (popup) { popup.opener = null; popup.location.replace(target) }
    else { await navigator.clipboard.writeText(text); notify('Mensagem copiada.') }
  }

  const command = (name: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(name, false, value)
  }

  const previewDocument = selected ? {
    number: selected.number,
    title: selected.title,
    html: selected.html,
    originalContract: {
      number: selected.originalContractNumber,
      documentHash: selected.originalDocumentHash,
      verificationCode: selected.originalVerificationCode,
      signedAt: event.signature?.signedAt || null
    },
    client: {
      name: event.clientName, document: event.clientDocument, email: event.clientEmail,
      address: event.clientAddress || ''
    },
    settings: {
      businessName: settings.businessName, legalName: settings.legalName, document: settings.document,
      address: settings.address, city: settings.city, email: settings.email, phone: settings.phone
    },
    eventReference: { id: event.id, type: event.eventType, date: event.eventDate }
  } : null

  return (
    <div className="addendum-overlay">
      <div className="addendum-shell">
        <header className="addendum-manager-head">
          <div><span className="eyebrow">ADENDOS DO CONTRATO</span><h2>{event.contractNumber}</h2>
            <p>O contrato assinado permanece imutável. Cada alteração posterior é registrada em um novo adendo com nova assinatura.</p></div>
          <div><button className="btn btn-primary" onClick={create}><FilePlus2 size={16}/> Novo adendo</button>
            <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>
        </header>

        <div className="addendum-manager-body">
          <aside className="addendum-list">
            {addenda.length ? addenda.map((item) =>
              <button key={item.id} className={selectedId === item.id ? 'active' : ''} onClick={() => { setSelectedId(item.id); setEditing(false); setError('') }}>
                <FileText size={18}/><span><strong>{item.number}</strong><small>{item.title}</small></span>
                <em className={'addendum-status ' + item.status.toLowerCase()}>{stateLabel(item.status)}</em>
              </button>) : <div className="addendum-empty"><ShieldCheck size={27}/><strong>Nenhum adendo</strong>
                <span>Crie um quando precisar alterar qualquer condição depois da assinatura do contrato.</span></div>}
          </aside>

          <main className="addendum-main">
            {error && <div className="addendum-error">{error}</div>}
            {!selected && <div className="addendum-start"><FilePlus2 size={38}/><h3>Contrato assinado preservado</h3>
              <p>Use “Novo adendo” para registrar uma alteração sem modificar o documento original.</p></div>}

            {selected && editing && <div className="addendum-editor">
              <div className="addendum-editor-bar">
                <button title="Negrito" onMouseDown={(e)=>{e.preventDefault();command('bold')}}><Bold size={16}/></button>
                <button title="Itálico" onMouseDown={(e)=>{e.preventDefault();command('italic')}}><Italic size={16}/></button>
                <button title="Sublinhado" onMouseDown={(e)=>{e.preventDefault();command('underline')}}><Underline size={16}/></button>
                <button title="Lista" onMouseDown={(e)=>{e.preventDefault();command('insertUnorderedList')}}><List size={16}/></button>
                <button title="Lista numerada" onMouseDown={(e)=>{e.preventDefault();command('insertOrderedList')}}><ListOrdered size={16}/></button>
                <select defaultValue="P" onChange={(e)=>command('formatBlock',e.target.value)}>
                  <option value="P">Texto</option><option value="H1">Título 1</option><option value="H2">Título 2</option><option value="H3">Título 3</option>
                </select>
                <button className="addendum-template-button" type="button" title="Aplicar modelo profissional completo"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (!selected) return
                    if (!window.confirm('Substituir o conteúdo atual pelo modelo profissional completo? As alterações ainda não salvas serão perdidas.')) return
                    const html = defaultAddendumHtml(event, settings, selected.number)
                    setDraftHtml(html)
                    window.setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = sanitizeAddendumHtml(html) }, 0)
                  }}><FilePlus2 size={15}/> Modelo profissional</button>
              </div>
              <label className="addendum-title-field">Título do documento
                <input value={draftTitle} onChange={(e)=>setDraftTitle(e.target.value)} maxLength={180}/></label>
              <div ref={editorRef} className="addendum-editor-page" contentEditable suppressContentEditableWarning spellCheck/>
              <div className="addendum-editor-actions"><button className="btn btn-quiet" onClick={()=>setEditing(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={saveDraft}><Check size={16}/> Salvar adendo</button></div>
            </div>}

            {selected && !editing && previewDocument && <>
              <div className="addendum-actions">
                <div><span className={'status ' + (selected.status === 'Assinado' ? 'status--success' : selected.status === 'Enviado' ? 'status--info' : 'status--neutral')}>{stateLabel(selected.status)}</span>
                  {selected.status === 'Assinado' && <small>Documento bloqueado. Para outra alteração, crie um novo adendo.</small>}</div>
                <div>
                  {selected.status !== 'Assinado' && <button className="btn btn-quiet" disabled={busy} onClick={()=>void beginEdit(selected)}><PenLine size={15}/> Editar completo</button>}
                  <button className="btn btn-quiet" onClick={()=>window.print()}><Printer size={15}/> PDF</button>
                  {selected.shareUrl && <button className="btn btn-quiet" onClick={()=>void copy(selected)}><Copy size={15}/> Copiar link</button>}
                  {selected.status !== 'Assinado' && <button className="btn btn-quiet" disabled={busy} onClick={()=>void whatsapp(selected)}><Send size={15}/> WhatsApp</button>}
                  {selected.status === 'Enviado' && <button className="btn btn-quiet" disabled={busy} onClick={()=>void sync(selected)}><Check size={15}/> Verificar</button>}
                  {selected.status === 'Assinado' && selected.signature?.verificationCode && <a className="btn btn-quiet" href={'/verificar/'+selected.signature.verificationCode} target="_blank" rel="noreferrer"><ShieldCheck size={15}/> Conferir</a>}
                  <button className="btn btn-primary" disabled={busy} onClick={()=>void open(selected)}><ArrowUpRight size={15}/>
                    {selected.status === 'Assinado' ? 'Abrir documento' : selected.shareUrl ? 'Abrir assinatura' : 'Gerar link e assinar'}</button>
                </div>
              </div>
              <AddendumDocument document={previewDocument} signature={selected.signature}/>
            </>}
          </main>
        </div>
      </div>
    </div>
  )
}
