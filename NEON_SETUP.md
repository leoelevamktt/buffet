# Buffet Akela — integração com Neon

## Estado da implantação

O banco `neondb` está acessível e contém o esquema criado por `scripts/neon-setup.mjs`.
A migração do painel está preparada na branch `feature/neon-postgres-workspace`, separada
da versão pública atual até a autenticação de produção estar inteiramente configurada.

## Variáveis protegidas de produção

No projeto Vercel **buffet** (Production), configurar:

- `DATABASE_URL` — já cadastrada na Vercel. Nunca inserir no frontend.
- `ADMIN_PASSWORD` — valor presente em `.env.local` na máquina autorizada.
- `ADMIN_SESSION_SECRET` — valor presente em `.env.local` na máquina autorizada.

A senha do administrador também está documentada SOMENTE na máquina autorizada:
`%LOCALAPPDATA%\BuffetAkela\admin-login.txt`.

**Não copie senhas, tokens ou URLs PostgreSQL para GitHub, mensagens, logs ou arquivos públicos.**
Quando as três variáveis estiverem definidas em Production, publicar a branch na `main`
e executar um deploy de produção. Sem isso, a autenticação retorna 503: mantenha a
versão anterior publicada até terminar o processo.

## Primeiro acesso / migração

1. Entre no painel pelo mesmo navegador que guarda os cadastros atuais.
2. Use a senha administrativa gerada na máquina autorizada.
3. O painel detecta que o Neon ainda não tem os dados do Buffet.
4. Escolha **Importar os dados deste navegador** para manter eventos, cardápios,
   serviços, configurações e recibos. Alternativamente, iniciar um banco vazio.
5. Confirme que aparece **Neon sincronizado** depois de alterar um cadastro.
6. Abra em outra sessão/dispositivo e verifique que os dados surgem sem importar de novo.

O sistema usa uma tabela `buffet_workspace` (JSONB) com `revision`: modificações
concorrentes em diferentes dispositivos retornam conflito em vez de sobrescrever
dados silenciosamente. Um aviso permite exportar backup local antes de recarregar.

## Armazenamento e privacidade

- Neon: painel administrativo, eventos, cardápios, serviços, configurações e recibos.
- Vercel Blob privado: links, snapshots de contratos assinados, orçamentos,
  comprovantes técnicos de auditoria e assinaturas existentes.
- Rotas POST e DELETE de contrato e orçamento exigem sessão administrativa;
  a consulta pública por token e a assinatura do destinatário continuam disponíveis.
- O login usa cookie HTTP-only, SameSite=Strict, HMAC e limitação de tentativas por IP.
- Nenhuma chave de banco é entregue ao navegador.

## Manutenção

- `node scripts/neon-setup.mjs`: cria o esquema se necessário, sem apagar dados.
- `node --test scripts/neon-integration.test.mjs`: testa autenticação e acesso
  real com transação revertida, sem inicializar ou sobrescrever o painel.
- `npm run build`: valida TypeScript e gera o frontend.
- Ao rotacionar a senha do Neon, atualize `DATABASE_URL` tanto na Vercel quanto
  na máquina. A URL original fornecida em um chat deve ser rotacionada depois da
  configuração definitiva, porque esteve exposta na conversa.
