import type { BuffetEvent, BusinessSettings, MenuItem, ServiceItem } from './types'

const commonIncluded = [
  'Decoração temática (consultar opções no buffet)',
  'Convite digital',
  'Garçons',
  'Monitores',
  'Gerente de evento',
  'Copeira',
  'Recepcionista',
  'Vela numérica para o parabéns',
  'Kit mamãe',
  'Retrospectiva com 60 fotos — elaboração e projeção',
  'Salão com ecobriza e ventiladores'
]

export const defaultMenus: MenuItem[] = [
  {
    id: 'menu-akela-infinity-2027',
    name: 'Infinity Akela 2027',
    description: 'Cardápio completo com entradas, lanches, prato principal à escolha, salgados, bolo, doces, bebidas e café.',
    pricePerPerson: 0,
    category: 'Infinity · 2027',
    active: true,
    sourceLabel: 'CARDAPIO INFINITY AKELA 2027.docx',
    contractTemplateId: 'akela-services-2027',
    items: ['Entradas e lanches', 'Prato principal — 1 opção', 'Salgados sortidos', 'Bolo com sorvete', 'Doces', 'Bebidas', 'Café'],
    sections: [
      { title: '1ª hora · Entradas', items: ['Mini pastéis sortidos', 'Mini pizza', 'Batata frita', 'Pão de queijo', 'Barqueta com maionese e caponata de berinjela', 'Pipoca'] },
      { title: 'Lanches', items: ['Lanche de metro', 'Lanche natural', 'Mini hot dog', 'Mini buraco quente'] },
      { title: '2ª hora · Prato principal', items: ['Escolher 1 opção entre as alternativas cadastradas no evento'] },
      { title: 'Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Risoles de presunto e queijo', 'Salsicha e kibe', 'Enroladinho de salsicha', 'Esfihas de carne, frango e calabresa', 'Mini quiche de alho-poró', 'Margarida'] },
      { title: 'Finalização', items: ['Retrospectiva e parabéns faltando 1h30 para o término', 'Bolo exclusivo para corte com sorvete', 'Doces conforme opção escolhida'] },
      { title: 'Bebidas', items: ['Suco natural de fruta', 'Refrigerantes selecionados', 'Água com e sem gás', 'Opções zero/diet'] },
      { title: 'Encerramento', items: ['Mesa com café simples', 'Água saborizada'] }
    ],
    choiceGroups: [
      { id: 'main-course', label: 'Prato principal', required: true, options: ['Strogonoff de frango, batata palha, arroz e salada', 'Strogonoff de carne, batata palha, arroz e salada', 'Fricassê com arroz, saladas e massa', 'Escondidinho de carne moída com arroz, saladas e massas', 'Coxa e sobrecoxa assada com arroz, salada de maionese de batata e saladas variadas', 'Panqueca de carne e frango com arroz e saladas'] },
      { id: 'dessert', label: 'Doces', options: ['Bar de brigadeiro branco e preto + cascata de chocolate ao leite com uva', 'Brigadeiro, beijinho, doce de leite ninho, bicho de pé e brigadeiro de milho'] },
      { id: 'dietary', label: 'Perfil alimentar', options: ['Sem necessidade especial', 'Vegano', 'Vegetariano', 'Vegano e vegetariano'] }
    ],
    includedServices: [...commonIncluded, 'Pintura nas crianças', 'Gincana', 'Porta-guardanapo', 'Arco de balões na mesa em cores primárias — orgânico, desconstruído ou tradicional'],
    includedNotes: ['Doces personalizados da mesa de decoração não estão incluídos automaticamente.']
  },
  {
    id: 'menu-akela-prata-2027',
    name: 'Prata 2027',
    description: 'Entradas e lanches, festival de massa com escolha de massa e molho, salgados, bolo, doces, bebidas e café.',
    pricePerPerson: 0,
    category: 'Prata · 2027',
    active: true,
    sourceLabel: 'CARDAPIO Prata 2027.docx',
    contractTemplateId: 'akela-services-2027',
    items: ['Entradas', 'Lanches', 'Massa e molho à escolha', 'Salgados e assados', 'Bolo com sorvete', 'Doces', 'Bebidas', 'Café'],
    sections: [
      { title: '1ª hora · Entradas', items: ['Mini pastel', 'Mini pizza', 'Batata frita', 'Pão de queijo', 'Pipoca'] },
      { title: 'Lanches', items: ['Mini hot dog', 'Mini lanche natural', 'Lanche de metro', 'Buraco quente'] },
      { title: '2ª hora · Prato principal', items: ['Massa e molho escolhidos para o evento'] },
      { title: 'Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Salsicha', 'Kibe', 'Risoles de presunto e queijo'] },
      { title: 'Assados', items: ['Mini bauru', 'Esfiha de carne, frango e calabresa', 'Mini quiche de alho-poró', 'Calabresa', 'Margarida'] },
      { title: 'Finalização', items: ['Bolo exclusivo para corte com sorvete', 'Doces conforme opção escolhida'] },
      { title: 'Bebidas e encerramento', items: ['Suco natural de fruta', 'Refrigerantes selecionados', 'Água com e sem gás', 'Opções zero/diet', 'Café', 'Água saborizada'] }
    ],
    choiceGroups: [
      { id: 'pasta', label: 'Massa', required: true, options: ['Penne', 'Spaguete', 'Farfalle', 'Fusilli'] },
      { id: 'sauce', label: 'Molho', required: true, options: ['Sugo', 'Bolonhesa', 'Parisiense', 'Calabresa', 'Tostano', 'Branco'] },
      { id: 'dessert', label: 'Doces', options: ['Bar de brigadeiro branco e preto com confetes diversos', 'Brigadeiro, beijinho, doce de leite ninho, bicho de pé e brigadeiro de milho'] },
      { id: 'dietary', label: 'Perfil alimentar', options: ['Sem necessidade especial', 'Vegano', 'Vegetariano', 'Vegano e vegetariano'] }
    ],
    includedServices: [...commonIncluded, 'Pintura nas crianças', 'Gincana', 'Centro de mesa simples padrão do buffet', 'Porta-guardanapo', 'Som ambiente', 'Arco de balões na mesa em cores primárias — orgânico, desconstruído ou tradicional'],
    includedNotes: ['Doces personalizados da mesa de decoração não estão incluídos automaticamente.']
  },
  {
    id: 'menu-akela-bronze',
    name: 'Bronze',
    description: 'Cardápio da Unidade II com canapés, lanche de metro, salgados fritos na hora, festival de massas, bebidas e bar de brigadeiro.',
    pricePerPerson: 0,
    category: 'Bronze · Unidade II',
    active: true,
    sourceLabel: 'CARDAPIO Bronze.docx',
    unitRestriction: 'Somente Unidade II',
    contractTemplateId: 'akela-bronze-unit2',
    items: ['Canapés', 'Lanche de metro', 'Salgados fritos na hora', 'Festival de massa', 'Bebidas', 'Bar de brigadeiro', 'Bolo com sorvete'],
    sections: [
      { title: 'Entrada', items: ['Canapés', 'Brasileirinho: arancini', 'Mini pastéis com molho barbecue'] },
      { title: 'Lanchonete', items: ['Lanche de metro'] },
      { title: 'Salgados sortidos fritos na hora', items: ['Coxinha', 'Bolinho de queijo', 'Carne', 'Calabresa', 'Risoles de presunto e queijo', 'Enroladinho de salsicha', 'Kibe', 'Mini esfihas', 'Mini quiches', 'Mini assado de salsicha', 'Mini bauru', 'Mini empada'] },
      { title: 'Festival de massa', items: ['Penne', 'Fusilini', 'Molho bolonhesa', 'Molho Melchior', 'Saladas'] },
      { title: 'Durante todo o evento', items: ['Água com e sem gás', 'Suco natural de fruta', 'Coca-Cola', 'Guaraná'] },
      { title: 'Encerramento', items: ['Doces — bar de brigadeiro', 'Bolo com sorvete'] }
    ],
    includedServices: [...commonIncluded, 'Pintura nas crianças', 'Gincana', 'Porta-guardanapo', 'Som ambiente', 'Arco de balões na mesa em cores primárias — orgânico, desconstruído ou tradicional'],
    includedNotes: ['O material Bronze indica como não inclusos automaticamente: enfeites de mesa dos convidados, doces personalizados, bolo, lembrancinhas, cerveja, vinho e taças.']
  },
  {
    id: 'menu-akela-churrasco-2027',
    name: 'Churrasco 2027',
    description: 'Cardápio de churrasco exclusivo da Unidade II, com entradas, carnes, acompanhamentos, salgados, bolo, doces e bebidas.',
    pricePerPerson: 0,
    category: 'Churrasco · 2027',
    active: true,
    sourceLabel: 'cardapio cchurrasco.docx',
    unitRestriction: 'Somente Unidade II',
    contractTemplateId: 'akela-services-2027',
    items: ['Canapés e mini pastel', 'Churrasco', 'Acompanhamentos', 'Salgados', 'Bolo e sorvete', 'Bar de brigadeiro', 'Bebidas', 'Café e chá'],
    sections: [
      { title: '1ª hora · Entradas', items: ['Canapés simples', 'Mini pastel'] },
      { title: 'Lanches', items: ['Lanche de metro', 'Lanche natural'] },
      { title: '2ª hora · Almoço ou jantar', items: ['Carne bovina', 'Frango', 'Linguiça', 'Arroz', 'Farofa', 'Maionese de batata com ovo', 'Salada de macarrão', 'Mix de folhas com tomate'] },
      { title: 'Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Risoles de presunto e queijo', 'Salsicha e kibe', 'Enroladinho de salsicha', 'Esfihas de carne, frango e calabresa', 'Mini quiche de alho-poró', 'Margarida', 'Mini pão de queijo'] },
      { title: 'Finalização', items: ['Retrospectiva e parabéns faltando 1h30 para o término', 'Bolo exclusivo para corte com sorvete', 'Bar de brigadeiro com massas preta e branca', 'Cascata de chocolate ao leite com uva e merengue'] },
      { title: 'Bebidas e encerramento', items: ['Suco natural de fruta', 'Refrigerantes selecionados', 'Água com e sem gás', 'Opções zero/diet', 'Mesa com café e chá simples', 'Água saborizada'] }
    ],
    choiceGroups: [
      { id: 'dietary', label: 'Perfil alimentar', options: ['Sem necessidade especial', 'Vegano', 'Vegetariano', 'Vegano e vegetariano'] }
    ],
    includedServices: [...commonIncluded, 'Pintura nas crianças', 'Gincana', 'Centro de mesa simples padrão do buffet', 'Porta-guardanapo', 'Som ambiente', 'Arco de balões na mesa em cores primárias — orgânico, desconstruído ou tradicional'],
    includedNotes: ['Doces personalizados da mesa de decoração não estão incluídos automaticamente.']
  },
  {
    id: 'menu-akela-boteco-2027',
    name: 'Boteco 2027',
    description: 'Formato boteco com entradas, salgados, assados e porções, bolo, bar de brigadeiro, bebidas e café.',
    pricePerPerson: 0,
    category: 'Boteco · 2027',
    active: true,
    sourceLabel: 'boteco 2027.docx',
    contractTemplateId: 'akela-services-2027',
    items: ['Entradas de boteco', 'Salgados e assados', 'Porções', 'Escondidinho de calabresa', 'Bolo com sorvete', 'Bar de brigadeiro', 'Bebidas', 'Café'],
    sections: [
      { title: '1ª hora · Entradas', items: ['Mini pastel', 'Batata em conserva', 'Espetinho de conserva', 'Dadinho de tapioca', 'Polentinha frita com molho barbecue'] },
      { title: '2ª hora · Salgados e assados', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Salsicha', 'Kibe', 'Risoles de presunto e queijo', 'Mini bauru', 'Esfiha de carne, frango e calabresa', 'Mini quiche de alho-poró', 'Margarida'] },
      { title: 'Porções', items: ['Batata frita', 'Calabresa', 'Aipim', 'Anéis de cebola', 'Escondidinho de calabresa'] },
      { title: 'Finalização', items: ['Bolo exclusivo para corte com sorvete', 'Bar de brigadeiro branco e preto com confetes diversos', 'Cascata de chocolate com uva'] },
      { title: 'Bebidas e encerramento', items: ['Suco natural de fruta', 'Refrigerantes selecionados', 'Água com e sem gás', 'Opções zero/diet', 'Café', 'Água saborizada'] }
    ],
    choiceGroups: [
      { id: 'dietary', label: 'Perfil alimentar', options: ['Sem necessidade especial', 'Vegano', 'Vegetariano', 'Vegano e vegetariano'] }
    ],
    includedServices: [...commonIncluded, 'Porta-guardanapo'],
    includedNotes: []
  }
]

export const defaultServices: ServiceItem[] = [
  { id: 'service-extra-decoration', name: 'Decoração / personalizados extras', description: 'Itens de decoração ou personalizados fora do pacote do cardápio.', price: 0, pricing: 'fixed' },
  { id: 'service-third-party', name: 'Serviço de terceiro', description: 'Foto, filmagem, DJ, show, retrospectiva ou outro fornecedor contratado separadamente.', price: 0, pricing: 'fixed' },
  { id: 'service-extra-guests', name: 'Convidados excedentes', description: 'Valor adicional por pessoa conforme o modelo de contrato selecionado.', price: 110, pricing: 'person' },
  { id: 'service-rental-extra-time', name: 'Hora adicional / excedente', description: 'Tempo excedente sujeito às regras do contrato selecionado.', price: 0, pricing: 'fixed' }
]

const today = new Date()
const addDays = (days: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const defaultEvents: BuffetEvent[] = [
  {
    id: 'event-demo-1',
    contractNumber: 'CTR-2026-001',
    clientName: 'Mariana Silva',
    clientDocument: '123.456.789-00',
    clientRg: '',
    clientAddress: '',
    clientEmail: 'mariana@email.com',
    clientPhone: '11999999999',
    eventType: 'Aniversário',
    eventDate: addDays(18),
    startTime: '18:30',
    endTime: '23:30',
    venue: 'Buffet Akela',
    guests: 80,
    celebrantName: 'Lívia',
    celebrantAge: '8',
    theme: 'Jardim',
    menuId: 'menu-akela-infinity-2027',
    menuPricePerPerson: 110,
    menuSelections: { 'main-course': 'Strogonoff de frango, batata palha, arroz e salada', dessert: 'Bar de brigadeiro branco e preto + cascata de chocolate ao leite com uva', dietary: 'Sem necessidade especial' },
    contractTemplateId: 'akela-services-2027',
    serviceIds: [],
    notes: '',
    discount: 0,
    deposit: 3000,
    status: 'Confirmado',
    contractStatus: 'Enviado',
    createdAt: new Date().toISOString()
  }
]

export const defaultSettings: BusinessSettings = {
  businessName: 'Buffet Akela',
  legalName: 'BUFFET AKELA',
  document: '19.386.779.0001/53',
  phone: '11 96890-0572',
  email: 'retroakela@gmail.com',
  financeEmail: 'retroakela@gmail.com',
  address: 'Rua Canto do Mangue, 5 · Jardim Marisa',
  city: 'São Paulo / SP',
  website: 'www.buffetakela.com.br',
  instagram: '@buffetakelaoficial',
  paymentTerms: 'Pagamento conforme condições registradas no contrato. Cheques devem ser compensados até 10 dias antes do evento; comprovantes de depósito ou PIX devem ser encaminhados ao financeiro.',
  cancellationTerms: 'As regras de cancelamento são definidas pelo modelo de contrato selecionado para o evento.'
}
