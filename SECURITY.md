# Segurança do Buffet Akela

## Autenticação e acesso

- Senhas individuais são derivadas com scrypt e sal aleatório. `ADMIN_PASSWORD` serve apenas ao cadastro inicial; não redefine a senha de contas existentes.
- Em produção, a sessão usa cookie `__Host-akela_session`, `Secure`, `HttpOnly` e `SameSite=Strict`, sem atributo `Domain`.
- A emissão da sessão bloqueia a linha da conta e confirma novamente seu hash de senha e estado ativo. Troca de senha e emissão concorrentes não deixam uma sessão antiga válida.
- Login tem orçamento atômico por IP e por conta. Usuário e e-mail da mesma conta compartilham o limite. O bloqueio temporário dura 15 minutos e tentativas durante o bloqueio não o prolongam.
- Mudanças de senha também limitam tentativas. Alterações de senha, e-mail, perfil ou estado da conta revogam suas sessões.
- Requisições administrativas autenticadas e eventos de autenticação são registrados em `buffet_security_events`, sem senhas, tokens, conteúdo dos contratos ou dados dos clientes.

## Código de acesso por e-mail

Configure `ADMIN_EMAIL_SMTP_KEY` como segredo de produção, `ADMIN_EMAIL_SMTP_USER` com o login SMTP do Brevo e `ADMIN_EMAIL_FROM` com o remetente verificado. O envio usa TLS na porta 465. O Brevo aplica regras de IP separadas para SMTP e API. Depois publique novamente e confira `emailLoginConfigured` em `GET /api/session`. Essa configuração é exclusiva do login administrativo. [Envio SMTP no Brevo](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP).

Com o envio configurado, as contas com e-mail cadastrado e sem aplicativo ativo confirmam a senha com um código por e-mail. O código vale por cinco minutos, é de uso único e fica vinculado ao navegador e à conta. Em **Minha conta**, o usuário pode configurar o aplicativo autenticador. A confirmação da configuração troca o método dos próximos logins, revoga as outras sessões e gera os códigos de recuperação.

Contas com aplicativo já ativo continuam usando o aplicativo. Para transferir uma conta existente ao e-mail, confirme o endereço com o responsável e valide o envio antes de remover o fator anterior e revogar suas sessões.

## Conteúdo e documentos

- HTML de contratos e adendos passa pelo sanitizador com lista de elementos e atributos permitidos. O conteúdo dos documentos existentes não é truncado durante a exibição.
- A política de segurança do navegador bloqueia scripts externos e scripts inline, formulários externos, objetos e incorporação do site em outros sites. Imagens e operações de PDF usam recursos locais, `data:` ou `blob:`.
- `Referrer-Policy: no-referrer` evita enviar links privados dos documentos no cabeçalho de navegação a outros sites.
- APIs públicas aceitam somente tokens com o formato gerado pela aplicação. Rotas administrativas exigem sessão validada no servidor.
- Os links de assinatura e orçamento continuam sendo credenciais de acesso ao documento. Quem já os copiou pode continuar abrindo os documentos correspondentes.

## Banco e implantação

Antes de publicar em um banco existente, aplique `scripts/email-login-schema.sql` após o esquema base `scripts/neon-schema.sql`, com uma credencial de manutenção. A migração adiciona colunas e valida as restrições dos desafios de login sem reescrever os cadastros.

Em produção, `DATABASE_URL` deve usar um papel exclusivo da aplicação, sem propriedade dos objetos ou permissão de criar objetos no esquema público. Ele precisa de:

- `USAGE` no esquema `public`;
- `SELECT, INSERT, UPDATE` em `buffet_workspace` e `buffet_users`;
- `SELECT, INSERT, UPDATE, DELETE` em `buffet_sessions` e `buffet_login_attempts`;
- somente `INSERT` em `buffet_security_events` e `USAGE` em sua sequência.

A aplicação não deve receber a credencial do dono do banco. Migrações e leitura dos registros de segurança usam uma credencial de manutenção separada. Guarde os registros fora do alcance de escrita da aplicação e defina sua retenção operacional.

Para encerrar todos os acessos existentes, revogue as linhas de `buffet_sessions`. Rotacione `ADMIN_SESSION_SECRET` e publique novamente se o segredo de sessão também estiver comprometido. Não substitua `SIGNATURE_AUDIT_SECRET` sem uma estratégia que preserve a verificação dos documentos já assinados.

## Verificações

```sh
npm ci --ignore-scripts
npm audit
npm run build
node --test scripts/audit-evidence.test.mjs scripts/receipts.test.mjs scripts/security.test.mjs
```

O teste de HTML usa `google-chrome` (ou `CHROME_BIN`). Para testar a autenticação contra PostgreSQL, forneça `SECURITY_TEST_DATABASE_URL` com uma credencial de teste autorizada e execute `node --test scripts/mfa-db.test.mjs`. O teste cria um esquema privado com nome aleatório, usa conexões reais concorrentes e elimina o esquema ao finalizar; não usa as tabelas públicas da aplicação.

Referências: [autenticação OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [política de segurança de conteúdo OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).
