# Buffet Akela — migração segura para outra conta Vercel

O projeto antigo está suspenso (HTTP 402). **Não exclua o projeto nem o Blob antigo.**
O banco Neon fica fora da Vercel e permanece conectado pelo mesmo PostgreSQL.

## Backup preparado em 03/10/2026

Local: `%USERPROFILE%\Documents\BuffetAkela\migration-backup-2026-10-03T14-03-40-646Z`

- Exportação local do Neon: 4 tabelas (workspace, usuários, sessões e tentativas).
- Dados atuais: 4 eventos com contratos assinados, 3 clientes e 2 recibos.
- 4 documentos assinados reconstruídos com **SHA-256 idêntico ao documento original**.
- 4 recibos de assinatura tiveram os selos HMAC validados com o segredo de auditoria original.
- 12 arquivos privados preparados para recriação: contrato, arquivo assinado e ponteiro de verificação por contrato.
- 1 adendo não assinado segue preservado no workspace; seu link antigo deverá ser recriado.
- Os arquivos do Blob antigo não foram copiados diretamente porque seu token retornou acesso negado. Podem existir arquivos históricos antigos fora do Neon que não puderam ser verificados.

**Limitação das reconstruções:** os hashes do documento e as evidências de assinatura permanecem os originais, mas certos metadados da criação do convite não estavam disponíveis no Neon e são explicitamente marcados como indisponíveis.

## Executar na máquina autorizada

A ferramenta remota bloqueou o envio de credenciais diretamente à conta nova. Por isso, a migração automatizada está preparada para receber o token de forma oculta no próprio computador, sem incluí-lo no código ou nos logs.

Abra um PowerShell no Windows e execute:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\BuffetAkela\MIGRAR_BUFFET.ps1"
```

Quando for solicitado, cole o token de acesso da **nova** Vercel, nunca o da conta suspensa.

O procedimento:

1. Autentica na conta de destino e cria o projeto `buffet-akela`.
2. Copia o código para uma pasta de implantação isolada; preserva a pasta e a conta antigas.
3. Configura no novo projeto as credenciais já disponíveis localmente do Neon, da sessão e da auditoria.
4. Cria **Blob privado** na nova conta e exige a presença do novo `BLOB_READ_WRITE_TOKEN`.
5. Recria os 12 arquivos e valida seus SHA-256 no novo Blob; se algo falhar, **não publica**.
6. Faz deploy da versão atual do GitHub, com o adendo profissional e botão corrigido.
7. Verifica HTTP 200, login administrativo, os quatro contratos e suas quatro páginas de verificação.
8. Faz um segundo backup do Neon e só então atualiza os links operacionais para o novo endereço.
9. Converte o adendo não assinado que apontava ao Blob antigo para rascunho, preservando seu conteúdo para um novo link.

Confira previamente apenas o backup (sem usar token e sem modificar dados):

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Documents\BuffetAkela\MIGRAR_BUFFET.ps1" -Verificar
```

## Atenção aos links existentes

Os links que os clientes já receberam na conta Vercel antiga estão no endereço suspenso.
Publicar em outra conta não transfere automaticamente o subdomínio `.vercel.app` antigo.
Para restaurar *os links antigos tal como foram enviados*, peça à Vercel a transferência do projeto/dos domínios e a transferência separada do Blob, conforme a disponibilidade da conta antiga.

A migração preparada recupera os **documentos atualmente vinculados aos eventos ativos**, mas não pode garantir outros arquivos eventualmente existentes apenas no Blob antigo. **Não exclua a conta antiga antes de recuperar esse acesso e conferir o histórico.**

Por segurança, rotacione o token temporário da nova conta depois de concluir a migração.
