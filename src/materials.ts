import type { ContractTemplate } from './types'

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'akela-services-2027',
    name: 'Prestação de Serviços Akela 2027',
    description: 'Modelo principal utilizado com os cardápios Infinity, Prata, Churrasco e Boteco.',
    sourceLabel: 'Materiais Akela 2027 enviados pelo cliente',
    type: 'services',
    financialEmail: 'retroakela@gmail.com',
    cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 30%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
    paymentMethods: ['Dinheiro', 'Cartão', 'Cheque', 'PIX'],
    toleranceMinutes: 30,
    extraGuestPrice: 110,
    clauses: [
      'A contratada reserva sua sede para o número de convidados contratado, no período e data definidos no evento. O contratante possui 30 minutos de tolerância ao final do período contratado. Considera-se o início do evento a chegada do contratante ou de qualquer de seus convidados; o tempo excedente poderá gerar acréscimo proporcional.',
      'Alterações de data dependem da concordância da contratada e podem implicar alteração dos valores pactuados. A decoração é item terceirizado e sua disponibilidade deve ser confirmada previamente. Quando o arco de balões estiver incluído, trata-se de cortesia com cores primárias e formato orgânico, desconstruído ou tradicional, conforme disponibilidade.',
      'Doces personalizados para a mesa de decoração não estão incluídos, salvo contratação expressa. Os serviços serão prestados de acordo com o cardápio e opcionais registrados no contrato.',
      'O pagamento poderá ser realizado por dinheiro, cartão, cheque ou PIX. Cheques deverão estar integralmente compensados até 10 dias antes do evento. Comprovantes de depósito ou PIX devem ser encaminhados ao financeiro e apresentados conforme solicitado.',
      'A desistência comunicada até 90 dias antes do evento implica retenção de 30% do valor do contrato. Após esse prazo, ou em caso de não comparecimento no dia do evento, será retido o valor integral contratado.',
      'Convidados excedentes poderão ser cobrados à razão de R$ 110,00 por pessoa, considerando pagantes a partir de 6 anos e 12 meses, além de eventuais opcionais consumidos. A contratada mantém margem operacional de até 15 pessoas além do número contratado; acréscimos superiores devem ser informados e pagos previamente.',
      'Não haverá devolução de valores pela ausência de convidados contratados. O pacote poderá ser aumentado até uma semana antes, mediante comunicação e pagamento prévio; o número de convidados contratado não será reduzido.',
      'Caso o evento não seja realizado por responsabilidade da contratada, os valores recebidos serão devolvidos, ressalvados casos fortuitos ou de força maior. Em cenário de impedimento governamental ou pandêmico, o material prevê reagendamento sem ônus em até 12 meses após a liberação.',
      'A contratada não se responsabiliza por interrupções de energia elétrica ou abastecimento de água decorrentes das concessionárias e não disponibiliza geradores. Equipamentos poderão permanecer em manutenção sem prejuízo da prestação principal.',
      'O contratante indenizará danos causados por si ou por seus convidados a móveis, equipamentos, brinquedos, utensílios, mesas, cadeiras, toalhas, paredes e demais bens, pelo valor de mercado. A contratada não se responsabiliza por objetos perdidos.',
      'Acordos verbais com atendentes ou gerentes não substituem o contrato. Todo ajuste deverá constar por escrito. Serviços de terceiros, como foto, filmagem, DJ, show e retrospectiva, são de responsabilidade dos respectivos profissionais.',
      'As fotos da retrospectiva devem ser entregues no salão ou por e-mail, devidamente identificadas e em sequência, até 15 dias antes do evento. O limite de som indicado no material é de até 50 decibéis. Fotos e vídeos do evento poderão ser utilizados para divulgação do trabalho e dos espaços, conforme previsto no material contratual.'
    ],
    operationalNotes: [
      'Guardar e apresentar os comprovantes na semana do evento.',
      'Fotos para retrospectiva: entregar em pendrive ou por e-mail até 15 dias antes.',
      'Doces personalizados e destilados: entregar 1 dia antes, mediante agendamento.',
      'Cerveja: somente lata; entregar no mínimo 1 dia antes.'
    ]
  },
  {
    id: 'akela-bronze-unit2',
    name: 'Prestação de Serviços Bronze / Unidade II',
    description: 'Modelo constante no arquivo do Cardápio Bronze, com regras comerciais próprias.',
    sourceLabel: 'CARDAPIO Bronze.docx',
    type: 'services',
    financialEmail: 'buffetakela@gmail.com',
    cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 50%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
    paymentMethods: ['Dinheiro', 'Cartão', 'Cheque'],
    toleranceMinutes: 30,
    extraGuestPrice: 95,
    clauses: [
      'A contratada reserva sua sede na Unidade II para o número de convidados contratado, no período e data definidos no evento. Há tolerância de 30 minutos ao final do período contratado e o tempo excedente poderá gerar acréscimo proporcional.',
      'Alterações de data dependem da concordância da contratada e podem implicar alteração dos valores. A decoração é terceirizada e sua disponibilidade deverá ser confirmada previamente.',
      'Conforme o material Bronze, não integram automaticamente a contratação: enfeites de mesa dos convidados, doces personalizados, bolo, lembrancinhas, cerveja, vinho e taças, salvo registro expresso em contrato.',
      'O pagamento poderá ser realizado por dinheiro, cartão ou cheque. Cheques deverão estar integralmente compensados até 10 dias antes do evento e comprovantes deverão ser apresentados ao financeiro.',
      'A desistência comunicada até 90 dias antes do evento implica retenção de 50% do valor do contrato. Após esse prazo, ou em caso de não comparecimento no dia do evento, será retido o valor integral contratado.',
      'Convidados excedentes poderão ser cobrados à razão de R$ 95,00 por pessoa, considerando pagantes a partir de 6 anos e 12 meses, além de opcionais consumidos. A contratada mantém margem operacional de até 15 pessoas além do número contratado.',
      'Não haverá devolução de valores pela ausência de convidados contratados. Caso a não realização seja de responsabilidade da contratada, os valores recebidos serão devolvidos, ressalvados casos fortuitos ou de força maior.',
      'A contratada não se responsabiliza por falta de energia ou água decorrente das concessionárias e não disponibiliza geradores. Danos causados pelo contratante ou convidados serão indenizados pelo valor de mercado.',
      'Acordos verbais não substituem o contrato. Serviços de terceiros são de responsabilidade dos profissionais contratados. As fotos para retrospectiva devem ser entregues até 15 dias antes do evento, organizadas em sequência.'
    ]
  },
  {
    id: 'akela-space-rental-2027',
    name: 'Locação do Espaço 2027',
    description: 'Modelo específico para locação da sede, com montagem e desmontagem dentro do período contratado.',
    sourceLabel: 'contrato locação do espaço 2027.docx',
    type: 'space-rental',
    financialEmail: 'buffetakela@gmail.com',
    cancellationSummary: 'Cancelamento comunicado até 90 dias antes: retenção de 50%. Após esse prazo ou em caso de não comparecimento: retenção integral.',
    paymentMethods: ['Dinheiro', 'Cartão', 'Cheque', 'PIX'],
    overtimePenaltyPercent: 10,
    clauses: [
      'A contratada reserva sua sede no Jardim Marisa – SP para o número de pessoas registrado no contrato. Montagem e desmontagem deverão ocorrer dentro do intervalo contratado, com entrega do espaço totalmente vazio e com os adornos do evento retirados.',
      'Considera-se o início do evento a chegada do contratante ou de qualquer convidado. O desrespeito ao período contratado acarretará acréscimo proporcional ao tempo excedente, acrescido de multa de 10%, conforme o material de locação.',
      'Alterações de data dependem da concordância da contratada e podem implicar alteração dos valores pactuados.',
      'O pagamento poderá ser realizado por dinheiro, cartão, cheque ou PIX. Cheques deverão estar integralmente compensados até 10 dias antes do evento. Comprovantes de depósito devem ser encaminhados ao financeiro.',
      'A desistência comunicada até 90 dias antes do evento implica retenção de 50% do valor do contrato. Após esse prazo, ou em caso de não comparecimento, será retido o valor integral contratado.',
      'A contratada mantém margem operacional de até 15 pessoas além do número contratado. Não haverá devolução de valores pela ausência de convidados. O pacote poderá ser aumentado até uma semana antes mediante comunicação e pagamento prévio.',
      'Caso a não realização seja de responsabilidade da contratada, os valores recebidos serão devolvidos, ressalvados casos fortuitos ou de força maior. Em cenário de impedimento governamental ou pandêmico, o material prevê reagendamento sem ônus em até 12 meses após a liberação.',
      'A contratada não se responsabiliza por interrupções de energia elétrica ou abastecimento de água decorrentes das concessionárias e não disponibiliza geradores.',
      'O contratante indenizará danos causados por si ou por seus convidados a móveis, equipamentos, brinquedos, utensílios, mesas, cadeiras, toalhas, paredes e demais bens, pelo valor de mercado. A contratada não se responsabiliza por objetos perdidos.',
      'Acordos verbais não substituem o contrato e todo ajuste deverá constar por escrito. A contratada não se responsabiliza por serviços prestados por terceiros. O material também registra limite de som de até 50 decibéis e autorização para divulgação de fotos e vídeos do evento.'
    ]
  }
]

export const getContractTemplate = (id?: string) =>
  contractTemplates.find((template) => template.id === id) || contractTemplates[0]
