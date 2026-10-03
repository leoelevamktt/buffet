# Buffet Akela — migração entre contas Vercel

Atualização: 03/10/2026. **Dados e documentos migrados e auditados; a implantação automática pelo GitHub já funciona. Falta apenas o titular confirmar seu acesso com a senha administrativa atual.**

## Conta e ambiente de destino

- Conta Vercel: `samivoriekevin3`.
- Projeto de destino: `buffet-akela`, ID `prj_LGY9WmXCEJptZ2Z7rf98BVZBqpsM`.
- Novo Blob privado: `buffet-akela-contracts`, ID `store_zsZCiqzKrZiUW4pb`, região `iad1`.
- URL principal: <https://buffetakela.vercel.app>.
- Alias adicional: <https://buffet-akela.vercel.app>.
- Código em produção: branch `main`, com implantação automática verificada no commit `cc71521`.
- PostgreSQL: banco Neon original mantido, **sem recriar tabelas ou sobrescrever registros**.

O antigo hostname `buffet-kappa-teal.vercel.app` retorna 404. Nenhum dos eventos ativos presentes no backup utiliza esse hostname; todos apontam para `buffetakela.vercel.app`, que já está na nova conta.

## Backups físicos no computador autorizado

Pasta raiz: `%USERPROFILE%\Documents\BuffetAkela\`.

1. `original-blob-backup-2026-10-03`: 29 arquivos privados originais, com SHA-256 e manifesto integral. Total: 1.085.506 bytes.
2. `migration-backup-2026-10-03T14-03-40-646Z`: snapshot anterior do Neon e 12 arquivos recuperados dos contratos atuais.
3. `neon-fresh-before-migration-2026-10-03.json`: snapshot mais recente e consistente das quatro tabelas do Neon, com revisão 31 do workspace; contém dados privados e hashes de senha. Não compartilhar.
4. `original-env-before-migration-20261003.backup`: cópia das configurações anteriores, **sensível**. Não versionar nem compartilhar.

Nenhum dos arquivos originais do Blob foi excluído da conta antiga.

## Transferência integral do Blob

Foram transferidos e conferidos por SHA-256 todos os 29 arquivos originais, preservando seus caminhos:
- 17 registros de contratos;
- 2 orçamentos;
- 5 arquivos imutáveis de assinaturas;
- 5 índices de verificação.

O Blob da nova conta também preserva **oito cópias anteriores recuperadas** em `migration-recovered/`, totalizando **37 objetos** no novo armazenamento. A validação final, repetida após a implantação automática, comprovou **29/29 arquivos originais byte a byte idênticos ao backup**, além dos oito objetos históricos recuperados.

Cinco contratos assinados, incluindo os quatro atualmente vinculados aos eventos ativos, possuem integridade SHA-256 e selo HMAC válidos. Quatro registros históricos adicionais estavam marcados como assinados no armazenamento original, mas não possuem recibo criptográfico moderno verificável. Foram preservados integralmente, sem atribuir validade técnica inexistente.

## Banco de dados

O Neon conserva:
- quatro eventos com contratos assinados;
- três clientes;
- dois recibos;
- um adendo ainda em rascunho;
- usuários, sessões e tentativas de acesso registrados nas respectivas tabelas.

Os dados foram copiados para backup local antes de qualquer operação sensível. O adendo existente segue como rascunho com seu conteúdo preservado.

## Testes realizados no novo domínio

- Homepage HTTP 200, JavaScript e CSS servidos corretamente;
- Rotas privadas `/api/workspace` e `/api/users` bloqueadas para usuários não autenticados (HTTP 401);
- Quatro contratos ativos: snapshot, hash e comprovante técnico conferidos;
- Quatro códigos públicos de verificação: integridade confirmada;
- Um contrato histórico adicional: assinatura e verificação confirmadas;
- Rotas públicas de assinatura e verificação HTTP 200;
- Alias antigo dos quatro contratos atuais preservado no novo projeto;
- Novo Blob 29/29 originais, oito cópias recuperadas.

A versão publicada inclui o editor profissional de adendos em nove seções, o botão Adendos com contraste corrigido e a retirada da frase solicitada do documento visual.

## Implantação automática do GitHub

A conta de destino não precisa mais da conexão OAuth para receber publicações: foi configurado o workflow `.github/workflows/deploy.yml`, acionado a cada `push` na branch `main` e também manualmente. O token de implantação fica criptografado no segredo `VERCEL_TOKEN` do repositório, nunca no código; identificadores da equipe/projeto estão nas variáveis de CI. O workflow compila, executa testes, baixa as configurações de produção, publica na nova conta e verifica o domínio e o bloqueio das APIs privadas.

A execução [37135572544](https://github.com/leoelevamktt/buffet/actions/runs/37135572544) terminou com **sucesso**, incluindo a publicação na nova conta e o teste público final. A integração OAuth nativa do GitHub com a nova Vercel só será necessária se o titular desejar prévias automáticas por pull request ou os recursos nativos dessa integração.

## Pendências para encerrar a migração operacional

**1. Confirmação do acesso administrativo.** A senha encontrada no arquivo local antigo não coincide com o hash atualmente salvo no Neon para `admin`; isso é compatível com uma troca de senha posterior pelo próprio titular. O usuário original, seu hash e suas sessões foram preservados. Por segurança não houve redefinição automática. O titular precisa confirmar que consegue entrar com sua senha atual no novo endereço. Se não a possuir, será necessário autorizar e executar uma recuperação de acesso apropriada. Os testes autenticados completos no novo domínio dependem disso.

**2. Integração GitHub opcional.** O deploy automático já está funcionando por GitHub Actions, sem OAuth nativo da Vercel. Para ter prévias automáticas por PR e demais recursos GitHub/Vercel, o titular pode conectar sua conta GitHub às Login Connections da nova Vercel.

**3. Credenciais compartilhadas.** Após confirmar o acesso e as integrações, rotacionar o token temporário da nova conta Vercel e a credencial do Blob antigo disponibilizados na conversa. Não apagar o Blob anterior antes de concluir a retenção histórica desejada.

Não inserir credenciais nem URLs privadas de assinatura em commits, issues ou logs públicos.
