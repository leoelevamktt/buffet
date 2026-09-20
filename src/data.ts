import type { BuffetEvent, BusinessSettings, MenuItem, ServiceItem } from './types'

export const defaultMenus: MenuItem[] = [
  {
    id: 'menu-classico',
    name: 'Clássico Essencial',
    description: 'Uma seleção acolhedora para celebrações sociais e encontros familiares.',
    pricePerPerson: 78,
    category: 'Clássico',
    items: ['Mesa de antepastos', '2 opções de salada', 'Arroz especial', 'Massa artesanal', '1 proteína', 'Sobremesa da casa']
  },
  {
    id: 'menu-celebracao',
    name: 'Celebração',
    description: 'Cardápio completo para casamentos, aniversários e eventos com serviço prolongado.',
    pricePerPerson: 118,
    category: 'Premium',
    items: ['Welcome bites', 'Mesa de antepastos premium', '3 saladas', '2 acompanhamentos', '2 proteínas', 'Massa', '2 sobremesas']
  },
  {
    id: 'menu-signature',
    name: 'Maison Signature',
    description: 'Experiência gastronômica refinada, pensada para eventos de maior exigência.',
    pricePerPerson: 168,
    category: 'Signature',
    items: ['Canapés volantes', 'Ilha gastronômica', 'Entrée', '2 proteínas nobres', 'Risoto', 'Sobremesas autorais', 'Café e petit fours']
  },
  {
    id: 'menu-coquetel',
    name: 'Coquetel Social',
    description: 'Formato leve e dinâmico para recepções, inaugurações e confraternizações.',
    pricePerPerson: 92,
    category: 'Coquetel',
    items: ['8 opções de salgados finos', '4 canapés', 'Mini empratados', 'Doces finos', 'Bebidas não alcoólicas']
  }
]

export const defaultServices: ServiceItem[] = [
  { id: 'service-staff', name: 'Equipe de salão', description: 'Garçons e coordenação durante o evento.', price: 950, pricing: 'fixed' },
  { id: 'service-decor', name: 'Montagem de mesa', description: 'Louças, talheres, guardanapos e composição de mesa.', price: 18, pricing: 'person' },
  { id: 'service-drinks', name: 'Bebidas não alcoólicas', description: 'Água, refrigerante e sucos durante o serviço.', price: 22, pricing: 'person' },
  { id: 'service-coffee', name: 'Estação de café', description: 'Café, chá e petit fours na finalização.', price: 420, pricing: 'fixed' },
  { id: 'service-logistics', name: 'Logística e montagem', description: 'Transporte, carga, descarga e organização operacional.', price: 680, pricing: 'fixed' }
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
    clientName: 'Mariana & Lucas',
    clientDocument: '123.456.789-00',
    clientEmail: 'mariana@email.com',
    clientPhone: '51999999999',
    eventType: 'Casamento',
    eventDate: addDays(18),
    startTime: '18:30',
    endTime: '23:30',
    venue: 'Casa Jardim',
    guests: 120,
    menuId: 'menu-celebracao',
    serviceIds: ['service-staff', 'service-decor', 'service-drinks'],
    notes: 'Mesa principal sem frutos do mar.',
    discount: 800,
    deposit: 3500,
    status: 'Confirmado',
    contractStatus: 'Enviado',
    createdAt: new Date().toISOString()
  },
  {
    id: 'event-demo-2',
    contractNumber: 'CTR-2026-002',
    clientName: 'Grupo Altiva',
    clientDocument: '12.345.678/0001-90',
    clientEmail: 'eventos@altiva.com.br',
    clientPhone: '51988888888',
    eventType: 'Corporativo',
    eventDate: addDays(34),
    startTime: '19:00',
    endTime: '22:30',
    venue: 'Espaço Horizonte',
    guests: 85,
    menuId: 'menu-coquetel',
    serviceIds: ['service-staff', 'service-coffee'],
    notes: '',
    discount: 0,
    deposit: 2000,
    status: 'Proposta',
    contractStatus: 'Rascunho',
    createdAt: new Date().toISOString()
  }
]

export const defaultSettings: BusinessSettings = {
  businessName: 'Maison Buffet',
  legalName: 'Maison Gastronomia e Eventos Ltda.',
  document: '00.000.000/0001-00',
  phone: '(51) 99999-0000',
  email: 'contato@maisonbuffet.com.br',
  address: 'Rua das Celebrações, 120',
  city: 'Porto Alegre / RS',
  paymentTerms: 'Reserva mediante sinal de 30%. Saldo restante até 7 dias antes do evento.',
  cancellationTerms: 'Cancelamentos devem ser formalizados por escrito. Valores e retenções seguem o prazo previsto na proposta comercial.'
}
