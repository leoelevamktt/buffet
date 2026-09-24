// Sanitização do documento visual editável, preservando as classes do layout Akela.
const allowedTags = new Set([
  'ARTICLE','HEADER','FOOTER','SECTION','DIV','P','BR','STRONG','B','EM','I','U',
  'H1','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','SPAN','SMALL','TABLE',
  'THEAD','TBODY','TR','TH','TD','IMG','HR','S','A','FONT','SUP','SUB'
])
const allowedAlign = new Set(['left','center','right','justify'])
const allowedFont = /^(Georgia|Arial|Times New Roman|sans-serif|serif)(,\s*(serif|sans-serif))?$/i
const allowedColor = /^(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\))$/i
const imgAllowed = (src: string) =>
  (/^\/(?!\/)[a-z0-9/_-]+\.(png|jpg|jpeg|webp)$/i.test(src) ||
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(src) && src.length < 1_400_000)
const docParser = (html: string) =>
  new DOMParser().parseFromString('<main id="contract-html-root">' + html + '</main>', 'text/html')
export function sanitizeFullContractHtml(html: string): string {
  const doc = docParser(html.slice(0, 2_200_000))
  const root = doc.querySelector('#contract-html-root')!
  // Copiar apenas tags e atributos explicitamente seguros.
  const filter = (parent: Element) => {
    for (const node of Array.from(parent.children)) {
      if (!allowedTags.has(node.tagName)) {
        if (['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','SVG','MATH','NOSCRIPT'].includes(node.tagName)) {
          node.remove()
        } else {
          filter(node)
          const fragment = doc.createDocumentFragment()
          while (node.firstChild) fragment.appendChild(node.firstChild)
          node.replaceWith(fragment)
        }
        continue
      }
      const attrs = Array.from(node.attributes)
      const originalClass = node.getAttribute('class') || ''
      const originalStyle = (node as HTMLElement).style
      const style = {
        textAlign: originalStyle.textAlign,
        fontSize: originalStyle.fontSize,
        fontFamily: originalStyle.fontFamily,
        color: originalStyle.color,
        backgroundColor: originalStyle.backgroundColor,
        width: originalStyle.width
      }
      const imageSrc = node.getAttribute('src') || ''
      const alt = node.getAttribute('alt') || ''
      const bind = node.getAttribute('data-contract-bind') || ''
      const live = node.getAttribute('data-contract-live') || ''
      const signature = node.getAttribute('data-contract-signature-slot') || ''
      attrs.forEach((attr) => node.removeAttribute(attr.name))
      if (/^[a-z0-9_\-\s]{1,250}$/i.test(originalClass)) node.setAttribute('class', originalClass)
      if (/^[a-zA-Z0-9_-]{1,70}$/.test(bind)) node.setAttribute('data-contract-bind', bind)
      if (live === 'payments') node.setAttribute('data-contract-live', live)
      if (signature === '1') node.setAttribute('data-contract-signature-slot', signature)
      const s = (node as HTMLElement).style
      if (allowedAlign.has(style.textAlign)) s.textAlign = style.textAlign
      if (/^\d{1,2}(\.\d+)?(px|pt)$/.test(style.fontSize)) s.fontSize = style.fontSize
      if (allowedFont.test(style.fontFamily)) s.fontFamily = style.fontFamily
      if (allowedColor.test(style.color)) s.color = style.color
      if (allowedColor.test(style.backgroundColor)) s.backgroundColor = style.backgroundColor
      if (/^(\d{1,3}(px|%)|auto)$/.test(style.width)) s.width = style.width
      if (node.tagName === 'IMG') {
        if (!imgAllowed(imageSrc)) { node.remove(); continue }
        node.setAttribute('src', imageSrc)
        node.setAttribute('alt', alt.slice(0, 140))
      }
      filter(node)
    }
  }
  filter(root)
  return root.innerHTML
}
export function prepareFullContractEditorHtml(outerHtml: string): string {
  const doc = docParser(outerHtml)
  const article = doc.querySelector('.contract-document')
  if (!article) throw new Error('Prévia do contrato indisponível. Feche e abra novamente.')
  // Ao reabrir um contrato já personalizado, desembrulhar trechos anteriores.
  for (const fragment of Array.from(article.querySelectorAll('[data-full-contract-fragment]'))) {
    const children = doc.createDocumentFragment()
    while (fragment.firstChild) children.appendChild(fragment.firstChild)
    fragment.replaceWith(children)
  }
  article.querySelectorAll('.audit-evidence').forEach((node) => node.remove())
  const signature = article.querySelector('.doc-signatures')
  if (!signature) throw new Error('Bloco de assinaturas ausente da prévia.')
  const slot = doc.createElement('div')
  slot.className = 'contract-signature-slot'
  slot.setAttribute('data-contract-signature-slot', '1')
  slot.innerHTML = '<strong>Assinaturas e evidências</strong><p>Bloco automático protegido. Será preenchido na assinatura do cliente.</p>'
  signature.replaceWith(slot)
  article.querySelectorAll('[data-contract-live="payments"]').forEach((node) => {
    node.setAttribute('contenteditable', 'false')
  })
  slot.setAttribute('contenteditable', 'false')
  return sanitizeFullContractHtml(article.innerHTML)
}
export function hydrateFullContractHtml(
  saved: string,
  fields: Record<string, string>,
  paymentsHtml: string
): { before: string; after: string } {
  const doc = docParser(sanitizeFullContractHtml(saved))
  const root = doc.querySelector('#contract-html-root')!
  for (const node of Array.from(root.querySelectorAll('[data-contract-bind]'))) {
    const key = node.getAttribute('data-contract-bind') || ''
    const current = fields[key]
    if (current !== undefined && node.textContent !== current) node.textContent = current
  }
  const payments = root.querySelector('[data-contract-live="payments"]')
  if (payments) {
    const generated = docParser(paymentsHtml).querySelector('.doc-payment-details')
    if (generated) payments.replaceWith(generated)
  }
  const slot = root.querySelector('[data-contract-signature-slot="1"]')
  if (!slot) throw new Error('Seção obrigatória de assinaturas não encontrada.')
  const marker = '___AKELA_SIGNATURE_INSERT_9BF238___'
  slot.replaceWith(doc.createTextNode(marker))
  const full = root.innerHTML
  const parts = full.split(marker)
  return { before: parts[0], after: parts.slice(1).join(marker) }
}
export function validateFullContractHtml(html: string) {
  const doc = docParser(sanitizeFullContractHtml(html))
  const root = doc.querySelector('#contract-html-root')!
  if (!root.querySelector('[data-contract-signature-slot="1"]'))
    return 'A posição das assinaturas foi removida. Restaure o modelo antes de salvar.'
  if (!root.querySelector('[data-contract-live="payments"]'))
    return 'O histórico financeiro automático foi removido. Restaure o modelo antes de salvar.'
  if (!root.querySelector('.doc-akela-header'))
    return 'O cabeçalho foi removido. Restaure o modelo antes de salvar.'
  if (!root.querySelector('.doc-financial'))
    return 'O resumo financeiro foi removido. Restaure o modelo antes de salvar.'
  return ''
}
