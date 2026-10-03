import type { PaymentReceipt } from './receipts'
import { money } from './utils'

export type ReceiptFileType = 'image' | 'pdf'

const safeName = (number: string) => number.replace(/[^a-z0-9_-]/gi, '-').slice(0, 64)

async function pngOfReceipt(node: HTMLElement): Promise<string> {
  const { toPng } = await import('html-to-image')
  // Renderize no formato de documento A4, mesmo quando a tela estiver em 320 px.
  // Usar clone fora da área visível evita alterar a prévia aberta pelo usuário.
  const host = document.createElement('div')
  host.className = 'receipt-export-host'
  const printable = node.cloneNode(true) as HTMLElement
  printable.classList.add('receipt-export-layout')
  host.appendChild(printable)
  document.body.appendChild(host)
  try {
    const logo = printable.querySelector<HTMLImageElement>('.receipt-brand img')
    if (logo && !logo.complete) await new Promise<void>((resolve) => {
      logo.addEventListener('load', () => resolve(), { once: true })
      logo.addEventListener('error', () => resolve(), { once: true })
      window.setTimeout(resolve, 1800)
    })
    return await toPng(printable, {
      pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true,
      filter: (element) => !(element instanceof HTMLElement && element.classList.contains('no-print')),
      style: { boxShadow: 'none', margin: '0', border: '0' }
    })
  } finally { host.remove() }
}

async function pdfFromPng(dataUrl: string, number: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 9
  const usableWidth = pageWidth - 2 * margin
  const maxSlicePx = Math.max(1, Math.floor((pageHeight - 2 * margin) / usableWidth * img.width))
  let top = 0
  let index = 0
  while (top < img.height) {
    const slice = Math.min(maxSlicePx, img.height - top)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = slice
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Seu navegador não conseguiu preparar o PDF.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, top, img.width, slice, 0, 0, img.width, slice)
    if (index > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG',
      margin, margin, usableWidth, slice / img.width * usableWidth)
    top += slice
    index += 1
  }
  pdf.setProperties({ title: 'Recibo ' + number, subject: 'Comprovante de recebimento Buffet Akela' })
  return pdf.output('blob')
}

export async function buildReceiptFile(
  receipt: PaymentReceipt, sheet: HTMLElement, type: ReceiptFileType
): Promise<File> {
  const image = await pngOfReceipt(sheet)
  const name = 'recibo-' + safeName(receipt.number)
  if (type === 'image') {
    const blob = await (await fetch(image)).blob()
    return new File([blob], name + '.png', { type: 'image/png' })
  }
  return new File([await pdfFromPng(image, receipt.number)], name + '.pdf', { type: 'application/pdf' })
}

export function downloadReceiptFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function receiptWhatsAppUrl(receipt: PaymentReceipt) {
  const phone = (receipt.payer.phone || '').replace(/\D/g, '')
  const number = phone ? (phone.startsWith('55') ? phone : '55' + phone) : ''
  const text = 'Olá, ' + receipt.payer.name + '! Segue o recibo ' + receipt.number +
    ' do ' + receipt.issuer.businessName + ', no valor de ' + money(receipt.payment.amount) +
    '. Estou encaminhando o comprovante em anexo.'
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(text)
}

export async function shareReceiptFile(file: File, receipt: PaymentReceipt):
  Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Recibo ' + receipt.number,
        text: 'Recibo do ' + receipt.issuer.businessName + '. Selecione o WhatsApp para enviar.' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Falha no compartilhamento nativo: disponibilizar o arquivo por download.
    }
  }
  downloadReceiptFile(file)
  return 'downloaded'
}
