import type { BuffetEvent, BusinessSettings, MenuItem, ServiceItem } from './types'

export const defaultMenus: MenuItem[] = [
  {
    id: 'menu-akela-infinity-2027',
    name: 'Infinity Akela 2027',
    description: 'Cardápio Infinity completo conforme o documento 2027.',
    pricePerPerson: 0,
    category: 'Infinity · 2027',
    active: true,
    sourceLabel: 'CARDAPIO INFINITY AKELA 2027.docx',
    contractTemplateId: 'akela-infinity-2027',
    cakeFieldLabel: 'Bolo (exclusivo para corte) com sorvete',
    items: ['Entradas', 'Lanches', 'Prato principal — escolher 01 opção', 'Salgados sortidos', 'Bolo com sorvete', 'Doces', 'Bebidas', 'Café e água saborizada'],
    sections: [
      { title: '1ª hora de festa · Entradas', items: ['Mini pastéis sortidos', 'Mini pizza', 'Batata frita', 'Pão de queijo', 'Barqueta com maionese e caponata de berinjela', 'Pipoca'] },
      { title: 'Lanches', items: ['Lanche de metro', 'Lanche Natural', 'Mini Hot Dog', 'Mini buraco quente'] },
      { title: '2ª hora de festa · Prato principal', items: ['Escolher 01 opção no evento'] },
      { title: 'Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Risoles presunto e queijo', 'Salsicha e Kibe', 'Enroladinho de salsicha', 'Esfihas de carne, frango, calabresa', 'Mini quiche de alho-poró', 'Margarida', 'Calabresa'] },
      { title: 'Faltando 1h30 para o término', items: ['Passaremos a retrospectiva e em seguida o parabéns'] },
      { title: '4ª hora de festa', items: ['Bolo exclusivo para corte com sorvete — descrição definida no evento', 'Doces conforme opção escolhida'] },
      { title: 'Bebidas durante todo o evento', items: ['Suco Natural de Fruta', 'Refrigerantes conforme seleção', 'Água com e sem gás', 'Zero e Dieth'] },
      { title: 'Encerramento', items: ['Mesa com Café simples', 'Água saborizada à disposição'] }
    ],
    choiceGroups: [
      {
        id: 'main-course',
        label: 'Prato principal — escolher 01 opção',
        required: true,
        options: [
          'Strogonoff de Frango, Batata palha, Arroz e Salada',
          'Strogonoff de carne, batata palha, arroz e salada',
          'Fricassê com arroz, saladas e massa',
          'Escondidinho de Carne Moída com arroz, saladas e massas',
          'Coxa e sobrecoxa assada com arroz, salada de maionese de batata, saladas variadas',
          'Panqueca Carne e frango com arroz e saladas'
        ]
      },
      {
        id: 'dessert',
        label: 'Doces — escolher uma opção',
        required: true,
        options: [
          'BAR DE BRIGADEIRO: Brigadeiro branco e preto, Cascata de chocolate ao leite com uva',
          'Brigadeiro, Beijinho, doce de leite ninho, Bicho de pé, Brigadeiro de milho'
        ]
      },
      {
        id: 'soft-drinks',
        label: 'Refrigerantes — marcar opções',
        multiple: true,
        options: ['Coca-Cola', 'Guaraná Antártica', 'Kuat ou Fanta', 'Fanta Laranja', 'Fanta Uva', 'Soda'],
        note: 'Suco Natural de Fruta e água com e sem gás constam como bebidas durante todo o evento.'
      },
      {
        id: 'dietary',
        label: 'Na festa teremos',
        multiple: true,
        options: ['Vegano', 'Vegetariano']
      }
    ],
    includedServices: [
      'Decoração Temática (consultar opções no Buffet)',
      'Convite simples Digital',
      'Pintura nas Crianças',
      'Gincana',
      'Porta guardanapo',
      'Garçons',
      'Monitores',
      'Gerente de evento',
      'Copeira',
      'Recepcionista',
      'Vela Numérica para o Parabéns',
      'Kit mamãe',
      'Retrospectiva com 60 fotos — elaboração e projeção',
      'Salão climatizado com ecobriza e Ventiladores',
      'Arco de balões na mesa, cores primárias, podendo ser orgânico, desconstruído ou tradicional'
    ],
    includedNotes: [
      'ATENÇÃO: NÃO É INCLUSO OS DOCES PERSONALIZADOS PARA A MESA DE DECORAÇÃO.',
      'O documento possui o título “OPCIONAL:” sem itens especificados imediatamente abaixo.'
    ],
    contacts: [
      { name: 'Flavio', phone: '11 96890 0572' },
      { name: 'Flávia', phone: '11 9 8706 4006' }
    ],
    socials: ['@buffetakelaoficial'],
    website: 'www.buffetakela.com.br',
    deliveryInstructions: [
      'Guardar e apresentar todos os comprovantes na semana do evento.',
      'Crianças pagantes a partir dos 6 anos e 12 meses.',
      'Fotos para retrospectiva: entregar em um pendrive ou e-mail até 15 dias antes do evento.',
      'Doces, personalizados e destilados: entregar 1 dia antes e agendado.',
      'Cerveja somente lata: trazer 1 dia antes.'
    ],
    sourceText: 'CARDAPIO INFINITY — 1ª hora: Mini pastéis sortidos, Mini pizza, Batata frita, Pão de queijo, Barqueta com maionese e caponata de berinjela, Pipoca. Lanches: Lanche de metro, Lanche Natural, Mini Hot Dog, Mini buraco quente. 2ª hora: escolher 01 opção de prato principal entre as seis alternativas cadastradas. Salgados sortidos, retrospectiva e parabéns faltando 1h30, 4ª hora com bolo exclusivo para corte com sorvete, duas opções de doces, bebidas com seleção de refrigerantes, café simples e água saborizada. Todos os inclusos, observações, contatos e instruções do rodapé estão estruturados neste cadastro.'
  },
  {
    id: 'menu-akela-prata-2027',
    name: 'Prata 2027',
    description: 'Cardápio Prata completo conforme o documento 2027.',
    pricePerPerson: 0,
    category: 'Prata · 2027',
    active: true,
    sourceLabel: 'CARDAPIO Prata 2027.docx',
    contractTemplateId: 'akela-prata-2027',
    cakeFieldLabel: 'Bolo (exclusivo para corte) com sorvete',
    items: ['Entradas', 'Lanches', 'Massa', 'Molho', 'Salgados sortidos', 'Assados', 'Bolo com sorvete', 'Doces', 'Bebidas', 'Café e água saborizada'],
    sections: [
      { title: '1ª hora de festa · Entradas', items: ['Mini Pastel', 'Mini Pizza', 'Batata Frita', 'Pão de queijo', 'Pipoca'] },
      { title: 'Lanches', items: ['Mini hot dog', 'Mini lanche Natural', 'Lanche de metro', 'Buraco quente'] },
      { title: '2ª hora de festa · Prato principal', items: ['Escolher uma Massa e um Molho'] },
      { title: 'Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Salsicha', 'Kibe', 'Risoles presunto e queijo'] },
      { title: 'Assados', items: ['Mini bauru', 'Esfiha de Carne', 'Esfiha de frango', 'Esfiha de calabresa', 'Mini quiche de alho-poró', 'Calabresa', 'Margarida'] },
      { title: 'Faltando 1h30 para o término', items: ['Bolo exclusivo para corte com sorvete — descrição definida no evento'] },
      { title: 'Bebidas durante todo o evento', items: ['Suco Natural de Fruta', 'Refrigerantes conforme seleção', 'Água com e sem gás', 'Zero e Dieth'] },
      { title: 'Encerramento', items: ['Café', 'Água saborizada'] }
    ],
    choiceGroups: [
      { id: 'pasta', label: 'Massa', required: true, options: ['Penne', 'Spaguete', 'Farfalle', 'Fusilli'] },
      { id: 'sauce', label: 'Molho', required: true, options: ['Sugo', 'Bolonhesa', 'Parisiense', 'Calabresa', 'Tostano', 'Branco'] },
      {
        id: 'dessert',
        label: 'Doces — escolher uma opção',
        required: true,
        options: [
          'BAR DE BRIGADEIRO: Brigadeiro branco e preto com confetes diversos',
          'Brigadeiro, Beijinho, doce de leite ninho, Bicho de pé, Brigadeiro de milho'
        ]
      },
      { id: 'soft-drinks', label: 'Refrigerantes — marcar opções', multiple: true, options: ['Coca-Cola', 'Guaraná Antártica', 'Kuat ou Fanta', 'Fanta Laranja', 'Fanta Uva', 'Soda'] },
      { id: 'dietary', label: 'Na festa teremos', multiple: true, options: ['Vegano', 'Vegetariano'] }
    ],
    includedServices: [
      'Decoração Temática (consultar opções no Buffet)',
      'Convite Digital',
      'Pintura nas Crianças',
      'Gincana',
      'Centro de mesa simples padrão do buffet',
      'Porta guardanapo',
      'Garçons',
      'Monitores',
      'Gerente de evento',
      'Copeira',
      'Recepcionista',
      'Vela Numérica para o Parabéns',
      'Kit mamãe',
      'Som Ambiente',
      'Retrospectiva com 60 fotos — elaboração e projeção',
      'Salão com ar ecobriza e Ventiladores',
      'Arco de balões na mesa com cores primárias, podendo ser orgânico, desconstruído ou tradicional'
    ],
    includedNotes: [
      'ATENÇÃO: NÃO É INCLUSO OS DOCES PERSONALIZADOS PARA A MESA DE DECORAÇÃO.',
      'O documento possui o título “OPCIONAL:” sem itens especificados imediatamente abaixo.'
    ],
    contacts: [
      { name: 'Flavio', phone: '11 96890 0572' },
      { phone: '11 9 1088 7094', note: 'Contato adicional conforme documento Prata.' }
    ],
    socials: ['@buffetakelaoficial'],
    website: 'www.buffetakela.com.br',
    deliveryInstructions: [
      'Guardar e apresentar todos os comprovantes na semana do evento.',
      'Crianças pagantes a partir dos 6 anos e 12 meses.',
      'Fotos para retrospectiva: entregar em um pendrive ou e-mail até 15 dias antes do evento.',
      'Doces, personalizados e destilados: entregar 1 dia antes e agendado.',
      'CERVEJA SOMENTE LATA, ENTREGAR MÍNIMO 1 DIA ANTES.'
    ],
    sourceText: 'CARDÁPIO Prata — entradas, lanches, escolha de Massa e Molho, salgados sortidos, assados, bolo exclusivo para corte com sorvete, duas opções de doces, seleção de refrigerantes, café e água saborizada. Todos os inclusos, observações, contatos e instruções do rodapé estão estruturados neste cadastro.'
  },
  {
    id: 'menu-akela-bronze',
    name: 'Bronze',
    description: 'Cardápio Bronze da Unidade II, integralmente estruturado conforme o documento.',
    pricePerPerson: 0,
    category: 'Bronze · Unidade II',
    active: true,
    sourceLabel: 'CARDAPIO Bronze.docx',
    unitRestriction: 'Somente Unidade II · Rua Canto do Mangue, 5 · JD Marisa · SP',
    contractTemplateId: 'akela-bronze-unit2',
    cakeFieldLabel: 'Bolo com Sorvete',
    items: ['Entrada', 'Lanche de metro', 'Salgados sortidos fritos na hora', 'Festival de Massa', 'Bebidas', 'Bar de Brigadeiro', 'Bolo com Sorvete'],
    sections: [
      { title: 'Entrada', items: ['Canapés', 'Brasileirinho: Arancini', 'Mini pastéis com molho barbecue'] },
      { title: 'Lanchonete', items: ['LANCHE DE METRO'] },
      { title: 'Salgados Sortidos Fritos na Hora', items: ['Coxinha', 'Bolinho de queijo', 'Carne', 'Calabresa', 'Risoles Presunto e Queijo', 'Enroladinho de Salsicha', 'Kibe', 'Mini esfihas', 'Mini quiches', 'Mini Assado salsicha', 'Mini Bauru', 'Mini empada'] },
      { title: 'Festival de Massa', items: ['Penne', 'Fusilini', 'Molho Bolonhesa', 'Molho Melchior', 'Saladas'] },
      { title: 'Durante todo o evento', items: ['Água com e sem gás', 'Suco natural de fruta', 'Coca Cola', 'Guaraná'] },
      { title: 'Encerramento', items: ['DOCES BAR DE BRIGADEIRO', 'Bolo com Sorvete — descrição definida no evento'] }
    ],
    includedServices: [
      'Decoração Temática (consultar opções no Buffet)',
      'Convite Digital',
      'Pintura nas Crianças',
      'Gincana',
      'Porta guardanapo',
      'Garçons',
      'Monitores',
      'Gerente de evento',
      'Copeira',
      'Recepcionista',
      'Vela Numérica para o Parabéns',
      'Kit mamãe',
      'Som Ambiente',
      'Retrospectiva com 60 fotos — elaboração e projeção',
      'Salão com ar ecobriza e Ventiladores',
      'Arco de balões na mesa com cores primárias, podendo ser orgânico, desconstruído ou tradicional'
    ],
    includedNotes: [
      'O documento Bronze apresenta “Bolo com Sorvete” no cardápio e também menciona “BOLO” junto a itens excluídos no corpo do contrato. A plataforma preserva as duas informações sem decidir qual prevalece.',
      'O documento possui o título “opcional:” sem itens especificados imediatamente abaixo.'
    ],
    excludedItems: [
      'Doces da mesa de decoração, Led n*, nome.',
      'Lembrancinhas.',
      'Bebida Alcoólica.',
      'Gelo.',
      'DJ.',
      'Recredor — grafia mantida conforme documento de origem.',
      'Centro de mesa dos convidados.'
    ],
    contacts: [
      { name: 'Flavio', phone: '11 96890 0572' },
      { name: 'Flávia', phone: '11 9 10887094' },
      { phone: '11 91088 7094', note: 'WhatsApp para agendamento e entrega.' }
    ],
    socials: ['@buffetakelaoficial', '@buffetakela2oficial'],
    website: 'www.buffetakela.com.br',
    deliveryInstructions: [
      'ATENÇÃO: Enviar o comprovante pelo WhatsApp.',
      'Guardar e apresentar todos os comprovantes mensalmente e eventualmente na semana do evento.',
      'Todos os doces decorativos, Lembrancinhas, Gelo e Cerveja em LATA para os convidados deverão ser entregues até um dia antes da festa em horário COMERCIAL e AGENDADO por WhatsApp (11) 91088-7094.',
      'NÃO RECEBEMOS NO DIA DA FESTA.',
      'Não insista!'
    ],
    sourceText: 'CARDAPIO Bronze — Canapés, Brasileirinho: Arancini, mini pastéis com barbecue; lanche de metro; salgados fritos na hora; festival de massa com Penne e Fusilini, molhos Bolonhesa e Melchior e saladas; água, suco, Coca Cola e Guaraná; bar de brigadeiro e bolo com sorvete. O cadastro também preserva integralmente os inclusos, o bloco ATENÇÃO, os itens NÃO INCLUSOS, contatos, redes sociais e regras de entrega.'
  },
  {
    id: 'menu-akela-churrasco-2027',
    name: 'Churrasco 2027',
    description: 'Cardápio Churrasco exclusivo da Unidade II, integralmente estruturado.',
    pricePerPerson: 0,
    category: 'Churrasco · 2027',
    active: true,
    sourceLabel: 'cardapio cchurrasco.docx',
    unitRestriction: 'SOMENTE UNIDADE II',
    contractTemplateId: 'akela-churrasco-2027',
    cakeFieldLabel: 'Bolo (exclusivo para corte) com sorvete',
    items: ['Entradas', 'Lanches', 'Churrasco', 'Acompanhamentos', 'Salgados sortidos', 'Bolo com sorvete', 'Bar de Brigadeiro', 'Bebidas', 'Café e chá'],
    sections: [
      { title: '1ª hora de festa · Entradas', items: ['Canapés simples', 'Mini pastel'] },
      { title: 'Lanches', items: ['Lanche de metro', 'Lanche Natural'] },
      { title: '2ª hora de festa · Almoço ou Jantar', items: ['Carne Bovina', 'Frango', 'Linguiça', 'Arroz', 'Farofa', 'Maionese (batata com ovo)', 'Salada de macarrão', 'Mix de folhas — alface, rúcula ou agrião e tomate'] },
      { title: 'Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Risoles presunto e queijo', 'Salsicha e Kibe', 'Enroladinho de salsicha', 'Esfihas de carne, frango, calabresa', 'Mini quiche de alho-poró', 'Margarida', 'Calabresa', 'Mini pão de queijo'] },
      { title: 'Faltando 1h30 para o término', items: ['Passaremos a retrospectiva e em seguida o parabéns'] },
      { title: '4ª hora de festa', items: ['Bolo exclusivo para corte com sorvete — descrição definida no evento', 'Bar de Brigadeiro com massa preta e branca', 'Cascata de chocolate ao leite com uva e merengue'] },
      { title: 'Bebidas durante todo o evento', items: ['Suco Natural de Fruta', 'Refrigerantes conforme seleção', 'Água com e sem gás', 'Zero e Dieth'] },
      { title: 'Encerramento', items: ['Mesa com Café e chá simples', 'Água saborizada à disposição'] }
    ],
    choiceGroups: [
      { id: 'soft-drinks', label: 'Refrigerantes — marcar opções', multiple: true, options: ['Coca-Cola', 'Guaraná Antártica', 'Kuat ou Fanta', 'Fanta Laranja', 'Fanta Uva', 'Soda'] },
      { id: 'dietary', label: 'Na festa teremos', multiple: true, options: ['Vegano', 'Vegetariano'] }
    ],
    includedServices: [
      'Decoração Temática (consultar opções no Buffet)',
      'Convite Digital',
      'Pintura nas Crianças',
      'Gincana',
      'Centro de mesa simples padrão do buffet',
      'Porta guardanapo',
      'Garçons',
      'Monitores',
      'Gerente de evento',
      'Copeira',
      'Recepcionista',
      'Vela Numérica para o Parabéns',
      'Kit mamãe',
      'Som Ambiente',
      'Retrospectiva com 60 fotos — elaboração e projeção',
      'Salão com ar ecobriza e Ventiladores',
      'Arco de balões na mesa com cores primárias, podendo ser orgânico, desconstruído ou tradicional'
    ],
    includedNotes: [
      'ATENÇÃO: NÃO É INCLUSO OS DOCES PERSONALIZADOS PARA A MESA DE DECORAÇÃO.',
      'O documento possui o título “OPCIONAL:” sem itens especificados imediatamente abaixo.'
    ],
    contacts: [
      { name: 'Flavio', phone: '11 96890 0572' },
      { phone: '11 9 1088 7094', note: 'Contato adicional conforme documento.' },
      { name: 'Flávia', phone: '11 9 8706 4006' }
    ],
    socials: ['@buffetakelaoficial'],
    website: 'www.buffetakela.com.br',
    deliveryInstructions: [
      'Guardar e apresentar todos os comprovantes na semana do evento.',
      'Crianças pagantes a partir dos 6 anos e 12 meses.',
      'Fotos para retrospectiva: entregar em um pendrive ou e-mail até 15 dias antes do evento.',
      'Doces, personalizados e destilados: entregar 1 dia antes e agendado.',
      'CERVEJA SOMENTE LATA, ENTREGAR MÍNIMO 1 DIA ANTES.'
    ],
    sourceText: 'CARDÁPIO CHURRASCO SOMENTE UNIDADE II — entradas, lanches, churrasco com carne bovina, frango e linguiça, acompanhamentos detalhados incluindo Mix de folhas (alface, rúcula ou agrião e tomate), salgados, retrospectiva, bolo, bar de brigadeiro, cascata de chocolate, bebidas, café, chá e água saborizada. Inclusos e instruções de rodapé preservados.'
  },
  {
    id: 'menu-akela-boteco-2027',
    name: 'Boteco 2027',
    description: 'Cardápio Boteco integralmente estruturado conforme o documento 2027.',
    pricePerPerson: 0,
    category: 'Boteco · 2027',
    active: true,
    sourceLabel: 'boteco 2027.docx',
    contractTemplateId: 'akela-boteco-2027',
    cakeFieldLabel: 'Bolo (exclusivo para corte) com sorvete',
    items: ['Entradas', 'Salgados sortidos', 'Assados', 'Porções', 'Escondidinho de Calabresa', 'Bolo com sorvete', 'Bar de Brigadeiro', 'Bebidas', 'Café e água saborizada'],
    sections: [
      { title: '1ª hora de festa · Entradas', items: ['Mini Pastel', 'Batata em conserva', 'Espetinho de conserva', 'Dadinho de tapioca', 'Polentinha Frita — ambos com molho barbecue conforme documento'] },
      { title: '2ª hora de festa · Salgados sortidos', items: ['Coxinha', 'Bolinha de queijo', 'Carne', 'Calabresa', 'Salsicha', 'Kibe', 'Risoles presunto e queijo'] },
      { title: 'Assados', items: ['Mini bauru', 'Esfiha de Carne', 'Esfiha de frango', 'Esfiha de calabresa', 'Mini quiche de alho-poró', 'Calabresa', 'Margarida'] },
      { title: 'Porções', items: ['Batata Frita', 'Calabresa', 'Aipim', 'Anéis de cebola', 'Escondidinho de Calabresa'] },
      { title: 'Faltando 1h30 para o término', items: ['Bolo exclusivo para corte com sorvete — descrição definida no evento'] },
      { title: 'Doces', items: ['BAR DE BRIGADEIRO: Brigadeiro branco e preto com confetes diversos', 'Cascata de chocolate com uva'] },
      { title: 'Bebidas durante todo o evento', items: ['Suco Natural de Fruta', 'Refrigerantes conforme seleção', 'Água com e sem gás', 'Zero e Dieth'] },
      { title: 'Encerramento', items: ['Café', 'Água saborizada'] }
    ],
    choiceGroups: [
      { id: 'soft-drinks', label: 'Refrigerantes — marcar opções', multiple: true, options: ['Coca-Cola', 'Guaraná Antártica', 'Kuat ou Fanta', 'Fanta Laranja', 'Fanta Uva', 'Soda'] },
      { id: 'dietary', label: 'Na festa teremos', multiple: true, options: ['Vegano', 'Vegetariano'] }
    ],
    includedServices: [
      'Decoração Temática (consultar opções no Buffet)',
      'Convite Digital',
      'Porta guardanapo',
      'Garçons',
      'Monitores',
      'Gerente de evento',
      'Copeira',
      'Recepcionista',
      'Vela Numérica para o Parabéns',
      'Kit mamãe',
      'Retrospectiva com 60 fotos — elaboração e projeção',
      'Salão com ar ecobriza e Ventiladores'
    ],
    excludedItems: [
      'Doces da mesa de decoração, Led n*, nome.',
      'Lembrancinhas.',
      'Bebida Alcoólica.',
      'Gelo.',
      'DJ.',
      'Recredor — grafia mantida conforme documento de origem.',
      'Centro de mesa dos convidados.'
    ],
    contacts: [
      { name: 'Flavio', phone: '11 96890 0572' },
      { name: 'Flávia', phone: '11 9 1088 7094' },
      { phone: '11 91088 7094', note: 'WhatsApp para agendamento e entrega.' }
    ],
    socials: ['@buffetakelaoficial', '@buffetakela2oficial'],
    website: 'www.buffetakela.com.br',
    deliveryInstructions: [
      'DADOS PARA PAGAMENTO — PIX: Buffet AKELA. O documento não informa a chave PIX.',
      'ATENÇÃO: Enviar o comprovante pelo WhatsApp.',
      'Guardar e apresentar todos os comprovantes mensalmente e eventualmente na semana do evento.',
      'Todos os doces decorativos, Lembrancinhas, Gelo e Cerveja em LATA para os convidados deverão ser entregues até um dia antes da festa em horário COMERCIAL e AGENDADO por WhatsApp (11) 91088-7094.',
      'NÃO RECEBEMOS NO DIA DA FESTA.',
      'Não insista!'
    ],
    sourceText: 'CARDÁPIO BOTECO — entradas, salgados, assados, porções, escondidinho de calabresa, bolo com sorvete, bar de brigadeiro com cascata de chocolate e uva, bebidas, café e água saborizada. O cadastro preserva também DADOS PARA PAGAMENTO — PIX: Buffet AKELA, contatos, redes sociais, itens NÃO INCLUSOS e instruções de entrega.'
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
    menuSelections: {
      'main-course': 'Strogonoff de Frango, Batata palha, Arroz e Salada',
      dessert: 'BAR DE BRIGADEIRO: Brigadeiro branco e preto, Cascata de chocolate ao leite com uva',
      'soft-drinks': ['Coca-Cola', 'Guaraná Antártica'],
      dietary: []
    },
    cakeDescription: '',
    contractTemplateId: 'akela-infinity-2027',
    paymentMethod: 'PIX',
    paymentSchedule: Array.from({ length: 5 }, () => ({ date: '', checkNumber: '', amount: 0 })),
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
  paymentTerms: 'Pagamento conforme o modelo contratual selecionado. Cheques devem respeitar os prazos do documento; comprovantes de depósito ou PIX devem ser encaminhados ao financeiro específico do modelo.',
  cancellationTerms: 'As regras de cancelamento são definidas pelo documento de origem selecionado para o evento.'
}
