# Buffet Akela — Neon PostgreSQL e segurança de acesso

## Infraestrutura
- Banco `neondb` configurado via `DATABASE_URL`, exclusivamente em rotas do servidor.
- `ADMIN_SESSION_SECRET` protege os tokens das sessões de administradores e operadores.
- `ADMIN_PASSWORD` é usado **somente para criar o usuário admin inicial**; a autenticação posterior
  verifica o hash da senha no Neon, não a variável em texto puro.
- Tabelas: `buffet_workspace`, `buffet_users`, `buffet_sessions` e `buffet_login_attempts`.
- A criação do esquema e do admin inicial é idempotente: `node scripts/neon-setup.mjs`.
- O esquema e o admin inicial já foram criados e validados no Neon.

## Usuário administrativo inicial
- Nome de usuário: `admin`.
- Senha: a senha administrativa anteriormente gerada, guardada **apenas** na máquina
  autorizada em `%LOCALAPPDATA%\BuffetAkela\admin-login.txt` e em `.env.local`.
- A senha fica armazenada no Neon somente como derivação scrypt com sal aleatório.
- Não envie credenciais, conexão PostgreSQL ou segredos para repositórios ou chats.

## Acesso e permissões
- Login individual com usuário (ou e-mail) e senha. Sessão opaca em cookie HTTP-only,
  SameSite=Strict, Secure em produção; token original não é armazenado no banco.
- Sessões persistidas no Neon e limitadas a 12 horas. Revogadas ao sair, alterar senha,
  alterar perfil ou desativar a conta.
- Perfil `admin`: painel completo e área Usuários com criação, edição, redefinição de senha,
  ativação e desativação. Não permite que o último administrador seja desativado.
- Perfil `operador`: eventos, cardápios, contratos, recibos e demais funções operacionais.
  A API impede acesso e alterações à administração de usuários.
- `Minha conta`: alteração da própria senha após conferir a senha atual.
- Limitação de tentativas de login por IP. Requisições de alteração exigem a mesma origem.
- Todas as rotas administrativas de escrita em contratos e orçamentos exigem sessão.

## Primeiro acesso e importação de dados existentes
1. Acesse a produção usando o navegador que já contém os cadastros do Buffet.
2. Entre com o usuário `admin` e a senha do arquivo local informado acima.
3. Como o Neon ainda não contém os cadastros históricos do painel, escolha
   **Importar os dados deste navegador**.
4. Revise os eventos, cardápios, pagamentos e recibos importados. A importação não
   apaga o armazenamento anterior do navegador.
5. Confira o status **Neon sincronizado** após as primeiras alterações.
6. Se necessário, crie os acessos dos colaboradores em **Usuários**.

A importação é uma decisão expressa do administrador: nunca começamos com dados
vazios automaticamente. Se um segundo dispositivo acessar antes da importação no
navegador antigo, não selecione “começar com banco vazio”.

## Dados e sincronização
- `buffet_workspace` usa JSONB e `revision` para impedir sobrescrita silenciosa
  entre duas sessões. Em caso de conflito, exporte backup e recarregue o Neon.
- Admins e operadores trabalham no mesmo espaço de dados, com acesso protegido.
- Vercel Blob privado continua armazenando snapshots assinados, recibos técnicos,
  evidências de auditoria e documentos compartilháveis.
- A aplicação não disponibiliza a string de conexão PostgreSQL no frontend.

## Manutenção e testes
- `node scripts/neon-setup.mjs` — aplica o esquema de forma não destrutiva.
- `node --test scripts/neon-integration.test.mjs` — testa login, roles, sessões,
  criação e desativação de usuários e controle de revisões usando Neon real.
  O teste elimina a conta temporária ao finalizar.
- `npm run build` — valida a aplicação.
- Após conclusão, rotacione a senha PostgreSQL anteriormente compartilhada no chat
  e atualize `DATABASE_URL` da Vercel e do ambiente local.
