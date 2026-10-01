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
  const signedAt = event.signature?.signedAt
    ? new Date(event.signature.signedAt).toLocaleDateString('pt-BR')
    : 'data registrada no contrato original'
  const eventDate = event.eventDate
    ? new Date(event.eventDate + 'T12:00:00').toLocaleDateString('pt-BR')
    : 'não informada'
  const venue = [event.venue, event.venueAddress].filter(Boolean).join(' — ') || 'não informado'
  const phones = [event.clientPhone, event.clientPhoneSecondary].filter(Boolean).join(' / ') || 'não informado'
  const party = escapeHtml(settings.legalName || settings.businessName)
  const partyDocument = escapeHtml(settings.document || '')
  const client = escapeHtml(event.clientName)
  const clientDocument = escapeHtml(event.clientDocument || '')
  return [
    '<h1>' + escapeHtml(number) + ' — ADENDO CONTRATUAL</h1>',
    '<p><strong>Instrumento complementar ao contrato ' + escapeHtml(event.contractNumber) + '</strong>, originalmente firmado em <strong>' +
      escapeHtml(signedAt) + '</strong>.</p>',

    '<h2>1. Identificação das partes e do contrato original</h2>',
    '<table><tbody>',
    '<tr><th>CONTRATADA</th><td><strong>' + party + '</strong>' + (partyDocument ? '<br>Documento: ' + partyDocument : '') + '</td></tr>',
    '<tr><th>CONTRATANTE</th><td><strong>' + client + '</strong>' + (clientDocument ? '<br>CPF/CNPJ: ' + clientDocument : '') +
      (event.clientEmail ? '<br>E-mail: ' + escapeHtml(event.clientEmail) : '') +
      '<br>Telefone(s): ' + escapeHtml(phones) + '</td></tr>',
    '<tr><th>CONTRATO ORIGINAL</th><td>' + escapeHtml(event.contractNumber) + '</td></tr>',
    '<tr><th>EVENTO</th><td>' + escapeHtml(event.eventType) + ' · ' + escapeHtml(eventDate) + ' · ' + escapeHtml(event.startTime || '') +
      (event.endTime ? ' às ' + escapeHtml(event.endTime) : '') + '</td></tr>',
    '<tr><th>LOCAL</th><td>' + escapeHtml(venue) + '</td></tr>',
    '</tbody></table>',

    '<h2>2. Finalidade deste adendo</h2>',
    '<p>As partes resolvem, de comum acordo, alterar e/ou complementar condições específicas do contrato original. Este adendo integra o contrato a partir de sua assinatura, sem substituir o documento original.</p>',

    '<h2>3. Quadro das alterações acordadas</h2>',
    '<p>Preencha somente os itens que realmente serão modificados. Exclua as linhas que não se aplicarem.</p>',
    '<table><thead><tr><th>Item / cláusula</th><th>Condição anterior</th><th>Nova condição</th><th>Observações</th></tr></thead><tbody>',
    '<tr><td>Data / horário</td><td>' + escapeHtml(eventDate + ' · ' + (event.startTime || '')) + '</td><td>Preencher se houver alteração</td><td>—</td></tr>',
    '<tr><td>Número de convidados</td><td>' + escapeHtml(String(event.guests || '')) + '</td><td>Preencher se houver alteração</td><td>—</td></tr>',
    '<tr><td>Local do evento</td><td>' + escapeHtml(venue) + '</td><td>Preencher se houver alteração</td><td>—</td></tr>',
    '<tr><td>Cardápio / serviços</td><td>Conforme contrato original</td><td>Descrever inclusões, exclusões ou substituições</td><td>—</td></tr>',
    '<tr><td>Valores / pagamentos</td><td>Conforme contrato original</td><td>Informar novo valor, acréscimo, desconto ou condição</td><td>—</td></tr>',
    '<tr><td>Cláusulas adicionais</td><td>Conforme contrato original</td><td>Inserir a nova redação completa</td><td>—</td></tr>',
    '</tbody></table>',

    '<h2>4. Descrição detalhada das alterações</h2>',
    '<h3>4.1. Alteração principal</h3>',
    '<p><strong>Substitua este texto pela redação exata que deverá passar a valer.</strong> Informe com clareza o que muda, a partir de quando e, se necessário, qual trecho do contrato original está sendo substituído.</p>',
    '<h3>4.2. Serviços, produtos ou entregas afetados</h3>',
    '<p>Descreva itens incluídos, retirados, substituídos ou mantidos, com quantidades, especificações e responsabilidades quando aplicável.</p>',
    '<h3>4.3. Efeitos financeiros</h3>',
    '<p>Informe se haverá acréscimo, redução, novo vencimento, forma de pagamento, parcelamento, saldo remanescente ou ausência de impacto financeiro.</p>',

    '<h2>5. Vigência e execução</h2>',
    '<p>As condições previstas neste adendo passam a produzir efeitos após a assinatura das partes, salvo se houver data específica indicada no próprio texto das alterações.</p>',

    '<h2>6. Prevalência das alterações</h2>',
    '<p>Em caso de divergência entre este adendo e o contrato original, prevalecem exclusivamente as disposições deste adendo quanto aos pontos expressamente modificados.</p>',

    '<h2>7. Ratificação do contrato original</h2>',
    '<p>Permanecem ratificadas e em pleno vigor todas as cláusulas, condições, obrigações e responsabilidades do contrato original que não tenham sido expressamente alteradas neste adendo.</p>',

    '<h2>8. Integralidade e vinculação</h2>',
    '<p>Este adendo passa a integrar o contrato ' + escapeHtml(event.contractNumber) + ' para todos os fins relacionados às alterações aqui descritas e deve ser interpretado em conjunto com o documento original.</p>',

    '<h2>9. Declaração de concordância</h2>',
    '<p>As partes declaram que tiveram acesso ao conteúdo deste adendo, compreenderam as alterações nele registradas e manifestam concordância com a nova redação por meio de assinatura eletrônica.</p>',

    '<p><strong>Observação para edição:</strong> antes do envio para assinatura, revise e personalize todos os trechos aplicáveis. Remova instruções internas e itens que não fizerem parte do acordo.</p>'
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
