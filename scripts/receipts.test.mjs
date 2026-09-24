import test from 'node:test'
import assert from 'node:assert/strict'
import { amountInWordsBR, createReceipt, nextReceiptNumber, activeReceiptForPayment, receiptMatchesPayment } from '../src/receipts.ts'

const event = {
 id:'event-123', contractNumber:'CTR-2026-003', clientName:'Cliente Exemplo', clientDocument:'12345678909',
 clientAddress:'São Paulo', clientEmail:'cliente@example.invalid', clientPhone:'11999999999',
 eventType:'Aniversário', eventDate:'2026-11-25', venue:'Buffet Akela'
}
const payment = { id:'pay-11', date:'2026-09-24',amount:600,method:'PIX', reference:'pix-test', notes:'Sinal' }
const business = {
 businessName:'Buffet Akela',legalName:'Empresa Teste', document:'11.111.111/0001-11',
 address:'Rua Exemplo', city:'São Paulo / SP', phone:'11988888888', email:'buffet@example.invalid'
}
const at = new Date('2026-09-24T16:30:00.000Z')

test('numeração sequencial considera cancelados e anos',() => {
 const rows=[{number:'REC-2026-0001'},{number:'REC-2025-0015'},{number:'REC-2026-0003'}]
 assert.equal(nextReceiptNumber(rows, at),'REC-2026-0004')
 assert.equal(nextReceiptNumber([], at),'REC-2026-0001')
})
test('recibo possui logo na visualização (integrada), valores e snapshots de cliente, evento e empresa',()=>{
 const receipt=createReceipt([],event,payment,business,'Pagamento de sinal do evento.',at)
 assert.equal(receipt.number,'REC-2026-0001')
 assert.equal(receipt.issuer.legalName,'Empresa Teste')
 assert.equal(receipt.payer.name,'Cliente Exemplo')
 assert.equal(receipt.payment.amount,600)
 assert.equal(receipt.payment.reference,'pix-test')
 assert.equal(receipt.event.contractNumber,'CTR-2026-003')
 assert.equal(receipt.description,'Pagamento de sinal do evento.')
 assert.equal(receipt.issuedAt,'2026-09-24T16:30:00.000Z')
 assert.ok(receipt.id)
 assert.equal(activeReceiptForPayment([receipt],event.id,payment.id)?.id,receipt.id)
 assert.equal(receiptMatchesPayment(receipt,payment),true)
 assert.equal(receiptMatchesPayment(receipt,{...payment,amount:700}),false)
 business.legalName='MUDADO DEPOIS'
 assert.equal(receipt.issuer.legalName,'Empresa Teste')
 assert.throws(()=>createReceipt([receipt],event,payment,business,'Outro',at),/já possui/)
 const cancelled={...receipt,status:'cancelled'}
 assert.notEqual(createReceipt([cancelled],event,payment,business,'Reemissão',at).id,receipt.id)
})
test('recibo só pode sair de pagamento confirmado',()=>{
 assert.throws(()=>createReceipt([],event,{...payment,date:''},business,'a',at),/data real/)
 assert.throws(()=>createReceipt([],event,{...payment,method:'A confirmar'},business,'a',at),/forma/)
 assert.throws(()=>createReceipt([],event,{...payment,amount:0},business,'a',at),/valor positivo/)
})
test('valor por extenso brasileiro',()=>{
 assert.equal(amountInWordsBR(600),'seiscentos reais')
 assert.equal(amountInWordsBR(12.50),'doze reais e cinquenta centavos')
 assert.equal(amountInWordsBR(0.01),'um centavo')
 assert.equal(amountInWordsBR(1000),'mil reais')
 assert.equal(amountInWordsBR(100),'cem reais')
})
