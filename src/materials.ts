import type { ContractTemplate, MaterialContact } from './types'

const commonServiceClauses30 = [
  'Pelo presente instrumento de um lado denominada como contratada: BUFFET AKELA inscrito no CNPJ nº 19.386.779.0001/53 e de outro, designado como contratante, portador de RG e CPF, residente no endereço informado, a seguir estabelecem: À Contratada se obriga a reservar sua sede para o número de pessoas contratado, comprometendo-se a prestar os serviços no período e data registrados, tendo o contratante o direito de 30 minutos de tolerância no final de seu evento. Será considerado o início do evento a chegada do contratante ou de qualquer de seus convidados; o desrespeito a este tempo acarretará ao contratante um acréscimo no valor aqui estipulado, proporcionalmente calculado em face do tempo acrescido.',
  'Alterações da data para a realização do evento dependerá da concordância da contratada e implicará em alterações dos valores pactuados. A decoração escolhida se trata de um item terceirizado não tendo qualquer vínculo com o contratado, ficando sob responsabilidade do contratante a visualização prévia da mesa escolhida bem como de eventuais adornos, não se responsabilizando a contratada por quaisquer transtornos. A decoração escolhida somente será efetivada caso o decorador a tenha disponível; estando ciente o contratante que caso negativo deverá escolher outra mesa que esteja disponível. O arco de balões se trata de uma cortesia sendo estipulado cores primárias e no formato orgânico, desconstruído ou tradicional conforme opcional do contratado. ATENÇÃO: NÃO É INCLUSO OS DOCES PERSONALIZADOS PARA A MESA DE DECORAÇÃO.',
  'A contratada prestará os serviços de acordo com o cardápio que fica fazendo parte deste contrato. O preço para este serviço é o valor registrado no evento, que acrescido dos opcionais será o total registrado no contrato.',
  'O pagamento poderá ser realizado por Dinheiro, Cartão, cheque — devendo o último cheque compensar até 10 dias antes do evento — e PIX, conforme o documento de origem.',
  'O não pagamento total ou parcial dos valores supra será interpretado como uma desistência da realização do evento, que deverá ser comunicada imediatamente. A desistência da realização por parte da contratante por qualquer que seja o motivo comunicado até 90 dias antes do evento implicará a perda de 30% (trinta por cento) do valor deste contrato; após este prazo ou o não comparecimento da contratante no dia do evento acarretará a perda de todo o valor deste contrato.',
  'Os pagamentos com cheques deverão ser compensados totalmente 10 (dez) dias antes da data do evento. Quanto aos pagamentos em depósito bancário ou PIX, os mesmos deverão ser encaminhados ao financeiro através do e-mail retroakela@gmail.com e devem ser entregues até uma semana antes do evento na unidade ou via WhatsApp conforme solicitado a qualquer momento pelo financeiro.',
  'O contratante pagará o valor referente a custos extras decorrentes de número excedente de convidados, que será de R$ 110,00 por pessoa — sendo considerado pagante a partir dos 6 anos e 12 meses — no dia da realização do evento, em dinheiro ou cartão, assim como pelo consumo de itens contratados opcionais.',
  'A contratada compromete-se em manter a qualidade de seus serviços com uma margem de até 15 pessoas a mais do número de convidados contratados, caso contrário estará isenta de arcar com eventuais problemas advindos de superior acréscimo. A contratada não fará devolução de valores caso não compareçam todas as pessoas estipuladas neste contrato.',
  'Se necessário o contratante poderá aumentar o pacote até 1 semana antes por meio de comunicação com a contratada através do e-mail acima e pagamento prévio — até uma semana antes —, não reduzimos o número de convidados contratados.',
  'A contratada acarretará a devolução de todos os valores até então recebidos caso a não realização se dê por sua conta, ressalvando os casos de fortuito ou força maior como ordens governamentais e pandemias, motivos que impeçam o funcionamento.',
  'A contratada não se responsabiliza pela falta de energia elétrica ou abastecimento de água se decorrentes de problemas com as respectivas companhias de abastecimento. Mediante qualquer cenário pandêmico ou ordem governamental de impedimento da realização do evento, fica estipulado o reagendamento sem ônus para ambas as partes em até 12 meses após liberação.',
  'A contratada não disponibiliza o uso de geradores e se reserva ao direito de manter alguns de seus equipamentos em manutenção, sem qualquer prejuízo para a mesma.',
  'O contratante indenizará à contratada por danos ou prejuízos causados em seus móveis, equipamentos, brinquedos, utensílios, inclusive mesas, cadeiras, toalhas e paredes, ocasionados pelo contratante ou por seus convidados, cujo valor será o de mercado. Não nos responsabilizamos por objetos perdidos durante o evento e demais bens.',
  'A contratada não se responsabiliza por acordos verbais feitos com os atendentes/gerentes. TUDO que for acordado e os detalhes deverá constar minuciosamente por escrito em contrato.',
  'A contratada não se responsabiliza por qualquer serviço prestado por terceiros — foto/filmagem/DJ, Show, Retrospectiva etc. — e todo o material necessário para o mesmo deverá ser fornecido pelo profissional contratado.',
  'AS FOTOS PARA RETROSPECTIVA DEVEM SER ENTREGUES NO SALÃO ATÉ 15 DIAS ANTES DO EVENTO ORGANIZADO EM SEQUÊNCIA OU VIA E-MAIL DEVIDAMENTE IDENTIFICADA; se desejar, encaminhar junto a música escolhida.',
  'Fica estabelecido o limite de som de até 50 decibéis conforme LEI e órgão eminentes.',
  'Fotos e vídeos realizados durante o evento poderão ser publicados em nossas redes sociais com o objetivo de divulgar nosso trabalho e espaços.',
  'E por estarem justos e contratados e de comum acordo, as partes obrigam-se a cumprir bem e fielmente o presente contrato.'
]

const footerOperational30 = [
  'Guardar e apresentar todos os comprovantes na semana do evento.',
  'Crianças pagantes a partir dos 6 anos e 12 meses.',
  'Fotos para retrospectiva: entregar em um pendrive ou e-mail até 15 dias antes do evento.',
  'Doces, personalizados e destilados: entregar 1 dia antes e agendado.',
  'Cerveja somente lata: trazer/entregar no mínimo 1 dia antes.'
]

const excludedBronzeBoteco = [
  'Doces da mesa de decoração, Led n*, nome.',
  'Lembrancinhas.',
  'Bebida Alcoólica.',
  'Gelo.',
  'DJ.',
  'Recredor — grafia mantida conforme documento de origem.',
  'Centro de mesa dos convidados.'
]

const deliveryBronzeBoteco = [
  'Todos os doces decorativos, lembrancinhas, gelo e cerveja em LATA para os convidados deverão ser entregues até um dia antes da festa em horário COMERCIAL e AGENDADO por WhatsApp (11) 91088-7094.',
  'NÃO RECEBEMOS NO DIA DA FESTA.',
  'Não insista!'
]

const bronzeClauses = [
  'Pelo presente instrumento de um lado denominada como contratada: AKELA BUFFET, situado na Rua Canto do Mangue, 5 JD Marisa SP UNID 2 e de outro, designado como contratante, portador do RG e CPF e residente no endereço informado, a seguir estabelecem: À Contratada se obriga a reservar sua sede para o número de pessoas contratado, comprometendo-se a prestar os serviços contratados no período e data registrados, tendo o contratante 30 minutos de tolerância ao final do mencionado período. Será considerado o início do evento a chegada do contratante ou de qualquer de seus convidados; o desrespeito a este tempo acarretará ao contratante um acréscimo no valor aqui estipulado, proporcionalmente calculado em face do tempo acrescido.',
  'Alterações da data para a realização do evento dependerá da concordância da contratada e implicará em alterações dos valores pactuados. A decoração escolhida se trata de um item terceirizado não tendo qualquer vínculo com o contratado, ficando sob responsabilidade do contratante a visualização prévia da mesa escolhida bem como de eventuais adornos, não responsabilizando a contratada por quaisquer transtornos. A decoração escolhida somente será efetivada caso o decorador a tenha disponível; estando ciente o contratante que caso negativo deverá escolher outra mesa que esteja disponível.',
  'O documento registra: ENFEITES DE MESA DOS CONVIDADOS, DOCES PERSONALIZADOS E BOLO, LEMBRANCINHAS E CERVEJA, VINHO E TAÇAS. A contratada prestará os serviços de acordo com o cardápio que fica fazendo parte deste contrato. Observação de fidelidade: o próprio cardápio Bronze também traz “Bolo com Sorvete” no encerramento; as duas informações do documento são preservadas sem reconciliação automática.',
  'O preço para este serviço é o valor registrado no evento, que acrescido dos opcionais será o total registrado no contrato. O pagamento poderá ser realizado por Dinheiro, Cartão ou cheque, com compensação do último cheque até 10 dias antes do evento.',
  'O não pagamento total ou parcial dos valores supra será interpretado como uma desistência da realização do evento que deverá ser comunicada. A desistência da realização por parte da contratante por qualquer que seja o motivo comunicado até 90 dias antes do evento implicará a perda de 50% (cinquenta por cento) do valor deste contrato; após este prazo ou o não comparecimento da contratante no dia do evento acarretará a perda de todo o valor deste contrato.',
  'Os pagamentos com cheques deverão ser compensados totalmente 10 (dez) dias antes da data do evento. Quanto aos pagamentos em depósito bancário, os mesmos deverão ser encaminhados ao financeiro através do e-mail buffetakela@gmail.com e devem ser entregues até uma semana antes do evento na unidade.',
  'O contratante pagará o valor referente a custos extras decorrentes de número excedente de convidados, que será de R$ 95,00 por pessoa, no dia da realização do evento — pagantes a partir de 6 anos e 12 meses —, em dinheiro ou cartão, assim como pelo consumo de itens contratados opcionais.',
  'A contratada compromete-se em manter a qualidade de seus serviços com uma margem de até 15 pessoas a mais do número de convidados contratados, caso contrário estará isenta de arcar com eventuais problemas advindos de superior acréscimo. A contratada não fará devolução de valores caso não compareçam todas as pessoas estipuladas neste contrato.',
  'A contratada acarretará a devolução de todos os valores até então recebidos caso a não realização se dê por sua conta, ressalvando os casos de fortuito ou força maior como ordens governamentais e pandemias, motivos que impeçam o funcionamento.',
  'A contratada não se responsabiliza pela falta de energia elétrica ou abastecimento de água se decorrentes de problemas com as respectivas companhias de abastecimento. Mediante qualquer cenário pandêmico ou ordem governamental de impedimento da realização do evento, fica estipulado o reagendamento sem ônus para ambas as partes em até 12 meses após liberação.',
  'A contratada não disponibiliza o uso de geradores e se reserva ao direito de manter alguns de seus equipamentos em manutenção, sem qualquer prejuízo para a mesma.',
  'O contratante indenizará à contratada por danos ou prejuízos causados em seus móveis, equipamentos, brinquedos, utensílios, inclusive mesas, cadeiras, toalhas e paredes, ocasionados pelo contratante ou por seus convidados, cujo valor será o de mercado. Não nos responsabilizamos por objetos perdidos durante o evento e demais bens.',
  'A contratada não se responsabiliza por acordos verbais feitos com os atendentes/gerentes. TUDO que for acordado e os detalhes deverá constar minuciosamente por escrito em contrato.',
  'A contratada não se responsabiliza por qualquer serviço prestado por terceiros — foto/filmagem/DJ, Show, Retrospectiva etc. — e todo o material necessário para o mesmo deverá ser fornecido pelo profissional contratado.',
  'AS FOTOS PARA RETROSPECTIVA DEVEM SER ENTREGUES NO SALÃO ATÉ 15 DIAS ANTES DO EVENTO ORGANIZADO EM SEQUÊNCIA; se desejar encaminhar junto a música escolhida.',
  'E por estarem justos e contratados e de comum acordo, as partes obrigam-se a cumprir bem e fielmente o presente contrato.'
]

const botecoClauses = [
  'Pelo presente instrumento de um lado denominada como contratada: AKELA BUFFET, situado na Rua Canto do Mangue, 5 JD Marisa SP e de outro, designado como contratante, portador do RG e CPF e residente no endereço informado, a seguir estabelecem: À Contratada se obriga a reservar sua sede para o número de pessoas contratado, comprometendo-se a prestar os serviços contratados no período e data registrados, tendo o contratante 30 minutos de tolerância ao final do mencionado período. Será considerado o início do evento a chegada do contratante ou de qualquer de seus convidados; o desrespeito a este tempo acarretará ao contratante um acréscimo no valor aqui estipulado, proporcionalmente calculado em face do tempo acrescido.',
  'Alterações da data para a realização do evento dependerá da concordância da contratada e implicará em alterações dos valores pactuados. A decoração escolhida se trata de um item terceirizado não tendo qualquer vínculo com o contratado, ficando sob responsabilidade do contratante a visualização prévia da mesa escolhida bem como de eventuais adornos, não responsabilizando a contratada por quaisquer transtornos. A decoração escolhida somente será efetivada caso o decorador a tenha disponível; estando ciente o contratante que caso negativo deverá escolher outra mesa que esteja disponível.',
  'A contratada prestará os serviços de acordo com o cardápio que fica fazendo parte deste contrato. O preço para este serviço é o valor registrado no evento, que acrescido dos opcionais será o total registrado no contrato.',
  'O pagamento poderá ser realizado por Dinheiro, Cartão ou cheque — devendo o último cheque compensar até 10 dias antes do evento.',
  'O não pagamento total ou parcial dos valores supra será interpretado como uma desistência da realização do evento que deverá ser comunicada imediatamente. A desistência da realização por parte da contratante por qualquer que seja o motivo comunicado até 90 dias antes do evento implicará a perda de 30% (trinta por cento) do valor deste contrato; após este prazo ou o não comparecimento da contratante no dia do evento acarretará a perda de todo o valor deste contrato.',
  'Os pagamentos com cheques deverão ser compensados totalmente 10 (dez) dias antes da data do evento. Quanto aos pagamentos em depósito bancário ou PIX, os mesmos deverão ser encaminhados ao financeiro através do e-mail retroakela@gmail.com e devem ser entregues até uma semana antes do evento na unidade ou via WhatsApp conforme solicitado a qualquer momento pelo financeiro.',
  'O contratante pagará o valor referente a custos extras decorrentes de número excedente de convidados, que será de R$ 110,00 por pessoa — sendo considerado pagante a partir dos 6 anos e 12 meses —, no dia da realização do evento, em dinheiro ou cartão, assim como pelo consumo de itens contratados opcionais.',
  'A contratada compromete-se em manter a qualidade de seus serviços com uma margem de até 15 pessoas a mais do número de convidados contratados, caso contrário estará isenta de arcar com eventuais problemas advindos de superior acréscimo. A contratada não fará devolução de valores caso não compareçam todas as pessoas estipuladas neste contrato.',
  'Se necessário o contratante poderá aumentar o pacote até 1 semana antes por meio de comunicação com a contratada através do e-mail acima e pagamento prévio — até uma semana antes —, não reduzimos o número de convidados contratados.',
  'A contratada acarretará a devolução de todos os valores até então recebidos caso a não realização se dê por sua conta, ressalvando os casos de fortuito ou força maior como ordens governamentais e pandemias, motivos que impeçam o funcionamento.',
  'A contratada não se responsabiliza pela falta de energia elétrica ou abastecimento de água se decorrentes de problemas com as respectivas companhias de abastecimento. Mediante qualquer cenário pandêmico ou ordem governamental de impedimento da realização do evento, fica estipulado o reagendamento sem ônus para ambas as partes em até 12 meses após liberação.',
  'A contratada não disponibiliza o uso de geradores e se reserva ao direito de manter alguns de seus equipamentos em manutenção, sem qualquer prejuízo para a mesma.',
  'O contratante indenizará à contratada por danos ou prejuízos causados em seus móveis, equipamentos, brinquedos, utensílios, inclusive mesas, cadeiras, toalhas e paredes, ocasionados pelo contratante ou por seus convidados, cujo valor será o de mercado. Não nos responsabilizamos por objetos perdidos durante o evento e demais bens.',
  'A contratada não se responsabiliza por acordos verbais feitos com os atendentes/gerentes. TUDO que for acordado e os detalhes deverá constar minuciosamente por escrito em contrato.',
  'A contratada não se responsabiliza por qualquer serviço prestado por terceiros — foto/filmagem/DJ, Show, Retrospectiva etc. — e todo o material necessário para o mesmo deverá ser fornecido pelo profissional contratado.',
  'AS FOTOS PARA RETROSPECTIVA DEVEM SER ENTREGUES NO SALÃO ATÉ 15 DIAS ANTES DO EVENTO ORGANIZADO EM SEQUÊNCIA OU VIA E-MAIL DEVIDAMENTE IDENTIFICADA; se desejar encaminhar junto a música escolhida.',
  'Fica estabelecido o limite de som de até 50 decibéis conforme LEI e órgão eminentes.',
  'Fotos e vídeos realizados durante o evento poderão ser publicados em nossas redes sociais com o objetivo de divulgar nosso trabalho e espaços.',
  'E por estarem justos e contratados e de comum acordo, as partes obrigam-se a cumprir bem e fielmente o presente contrato.'
]

const rentalClauses = [
  'Pelo presente instrumento de um lado denominada como contratada: BUFFET AKELA inscrito no CNPJ nº 19.386.779.0001/53 e de outro, designado como contratante, portador de RG e CPF e residente no endereço informado, a seguir estabelecem: À Contratada se obriga a reservar sua sede no Jd. Marisa – SP para o número de pessoas contratado, comprometendo-se a prestar os serviços no mesmo período registrado para montagem e desmontagem dentro deste intervalo de tempo e entrega do espaço totalmente vazio e com todos seus adornos para o evento retirado.',
  'Será considerado o início do evento a chegada do contratante ou de qualquer de seus convidados. O desrespeito a este tempo acarretará ao contratante um acréscimo no valor aqui estipulado, proporcionalmente calculado em face do tempo acrescido mais multa de 10%.',
  'Alterações da data para a realização do evento dependerá da concordância da contratada e implicará em alterações dos valores pactuados.',
  'O preço para este serviço é o valor registrado no evento, que acrescido dos opcionais será o total registrado no contrato. O pagamento poderá ser realizado por Dinheiro, Cartão, cheque — devendo o último cheque compensar até 10 dias antes do evento — ou PIX.',
  'O não pagamento total ou parcial dos valores supra será interpretado como uma desistência da realização do evento que deverá ser comunicada. A desistência da realização por parte da contratante por qualquer que seja o motivo comunicado até 90 dias antes do evento implicará a perda de 50% (cinquenta por cento) do valor deste contrato; após este prazo ou o não comparecimento da contratante no dia do evento acarretará a perda de todo o valor deste contrato.',
  'Os pagamentos com cheques deverão ser compensados totalmente 10 (dez) dias antes da data do evento. Quanto aos pagamentos em depósito bancário, os mesmos deverão ser encaminhados ao financeiro através do e-mail buffetakela@gmail.com e devem ser entregues até uma semana antes do evento na unidade.',
  'A contratada compromete-se em manter a qualidade de seus serviços com uma margem de até 15 pessoas a mais do número de convidados contratados, caso contrário estará isenta de arcar com eventuais problemas advindos de superior acréscimo. A contratada não fará devolução de valores caso não compareçam todas as pessoas estipuladas neste contrato.',
  'Se necessário o contratante poderá aumentar o pacote até 1 semana antes por meio de comunicação com a contratada através do e-mail acima e pagamento prévio — até uma semana antes.',
  'A contratada acarretará a devolução de todos os valores até então recebidos caso a não realização se dê por sua conta, ressalvando os casos de fortuito ou força maior como ordens governamentais e pandemias, motivos que impeçam o funcionamento.',
  'A contratada não se responsabiliza pela falta de energia elétrica ou abastecimento de água se decorrentes de problemas com as respectivas companhias de abastecimento. Mediante qualquer cenário pandêmico ou ordem governamental de impedimento da realização do evento, fica estipulado o reagendamento sem ônus para ambas as partes em até 12 meses após liberação.',
  'A contratada não disponibiliza o uso de geradores e se reserva ao direito de manter alguns de seus equipamentos em manutenção, sem qualquer prejuízo para a mesma.',
  'O contratante indenizará à contratada por danos ou prejuízos causados em seus móveis, equipamentos, brinquedos, utensílios, inclusive mesas, cadeiras, toalhas e paredes, ocasionados pelo contratante ou por seus convidados, cujo valor será o de mercado. Não nos responsabilizamos por objetos perdidos durante o evento e demais bens.',
  'A contratada não se responsabiliza por acordos verbais feitos com os atendentes/gerentes. TUDO que for acordado e os detalhes deverá constar minuciosamente por escrito em contrato.',
  'A contratada não se responsabiliza por qualquer serviço prestado por terceiros — foto/filmagem/DJ, Show, Retrospectiva etc. — e todo o material necessário para o mesmo deverá ser fornecido pelo profissional contratado.',
  'Fica estabelecido o limite de som de até 50 decibéis conforme LEI e órgão eminentes.',
  'Fotos e vídeos realizados durante o evento poderão ser publicados em nossas redes sociais com o objetivo de divulgar nosso trabalho e espaços.',
  'E por estarem justos e contratados e de comum acordo, as partes obrigam-se a cumprir bem e fielmente o presente contrato.'
]

const infinityContacts: MaterialContact[] = [
  { name: 'Flavio', phone: '11 96890 0572' },
  { name: 'Flávia', phone: '11 9 8706 4006' }
]
const prataContacts: MaterialContact[] = [
  { name: 'Flavio', phone: '11 96890 0572' },
  { phone: '11 9 1088 7094', note: 'Contato adicional conforme documento Prata.' }
]
const churrascoContacts: MaterialContact[] = [
  { name: 'Flavio', phone: '11 96890 0572' },
  { phone: '11 9 1088 7094', note: 'Contato adicional conforme documento.' },
  { name: 'Flávia', phone: '11 9 8706 4006' }
]
const bronzeContacts: MaterialContact[] = [
  { name: 'Flavio', phone: '11 96890 0572' },
  { name: 'Flávia', phone: '11 9 10887094' },
  { phone: '11 91088 7094', note: 'WhatsApp indicado para agendamento e entrega.' }
]
const botecoContacts: MaterialContact[] = [
  { name: 'Flavio', phone: '11 96890 0572' },
  { name: 'Flávia', phone: '11 9 1088 7094' },
  { phone: '11 91088 7094', note: 'WhatsApp indicado para agendamento e entrega.' }
]

const makeService30 = (
  id: string,
  name: string,
  sourceLabel: string,
  contacts: MaterialContact[]
): ContractTemplate => ({
  id,
  name,
  description: 'Modelo de prestação de serviços transcrito do material indicado, preservando regras, pagamentos, convidados excedentes, operação e observações.',
  sourceLabel,
  type: 'services',
  financialEmail: 'retroakela@gmail.com',
  cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 30%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
  paymentMethods: ['Dinheiro', 'Cartão', 'Cheque', 'PIX'],
  paymentScheduleSlots: 5,
  toleranceMinutes: 30,
  extraGuestPrice: 110,
  clauses: commonServiceClauses30,
  operationalNotes: footerOperational30,
  contacts,
  socials: ['@buffetakelaoficial'],
  website: 'www.buffetakela.com.br',
  paymentData: {
    financialEmail: 'retroakela@gmail.com',
    proofInstructions: [
      'Encaminhar comprovantes de depósito bancário ou PIX ao financeiro.',
      'Os comprovantes devem ser entregues até uma semana antes do evento na unidade ou via WhatsApp conforme solicitado pelo financeiro.'
    ]
  },
  sourceText: 'Texto contratual integral preservado no cadastro a partir de ' + sourceLabel + '.'
})

export const contractTemplates: ContractTemplate[] = [
  makeService30('akela-infinity-2027', 'Prestação de Serviços · Infinity Akela 2027', 'CARDAPIO INFINITY AKELA 2027.docx', infinityContacts),
  makeService30('akela-prata-2027', 'Prestação de Serviços · Prata 2027', 'CARDAPIO Prata 2027.docx', prataContacts),
  {
    id: 'akela-bronze-unit2',
    name: 'Prestação de Serviços · Bronze / Unidade II',
    description: 'Modelo integral do Cardápio Bronze, com regras comerciais e operacionais próprias da Unidade II.',
    sourceLabel: 'CARDAPIO Bronze.docx',
    type: 'services',
    financialEmail: 'buffetakela@gmail.com',
    cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 50%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
    paymentMethods: ['Dinheiro', 'Cartão', 'Cheque'],
    paymentScheduleSlots: 5,
    toleranceMinutes: 30,
    extraGuestPrice: 95,
    clauses: bronzeClauses,
    operationalNotes: [
      'ATENÇÃO: Enviar o comprovante pelo WhatsApp.',
      'Guardar e apresentar todos os comprovantes mensalmente e eventualmente na semana do evento.'
    ],
    excludedItems: excludedBronzeBoteco,
    deliveryInstructions: deliveryBronzeBoteco,
    contacts: bronzeContacts,
    socials: ['@buffetakelaoficial', '@buffetakela2oficial'],
    website: 'www.buffetakela.com.br',
    paymentData: {
      financialEmail: 'buffetakela@gmail.com',
      proofWhatsapp: '11 91088 7094',
      proofInstructions: [
        'Enviar o comprovante pelo WhatsApp.',
        'Guardar e apresentar todos os comprovantes mensalmente e eventualmente na semana do evento.'
      ]
    },
    sourceText: 'Conteúdo integral do contrato, avisos, contatos, itens não inclusos e instruções de entrega preservado a partir de CARDAPIO Bronze.docx.'
  },
  makeService30('akela-churrasco-2027', 'Prestação de Serviços · Churrasco 2027 / Unidade II', 'cardapio cchurrasco.docx', churrascoContacts),
  {
    id: 'akela-boteco-2027',
    name: 'Prestação de Serviços · Boteco 2027',
    description: 'Modelo próprio constante no arquivo Boteco 2027, preservando regras, contatos, dados para pagamento, itens não inclusos e instruções.',
    sourceLabel: 'boteco 2027.docx',
    type: 'services',
    financialEmail: 'retroakela@gmail.com',
    cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 30%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
    paymentMethods: ['Dinheiro', 'Cartão', 'Cheque'],
    paymentScheduleSlots: 5,
    toleranceMinutes: 30,
    extraGuestPrice: 110,
    clauses: botecoClauses,
    operationalNotes: [
      'DADOS PARA PAGAMENTO — PIX: Buffet AKELA. O documento não informa a chave PIX.',
      'ATENÇÃO: Enviar o comprovante pelo WhatsApp.',
      'Guardar e apresentar todos os comprovantes mensalmente e eventualmente na semana do evento.'
    ],
    excludedItems: excludedBronzeBoteco,
    deliveryInstructions: deliveryBronzeBoteco,
    contacts: botecoContacts,
    socials: ['@buffetakelaoficial', '@buffetakela2oficial'],
    website: 'www.buffetakela.com.br',
    paymentData: {
      pixLabel: 'Buffet AKELA',
      pixKey: '',
      financialEmail: 'buffetakela@gmail.com',
      proofWhatsapp: '11 91088 7094',
      proofInstructions: [
        'Enviar o comprovante pelo WhatsApp.',
        'Guardar e apresentar todos os comprovantes mensalmente e eventualmente na semana do evento.'
      ]
    },
    sourceText: 'Conteúdo integral do contrato, bloco DADOS PARA PAGAMENTO, avisos, contatos, itens não inclusos e instruções de entrega preservado a partir de boteco 2027.docx.'
  },
  {
    id: 'akela-space-rental-2027',
    name: 'Contrato de Prestação de Serviços · Locação do Espaço 2027',
    description: 'Modelo integral de locação da sede no Jardim Marisa, com montagem/desmontagem dentro do período contratado.',
    sourceLabel: 'contrato locação do espaço 2027.docx',
    type: 'space-rental',
    financialEmail: 'buffetakela@gmail.com',
    cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 50%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
    paymentMethods: ['Dinheiro', 'Cartão', 'Cheque', 'PIX'],
    paymentScheduleSlots: 5,
    overtimePenaltyPercent: 10,
    clauses: rentalClauses,
    paymentData: {
      financialEmail: 'buffetakela@gmail.com',
      proofInstructions: [
        'Pagamentos em depósito bancário devem ser encaminhados ao financeiro através do e-mail buffetakela@gmail.com.',
        'Os comprovantes devem ser entregues até uma semana antes do evento na unidade.'
      ]
    },
    sourceText: 'Conteúdo integral do contrato de locação preservado a partir de contrato locação do espaço 2027.docx.'
  }
]

export const getContractTemplate = (id?: string) =>
  contractTemplates.find((template) => template.id === id) || contractTemplates[0]
