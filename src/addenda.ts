import type { BuffetEvent, BusinessSettings, ContractAddendum } from './types'
import { uid } from './storage'

const allowed = new Set([
  'DIV','P','BR','STRONG','B','EM','I','U','S','H1','H2','H3','H4',
  'UL','OL','LI','BLOCKQUOTE','SPAN','SMALL','TABLE','THEAD','TBODY','TR','TH','TD','HR'
])
const alignments = new Set(['left','center','right','justify'])
const parser = (html: string) => new DOMParser().parseFromString('<main id="addendum-root">' + html + '</main>', 'text/html')

export function sanitizeAddendumHtml(html: string): string {
  const doc = parser(String(html || '').slice(0, 600_000))
  const root = doc.querySelector('#addendum-root')!
  const filter = (parent: Element) => {
    for (const node of Array.from(parent.children)) {
      if (!allowed.has(node.tagName)) {
        if (['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG','MATH','META','LINK'].includes(node.tagName)) {
          node.remove()
        } else {
          filter(node)
          const fragment = doc.createDocumentFragment()
          while (node.firstChild) fragment.appendChild(node.firstChild)
          node.replaceWith(fragment)
        }
        continue
      }
      const textAlign = (node as HTMLElement).style.textAlign
      const fontWeight = (node as HTMLElement).style.fontWeight
      const fontStyle = (node as HTMLElement).style.fontStyle
      Array.from(node.attributes).forEach((attribute) => node.removeAttribute(attribute.name))
      const style = (node as HTMLElement).style
      if (alignments.has(textAlign)) style.textAlign = textAlign
      if (['bold','700'].includes(fontWeight)) style.fontWeight = '700'
      if (fontStyle === 'italic') style.fontStyle = 'italic'
      filter(node)
    }
  }
  filter(root)
  return root.innerHTML
}

const escapeHtml = (value?: string) => String(value || '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#039;')

export function nextAddendumNumber(event: BuffetEvent): string {
  const count = (event.addenda || []).length + 1
  return event.contractNumber + '-AD' + String(count).padStart(2, '0')
}

export function defaultAddendumHtml(event: BuffetEvent, settings: BusinessSettings, number: string): string {
  const originalSignedAt = event.signature?.signedAt
    ? new Date(event.signature.signedAt).toLocaleDateString('pt-BR')
    : 'data registrada no contrato original'
  return [
    '<h1>ADENDO CONTRATUAL ' + escapeHtml(number) + '</h1>',
    '<p>Adendo ao contrato <strong>' + escapeHtml(event.contractNumber) + '</strong>, originalmente firmado em <strong>' +
      escapeHtml(originalSignedAt) + '</strong>, entre <strong>' + escapeHtml(settings.legalName || settings.businessName) +
      '</strong> e <strong>' + escapeHtml(event.clientName) + '</strong>.</p>',
    '<h2>Objeto do adendo</h2>',
    '<p>As partes, de comum acordo, resolvem alterar e/ou complementar o contrato original nos termos descritos abaixo.</p>',
    '<h2>Alterações acordadas</h2>',
    '<p><strong>Edite este trecho livremente.</strong> Descreva quais dados, valores, datas, serviços, cláusulas ou demais condições do contrato original ficam alterados por este adendo.</p>',
    '<h3>1. Alteração</h3>',
    '<p>Informe aqui a redação que substitui ou complementa o contrato original.</p>',
    '<h3>2. Vigência</h3>',
    '<p>As alterações previstas neste adendo passam a integrar o contrato original a partir da assinatura deste documento.</p>',
    '<h3>3. Ratificação</h3>',
    '<p>As demais condições do contrato original que não forem expressamente alteradas por este adendo permanecem ratificadas.</p>',
    '<p>Por estarem de acordo, as partes assinam eletronicamente o presente adendo.</p>'
  ].join('')
}

export function newAddendum(event: BuffetEvent, settings: BusinessSettings): ContractAddendum {
  const now = new Date().toISOString()
  const number = nextAddendumNumber(event)
  return {
    id: uid('addendum'),
    number,
    title: 'Adendo contratual ' + number,
    html: defaultAddendumHtml(event, settings, number),
    status: 'Rascunho',
    createdAt: now,
    updatedAt: now,
    originalContractNumber: event.contractNumber,
    originalContractToken: event.shareToken,
    originalDocumentHash: event.signature?.documentHash,
    originalVerificationCode: event.signature?.verificationCode
  }
}
