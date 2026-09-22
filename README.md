# Buffet Akela — Gestão de Eventos, Orçamentos e Contratos

Plataforma web responsiva para operação comercial do Buffet Akela, com gestão de eventos, cardápios, orçamentos, contratos e assinatura eletrônica.

## Recursos principais

- Dashboard financeiro e comercial
- Cadastro guiado de eventos
- Cardápios oficiais Akela estruturados
- Escolhas específicas por cardápio: pratos, massas, molhos, doces, refrigerantes e perfil alimentar, conforme o material de origem
- Campo de bolo e observações específicas
- Inclusos, não inclusos, regras operacionais, contatos e instruções de entrega por material
- Modalidade de locação do espaço
- Valores por pessoa ou valor fixo de locação
- Cinco linhas de pagamento/cheques quando previstas no documento
- Forma de pagamento, PIX e instruções de comprovantes conforme cada modelo
- Orçamento online compartilhável
- Contrato online compartilhável
- Assinatura eletrônica com evidências técnicas
- Impressão e PDF
- Agenda mensal
- Gestão de cardápios com edição, ativação, desativação e remoção
- Persistência administrativa inicial em localStorage
- Persistência de documentos compartilhados em Vercel Blob privado
- Layout responsivo para desktop e celular

## Assinatura eletrônica

Cada contrato pode gerar um link público exclusivo. O cliente lê o documento e registra seu aceite. O registro compartilhado armazena:

- versão congelada do evento
- cardápio e escolhas
- modelo contratual utilizado
- transcrição integral do material-fonte usado no modelo
- data e hora
- IP
- user-agent
- assinatura desenhada
- hash SHA-256

Uma segunda assinatura do mesmo documento é bloqueada. O contrato assinado pode ser impresso ou salvo em PDF.

Este fluxo implementa assinatura eletrônica com evidências técnicas. Não equivale automaticamente a uma assinatura qualificada ICP-Brasil.

## Materiais oficiais Buffet Akela

Os seis arquivos originais recebidos estão preservados em `materials/originals/`:

- `cardapio-infinity-akela-2027.docx`
- `cardapio-prata-2027.docx`
- `cardapio-bronze.docx`
- `cardapio-churrasco-2027.docx`
- `cardapio-boteco-2027.docx`
- `contrato-locacao-espaco-2027.docx`

Além do original, a plataforma mantém três representações:

1. **Original DOCX** — cópia exata do arquivo recebido.
2. **Dados estruturados** — campos utilizáveis em evento, orçamento e contrato.
3. **Transcrição integral** — extraída diretamente do XML interno de cada DOCX e exibida em Configurações > Materiais Oficiais.

O script `scripts/extract-materials.ps1` regenera `src/sourceMaterials.ts` diretamente dos DOCX.

O script `scripts/audit-materials.mjs` verifica a presença dos seis originais, calcula SHA-256 e executa verificações de cobertura sobre os pontos críticos dos materiais. O resultado também é registrado em `materials/manifest.json`.

Para auditar:

```bash
npm run materials:audit
```

## Fidelidade documental

Os modelos foram separados por arquivo de origem para não misturar regras:

- Infinity Akela 2027
- Prata 2027
- Bronze / Unidade II
- Churrasco 2027 / Unidade II
- Boteco 2027
- Locação do Espaço 2027

Quando o documento original contém informações aparentemente contraditórias, a plataforma preserva as duas informações e sinaliza a origem, em vez de decidir silenciosamente qual delas prevalece.

Os preços em branco nos documentos de origem continuam sendo definidos no momento da contratação.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Produção

```bash
npm run materials:audit
npm run build
```
