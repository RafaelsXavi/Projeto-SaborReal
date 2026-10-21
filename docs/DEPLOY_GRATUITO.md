# Deploy gratuito para apresentação

Configuração: API Docker no plano Free do Render, frontend estático no Render e Postgres no plano Free do Neon. O `render.yaml` não provisiona banco pago.

Limites e planos devem ser conferidos antes da criação:
- https://render.com/docs/free (API adormece após inatividade; Postgres grátis do Render expira em 30 dias).
- https://neon.com/pricing (respeitar cotas do plano Free).

1. Criar o banco no Neon e guardar a connection string como segredo.
2. Publicar os fontes atualizados em um repositório GitHub. Esta cópia local foi recebida sem `.git`; não sobrescrever um repositório existente sem conferir seu estado.
3. Criar um Blueprint no Render com `render.yaml`. Informar `DATABASE_URL` do Neon. Conferir que a API está no plano Free e o frontend é estático.
4. Ajustar `CORS_ORIGINS` para a URL exata do frontend e `VITE_API_URL` para a URL exata da API. Recompilar o frontend após qualquer mudança desta variável; o build atualiza a CSP com a origem configurada.
5. Manter `DEV_AUTH_ENABLED=false`, `TRUST_PROXY=true`, `PG_SSL=true` e o `JWT_SECRET` gerado pelo provedor.
6. Rodar migrations, seed e bootstrap a partir de uma máquina com acesso ao banco (o plano gratuito não depende de shell remoto):

```powershell
# Configurar DATABASE_URL e os segredos de bootstrap no ambiente da sessão.
npm.cmd -w @saborreal/api run db:migrate
npm.cmd -w @saborreal/api run seed:catalog
npm.cmd -w @saborreal/api run bootstrap:users
```

Não gravar senhas ou connection strings no repositório. Remover as variáveis de senha do bootstrap após criar os usuários.

Validar `/healthz`, `/healthz/readyz` e o fluxo cadastro → pedido → admin → entrega → acompanhamento. Usar dados fictícios na apresentação. Abrir o sistema antes de apresentar para aguardar a inicialização da API gratuita.

A publicação só está concluída quando as URLs reais e esses fluxos forem verificados.
