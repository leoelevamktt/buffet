# Buffet Akela — migração entre contas Vercel

Atualização: 03/10/2026. **Os dados e os documentos foram migrados e auditados; a conferência do acesso administrativo e o vínculo GitHub ainda dependem da autorização do titular.**

## Conta e ambiente de destino

- Conta Vercel: `samivoriekevin3`.
- Projeto de destino: `buffet-akela`, ID `prj_LGY9WmXCEJptZ2Z7rf98BVZBqpsM`.
- Novo Blob privado: `buffet-akela-contracts`, ID `store_zsZCiqzKrZiUW4pb`, região `iad1`.
- URL principal: <https://buffetakela.vercel.app>.
- Alias adicional: <https://buffet-akela.vercel.app>.
- Código publicado: commit `e9bff5c` da branch `main`.
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

O Blob da nova conta também preserva **oito cópias anteriores recuperadas** em `migration-recovered/`, totalizando **37 objetos** no novo armazenamento. A validação final comprovou 29/29 arquivos originais com conteúdo idêntico ao backup.

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

## Pendências para encerrar a migração operacional

**1. Login administrativo.** A senha encontrada no arquivo local de acesso anterior e no ambiente antigo não coincide com o hash atualmente salvo no Neon para `admin`. O usuário original e seu hash foram preservados. Não houve redefinição automática de senha. O titular deve usar a senha correta que já possui ou autorizar explicitamente uma redefinição e confirmar o método adequado. Os testes autenticados do novo domínio dependem disso.

**2. GitHub / deploy automático.** A nova conta Vercel não possui conexão OAuth com a conta GitHub `leoelevamktt`. A tentativa de vincular `leoelevamktt/buffet` retornou a exigência de criar primeiro uma Login Connection com o GitHub. Para autorizar, entrar na **nova** conta Vercel e conectar GitHub nas configurações de Login Connections. Enquanto isso, as implantações manuais pela CLI na máquina autorizada funcionam; mudanças no GitHub **não** são automaticamente publicadas.

**3. Credenciais compartilhadas.** Após confirmar o acesso e as integrações, rotacionar o token temporário da nova conta Vercel e a credencial do Blob antigo disponibilizados na conversa. Não apagar o Blob anterior antes de concluir a retenção histórica desejada.

Não inserir credenciais nem URLs privadas de assinatura em commits, issues ou logs públicos.
