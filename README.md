# Maison — Gestão de Buffet e Contratos

Plataforma web mobile-first para operação comercial de buffet e eventos.

## Recursos
- Dashboard com receita, eventos, contratos e convidados
- Cadastro de eventos em fluxo guiado
- Catálogo com múltiplos cardápios e valores por pessoa
- Serviços adicionais com preço fixo ou por convidado
- Cálculo automático do contrato
- Agenda mensal
- Geração visual de contrato
- Impressão / salvar como PDF pelo navegador
- Envio do resumo por WhatsApp
- Assinatura eletrônica desenhada em canvas
- Configurações da empresa e cláusulas padrão
- Persistência inicial em localStorage
- Layout responsivo para desktop e celular

## Desenvolvimento
npm install
npm run dev

## Produção
npm run build

A assinatura desta versão é armazenada localmente no navegador. Para operação jurídica em produção, a próxima etapa é integrar autenticação, hash, trilha de auditoria e um provedor especializado de assinatura.


## Assinatura eletrônica compartilhável

- Cada contrato pode gerar um link público exclusivo e não previsível
- O cliente abre o contrato em celular ou desktop sem acessar o painel administrativo
- O aceite exige nome, documento, checkbox de concordância e assinatura desenhada
- A assinatura é persistida em Vercel Blob privado
- O registro armazena data/hora, IP, navegador/dispositivo e hash SHA-256
- O painel sincroniza automaticamente o status do contrato
- Uma segunda assinatura do mesmo contrato é bloqueada
- O contrato assinado pode ser impresso ou salvo em PDF pelo navegador

Observação: este fluxo implementa assinatura eletrônica com evidências técnicas. Ele não equivale automaticamente a uma assinatura qualificada com certificado ICP-Brasil.


## Materiais oficiais Buffet Akela 2027

A plataforma inclui, como dados estruturados:
- Cardápio Infinity Akela 2027
- Cardápio Prata 2027
- Cardápio Bronze / Unidade II
- Cardápio Churrasco / Unidade II
- Cardápio Boteco 2027
- Contrato de Prestação de Serviços Akela 2027
- Contrato específico Bronze / Unidade II
- Contrato de Locação do Espaço 2027

Os valores de cardápio são definidos por evento quando não constam no material de origem. As escolhas do pacote (prato principal, massa, molho, doces e perfil alimentar, conforme cada cardápio) ficam registradas no evento, orçamento e contrato. O modelo contratual selecionado é congelado no registro enviado para assinatura.
