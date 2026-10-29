# Criptografia dos dados do painel

O campo `buffet_workspace.data` é cifrado pela aplicação com AES-256-GCM. `WORKSPACE_ENCRYPTION_KEY` é uma chave aleatória independente da senha mestra, fornecida somente ao servidor. O painel recebe os dados legíveis depois da autenticação e da autorização existentes. Senhas das contas permanecem protegidas por hash; os segredos do autenticador usam outra chave. Os arquivos privados de contratos no Blob e os metadados de acesso ficam fora deste envelope.

## Chave e recuperação

Guarde uma cópia da chave em um cofre seguro separado do banco. A Vercel não revela novamente um segredo sensível. Perder a chave impede ler dados e backups cifrados; não é possível recuperá-los com a senha mestra. Nunca inclua a chave em commits, logs, mensagens ou arquivos públicos.

Os scripts de recuperação aceitam dados cifrados quando a chave é fornecida pela variável `WORKSPACE_ENCRYPTION_KEY` ou pelo `.env.local` protegido. O backup produzido pela migração conserva a estrutura `tables.buffet_workspace`, compatível com os scripts de recuperação. Backups históricos podem conter conteúdo legível e exigem proteção própria.

## Publicação e migração

1. Configure `WORKSPACE_ENCRYPTION_KEY` como segredo de produção na Vercel, mantendo a mesma chave em futuras publicações.
2. Publique a versão compatível com dados antigos e cifrados. Confirme que `GET /api/session` retorna `dataProtectionConfigured: true` e verifique o acesso do painel. A partir dessa versão, novas gravações são cifradas.
3. Execute `scripts/encrypt-workspace.mjs` com `MFA_DATABASE_URL`, `WORKSPACE_KEY_FILE` e `WORKSPACE_BACKUP_FILE` apontando para arquivos e credenciais privados. O script compara uma verificação criptográfica da chave local com a da versão ativa, sem exibir a chave. A migração bloqueia a linha, valida a descriptografia, cria backup cifrado exclusivo e só então confirma a atualização. Se uma gravação já tiver cifrado a linha, valida e cria backup sem alterar os dados.
4. Verifique a leitura no painel e a estrutura cifrada no banco. Não faça rollback para uma versão anterior à criptografia: ela não compreende o conteúdo cifrado. Para recuperação, use a versão compatível e a chave preservada.

Gravações com a chave errada são recusadas antes de substituir dados existentes. A migração preserva o conteúdo e incrementa a revisão quando altera o registro, evitando sobrescrever edições concorrentes.
