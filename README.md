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
