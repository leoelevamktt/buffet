# Dois fatores no painel do Buffet Akela

## Objetivo e decisão do titular

Após um incidente de acesso indevido, o titular pediu autenticação em dois fatores para entrar no painel. Escolheu aplicativo autenticador e solicitou controle individual sobre a ativação dos usuários para impedir que uma pessoa com a senha roubada vincule seu próprio app. Escolheu explicitamente **2FA obrigatório para todos com convite individual**. O cadastro será autorizado individualmente por convite; não haverá dispensa de segundo fator no painel.

## Alternativas examinadas

- **Aplicativo autenticador (escolhido):** códigos TOTP de seis dígitos, compatíveis com autenticadores comuns, sem serviço externo de envio. Requer cadastrar o app de cada titular e guardar códigos de recuperação.
- **Código por e-mail:** exigiria configurar um serviço de envio atualmente ausente e dependeria da segurança e disponibilidade do e-mail. Não foi escolhido.

## Experiência do usuário

1. O usuário informa seu login e a senha atual.
2. Se ainda não cadastrou o segundo fator, o usuário também precisa de um convite de ativação emitido por um administrador já protegido. Somente após validar senha e convite o painel apresenta um QR Code e uma chave manual. O usuário adiciona a conta ao autenticador e informa o código gerado. Os dados administrativos permanecem bloqueados até essa confirmação.
3. A ativação exibe oito códigos de recuperação, uma única vez, para copiar ou baixar. Cada código permite uma recuperação e não deve ser compartilhado. Depois o usuário abre o painel.
4. Nos próximos logins, a senha é seguida do código do aplicativo. Um código aceito não pode ser reutilizado, mesmo em outra tentativa simultânea.
5. Se perder ou trocar o celular, o usuário informa a senha e um código de recuperação. Antes de voltar ao painel, cadastra e confirma um novo autenticador. Esse processo substitui os códigos de recuperação anteriores e encerra as sessões anteriores.
6. Em Minha conta, será possível gerar novos códigos de recuperação mediante senha atual e código do autenticador. Não haverá opção para dispensar uma conta do segundo fator obrigatório.
7. Na área Usuários, somente um administrador já autenticado com 2FA poderá autorizar a primeira vinculação e emitir ou substituir um convite de ativação. A operação exigirá nova confirmação de senha e segundo fator. O convite será aleatório, associado a uma conta específica, de uso único, com validade de 30 minutos e exibido apenas na emissão. Gerar outro invalida o anterior. O administrador entrega o convite ao titular por um canal conhecido; não haverá envio automático para um endereço cadastrado que possa ter sido alterado no incidente.

Os titulares cadastram seus próprios autenticadores. Publicar a funcionalidade não equivale a ativar um fator real em nome deles. As contas existentes precisarão concluir esse cadastro na próxima entrada.

A primeira conta administrativa protegida precisa ser autorizada fora do painel, com os acessos de infraestrutura já autorizados pelo titular. O titular escolherá essa conta e receberá um convite de ativação por canal separado do login da plataforma. Não haverá um cadastro inicial público que confie somente na senha. Depois dessa vinculação, a administração de usuários e dos convites exigirá um administrador protegido; o último administrador protegido não poderá perder sua proteção por uma operação comum do painel.

## Proteção do acesso

- Senha correta, sozinha, não cria uma sessão administrativa.
- Senha correta também não autoriza cadastrar ou substituir um autenticador: a primeira vinculação precisa do convite individual e as substituições precisam do fator atual ou de um código de recuperação.
- A autorização do convite será vinculada à tentativa de cadastro pendente e conferida novamente ao confirmar o código do app. Substituir o convite invalida as tentativas pendentes vinculadas ao anterior, inclusive QR Codes já apresentados.
- A primeira etapa cria apenas uma identificação temporária, válida por cinco minutos, em cookie protegido. Ela não autoriza workspace, usuários, finanças ou operações administrativas.
- A identificação temporária é aleatória; somente seu HMAC é armazenado. Ela fica vinculada à conta, à versão do fator e a uma impressão criptográfica da senha verificada. Troca de senha, desativação ou troca do fator invalida sua utilização.
- Cada identificação aceita no máximo cinco tentativas de segundo fator. Haverá também limitação persistente por conta, compartilhada entre tentativas e navegadores.
- A conclusão usa uma transação e bloqueio da conta. Código TOTP repetido e código de recuperação concorrente não podem emitir duas sessões.
- Sessões administrativas guardam a confirmação de MFA e a versão do fator. Toda API privada confere esses campos no servidor. Sessões anteriores à implantação deixam de autorizar acesso.

## Dados e implementação

O projeto usa React, Node e PostgreSQL. O fluxo será integrado às rotas e aos componentes existentes, com a mesma linguagem visual do painel.

- `POST /api/session`: verifica a senha e cria a identificação temporária, sem liberar dados.
- `GET /api/session`: informa o estado anônimo, a etapa de autenticação pendente ou a sessão plenamente autenticada.
- `DELETE /api/session`: encerra a sessão e cancela a identificação temporária.
- `GET /api/mfa`: devolve a etapa atual; QR Code e chave manual só são disponibilizados para um cadastro pendente autorizado pela primeira etapa.
- `POST /api/mfa`: confirma cadastro, confirma segundo fator, utiliza recuperação ou regenera códigos após nova verificação das credenciais. A conta é identificada pelo cookie, sem confiar em um identificador enviado pelo navegador.

O servidor usará uma biblioteca mantida para TOTP e uma biblioteca local de QR Code. O QR Code não será enviado a um gerador externo. Segredos TOTP serão cifrados com AES-256-GCM e uma nova chave de produção, `MFA_ENCRYPTION_KEY`, independente do segredo de sessão. A autenticação da cifra ficará vinculada à conta para impedir a troca de segredos entre usuários. Códigos de recuperação serão aleatórios, com 96 bits, e armazenados somente como hashes associados à conta.

A conta recebe campos de segredo cifrado, versão, data de ativação e último contador TOTP aceito. As sessões recebem versão e data de confirmação de MFA. Serão adicionadas tabelas para identificações temporárias, convites de ativação e códigos de recuperação. Convites ficam armazenados somente como hashes; não serão retornados em listagens de usuários. A migração será aditiva, sem alterações nos cadastros comerciais ou documentos assinados.

O papel restrito usado pela aplicação receberá apenas as permissões necessárias às tabelas novas. Os registros de segurança continuarão sem senhas, códigos, QR Codes, chaves manuais ou tokens. Os eventos de cadastro, falha, confirmação, recuperação e renovação de códigos serão registrados.

## Recuperação e prevenção de bloqueio do titular

- Cadastro incompleto não ativa um fator nem apaga um fator anterior. Expirar a primeira etapa exige repetir o login.
- Usar recuperação exige a senha e um código válido, consumido uma única vez. O acesso aos dados só volta após confirmar o novo autenticador.
- Novos códigos de recuperação substituem todos os anteriores. A tela explica que precisam ser guardados novamente.
- Sem o celular e sem códigos de recuperação, o titular precisará de uma recuperação manual autorizada na infraestrutura. Não será criado um atalho público para desligar o segundo fator.
- A chave de cifra deverá ser preservada na manutenção e não poderá ser substituída sem um plano de migração dos segredos.

## Escopo de alterações

Backend: sessão, validação central das APIs privadas, rota de MFA, migração e permissões PostgreSQL, registros de segurança. Frontend: entrada do painel, etapas de cadastro/código/recuperação, gestão dos códigos em Minha conta e estilos acessíveis. Verificações: testes existentes de autenticação, novos testes criptográficos e de transações concorrentes, testes de interface e publicação automática. As rotas públicas dos clientes serão verificadas para continuar operacionais.

## Verificação e publicação

Os testes usarão contas fictícias em um esquema PostgreSQL privado e descartável. Serão verificados códigos válidos, inválidos, expirados e reutilizados; cadastro bloqueado com senha apenas; convite válido, expirado, substituído, reutilizado ou destinado a outra conta; administração de convites bloqueada sem 2FA; acesso privado bloqueado antes da autenticação completa; disputa entre duas confirmações; recuperação de uso único; alterações de senha e do fator durante autenticação; segredos ausentes ou inválidos; ausência de dados sensíveis nos retornos e nos registros; preservação dos dados de negócio.

A migração e a chave secreta serão preparadas antes da publicação. O código será revisado, compilado, salvo no GitHub e publicado na Vercel. Será conferido o bloqueio do acesso administrativo incompleto e a continuidade dos documentos públicos. A ativação nas contas reais será feita pelos respectivos titulares com seus celulares; não serão gerados fatores reais para simular essa ativação.

## Limites conhecidos

TOTP melhora a proteção contra senha roubada, mas não impede toda forma de phishing ou comprometimento do dispositivo. A primeira vinculação depende da senha atual e de um convite de ativação recebido por canal separado, além da confirmação do código do app. Um convite interceptado junto com a senha ainda permite disputar a vinculação; por isso ele é individual, expira e só pode ser utilizado uma vez. Dois fatores no painel não elimina cópias de dados já feitas pelo invasor.

Referências: [MFA OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), [OTPAuth](https://github.com/hectorm/otpauth), [geração local de QR Code](https://github.com/soldair/node-qrcode).
