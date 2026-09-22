import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const originals = [
  'cardapio-infinity-akela-2027.docx',
  'cardapio-prata-2027.docx',
  'cardapio-bronze.docx',
  'cardapio-churrasco-2027.docx',
  'cardapio-boteco-2027.docx',
  'contrato-locacao-espaco-2027.docx'
]

const manifest = {}
for (const file of originals) {
  const full = path.join(root, 'materials', 'originals', file)
  if (!fs.existsSync(full)) throw new Error('Material original ausente: ' + file)
  const bytes = fs.readFileSync(full)
  manifest[file] = {
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex')
  }
}

const data = fs.readFileSync(path.join(root, 'src', 'data.ts'), 'utf8')
const materials = fs.readFileSync(path.join(root, 'src', 'materials.ts'), 'utf8')
const sources = fs.readFileSync(path.join(root, 'src', 'sourceMaterials.ts'), 'utf8')
const app = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8')
const all = data + '\n' + materials + '\n' + sources + '\n' + app

const checks = [
  ['Infinity: barqueta/caponata', 'Barqueta com maionese e caponata'],
  ['Infinity: seis pratos / panqueca', 'Panqueca Carne e frango'],
  ['Infinity/Prata: Kuat ou Fanta', 'Kuat ou Fanta'],
  ['Infinity: cascata com uva', 'Cascata de chocolate ao leite com uva'],
  ['Prata: Penne', 'Penne'],
  ['Prata: Spaguete', 'Spaguete'],
  ['Prata: Farfalle', 'Farfalle'],
  ['Prata: Fusilli', 'Fusilli'],
  ['Prata: Parisiense', 'Parisiense'],
  ['Prata: Tostano', 'Tostano'],
  ['Prata/Churrasco: centro de mesa', 'Centro de mesa simples padrão do buffet'],
  ['Bronze: Arancini', 'Arancini'],
  ['Bronze: molho Melchior', 'Molho Melchior'],
  ['Bronze: convidado excedente R$95', 'R$ 95,00'],
  ['Bronze/Locação: retenção 50%', '50% (cinquenta por cento)'],
  ['Bronze/Boteco: segundo Instagram', '@buffetakela2oficial'],
  ['Bronze/Boteco: WhatsApp de entrega', '11 91088 7094'],
  ['Bronze/Boteco: não recebemos no dia', 'NÃO RECEBEMOS NO DIA DA FESTA'],
  ['Bronze/Boteco: não insista', 'Não insista!'],
  ['Bronze/Boteco: Recredor', 'Recredor'],
  ['Churrasco: somente unidade II', 'SOMENTE UNIDADE II'],
  ['Churrasco: mix de folhas completo', 'alface, rúcula ou agrião e tomate'],
  ['Churrasco: merengue', 'merengue'],
  ['Boteco: escondidinho', 'Escondidinho de Calabresa'],
  ['Boteco: dados para PIX Buffet Akela', 'PIX: Buffet AKELA'],
  ['Contrato 30%: retenção', '30% (trinta por cento)'],
  ['Contrato 30%: excedente R$110', 'R$ 110,00'],
  ['Pagante: 6 anos e 12 meses', '6 anos e 12 meses'],
  ['Margem operacional: 15 pessoas', 'margem de até 15 pessoas'],
  ['Sem redução de convidados', 'não reduzimos o número de convidados'],
  ['Reagendamento sem ônus', 'reagendamento sem ônus'],
  ['Prazo de 12 meses', '12 meses após liberação'],
  ['Sem gerador', 'não disponibiliza o uso de geradores'],
  ['Limite de som 50 dB', '50 decibéis'],
  ['Autorização fotos/vídeos', 'Fotos e vídeos realizados durante o evento'],
  ['Cinco linhas de cheque', '5 linhas para Data, nº do cheque e Valor'],
  ['Financeiro Bronze/Locação', 'buffetakela@gmail.com'],
  ['Financeiro Infinity/Prata/Churrasco/Boteco', 'retroakela@gmail.com'],
  ['Locação: multa 10%', 'multa de 10%'],
  ['Locação: montagem/desmontagem', 'montagem e desmontagem'],
  ['Danos pelo valor de mercado', 'valor será o de mercado'],
  ['Objetos perdidos', 'objetos perdidos'],
  ['Acordos verbais', 'acordos verbais'],
  ['Terceiros', 'serviço prestado por terceiros'],
  ['Retrospectiva 15 dias', '15 DIAS ANTES DO EVENTO'],
  ['Cerveja somente lata', 'CERVEJA SOMENTE LATA'],
  ['Doces/personalizados/destilados 1 dia antes', 'Doces, personalizados e destilados'],
  ['Original Infinity transcrito', 'CARDAPIO INFINITY'],
  ['Original Prata transcrito', 'CARDÁPIO Prata'],
  ['Original Bronze transcrito', 'Itens NÃO INCLUSO nesse contrato'],
  ['Original Churrasco transcrito', 'CARDÁPIO CHURRASCO SOMENTE UNIDADE II'],
  ['Original Boteco transcrito', 'CARDÁPIO BOTECO'],
  ['Original Locação transcrito', 'Contrato de Prestação de Serviços Locação do espaço']
]

const missing = checks.filter(([, needle]) => !all.includes(needle))
if (missing.length) {
  console.error('AUDIT_FAIL')
  for (const [label, needle] of missing) console.error('-', label, '=>', needle)
  process.exit(1)
}

fs.writeFileSync(path.join(root, 'materials', 'manifest.json'), JSON.stringify({
  files: manifest,
  coverageChecks: checks.length
}, null, 2) + '\n')

console.log('AUDIT_PASS', checks.length, 'coverage checks')
for (const [file, info] of Object.entries(manifest)) console.log(file, info.bytes, info.sha256)
