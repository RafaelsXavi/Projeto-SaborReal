# Publicar SaborReal na Vercel com Neon

## Vercel: um único projeto

Importe `RafaelsXavi/Projeto-SaborReal` pelo site da Vercel após incorporar a atualização de deploy no GitHub.

- Root Directory: raiz do repositório (`./`), não `apps/web`.
- Framework: Vite.
- Node.js: 22.x.
- A instalação, build e pasta de saída estão declarados no `vercel.json` da raiz.
- Frontend e API usam o mesmo domínio. Não definir `VITE_API_URL` para este modelo: o frontend usa sua própria origem, e `/v1/*` e `/healthz` são encaminhados à função Express.
- Os arquivos `apps/*/vercel.json` são configurações antigas de projetos separados e não são usados neste modelo.

## Variáveis privadas antes do primeiro deploy

Configure no painel da Vercel, em Environment Variables (Production):

| Nome | Valor |
| --- | --- |
| `DATABASE_URL` | URL pooled do Neon (host com `-pooler`), obtida em Connect |
| `JWT_SECRET` | Segredo aleatório com pelo menos 32 bytes, gerado e guardado em gerenciador de senhas |
| `DEV_AUTH_ENABLED` | `false` |
| `TRUST_PROXY` | `true` |
| `PG_SSL` | `true` |
| `PG_SSL_REJECT_UNAUTHORIZED` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `CORS_ORIGINS` | Origem exata do site, por exemplo `https://seu-projeto.vercel.app` |

O runtime de produção define `NODE_ENV=production`. Não usar prefixo `VITE_` em segredos. Não configurar `COOKIE_DOMAIN`; os cookies ficam restritos ao domínio do aplicativo. Neon Auth não é usado pelo login atual.

Se a URL definitiva ainda não estiver disponível, faça o primeiro deploy e atualize `CORS_ORIGINS` assim que ela for conhecida; faça redeploy antes de testar login. Não reutilize o banco de produção em previews de terceiros.

## Preparar o banco pelo computador

Crie `apps/api/.env`, ignorado pelo Git, a partir do `.env.example` da raiz. Os scripts npm executam dentro de `apps/api`, onde o dotenv procura esse arquivo. Informe nele `DATABASE_URL`, `PG_SSL=true` e os parâmetros de bootstrap. Use a URL direta do Neon para migrations. Nunca envie o conteúdo desse arquivo ao chat ou ao GitHub.

```powershell
npm.cmd ci
npm.cmd -w @saborreal/api run db:migrate
npm.cmd -w @saborreal/api run seed:catalog
npm.cmd -w @saborreal/api run bootstrap:users
```

O bootstrap exige `BOOTSTRAP_ADMIN_IDENTIFIER` e `BOOTSTRAP_ADMIN_PASSWORD` e aceita `BOOTSTRAP_MOTOBOY_IDENTIFIER` e `BOOTSTRAP_MOTOBOY_PASSWORD`. Use identidades fictícias na demonstração e senhas únicas. Remova as senhas de bootstrap do ambiente após criar os usuários. O cliente pode ser cadastrado pela tela de login.

## Verificação após deploy

1. `/healthz` deve retornar 200 e `/healthz/readyz` deve retornar 200 com banco conectado.
2. Cadastrar cliente, entrar, calcular frete e criar pedido.
3. Entrar como administrador, acompanhar pedido e avançar até pronto para retirada.
4. Entrar como motoboy, aceitar e concluir entrega.
5. Conferir status com o cliente e verificar a assinatura Xavier Tech & Dev em telas pequenas e grandes.

Imagens do catálogo podem usar os arquivos já incluídos em `/images/` ou URLs HTTPS públicas. O botão de upload antigo chamava uma rota inexistente e foi removido; envio de arquivos exigirá armazenamento persistente próprio.

O worker contínuo de auditoria (`dev:worker`) não é executado pela função da Vercel. Os jobs de auditoria podem ficar pendentes neste modelo; não apresentar esse processamento como validado. O fluxo de pedidos precisa ser conferido separadamente no banco real.

## Referências

- https://vercel.com/docs/functions
- https://vercel.com/docs/monorepos
- https://neon.com/docs/connect/connection-pooling

