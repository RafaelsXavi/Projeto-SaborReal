# MVP SaborReal (Render) - Passo 0

Este documento e a "fonte da verdade" para configuracao e politicas de producao.

## Alvo

- Plataforma: Render
- Servicos:
  - `saborreal-api` (Docker, Node/Express)
  - `saborreal-postgres` (Render Postgres)
  - `saborreal-web` (Static Site)

## Dominios (preencher)

- Web (Render static): `https://saborreal-web.onrender.com`
- API (Render web): `https://saborreal-api.onrender.com`

## DATABASE_URL (Render Postgres): interna vs externa

O Render fornece duas URLs do Postgres:

- **Internal Database URL**: use no ambiente do **servico `saborreal-api`** no Render (mais rapido e feito para trafego interno).
- **External Database URL**: use para rodar comandos a partir do seu PC (migrations/seed local) ou de fora do Render.

Regra pratica:
- Dentro do Render (API): `DATABASE_URL = INTERNAL_DATABASE_URL`
- Local (se precisar apontar para o Render): use `EXTERNAL_DATABASE_URL` + `PG_SSL=true`

## Variaveis de Ambiente (API)

Obrigatorias:
- `NODE_ENV=production`
- `JWT_SECRET=<forte, 32+ bytes>`
- `DATABASE_URL=<Render Postgres connection string>`
- `TRUST_PROXY=true`
- `DEV_AUTH_ENABLED=false`
- `CORS_ORIGINS=<WEB_URL>`

Recomendadas:
- `LOG_LEVEL=info`
- `PG_SSL=true` (para conexoes externas ao Render; seguro deixar true em producao)
- `PG_SSL_REJECT_UNAUTHORIZED=true` (padrao)

Nao usar em producao:
- Qualquer fallback de auth/dev endpoints sem protecao.

## Variaveis de Ambiente (WEB)

- `VITE_API_URL=<API_URL>`

## Politicas de Producao (MVP)

- Cookies: `credentials: include` no frontend (ja esta em `apps/web/src/api.ts`).
- CSRF: obrigatorio para metodos unsafe (POST/PATCH/PUT/DELETE).
- CORS: allowlist estrita com `CORS_ORIGINS` apontando para o dominio do web.
- Proxy: `TRUST_PROXY=true` para cookies/secure/ips corretos atras do Render.
- `DEV_AUTH_ENABLED=false` sempre.

## Bootstrap de usuarios (admin/courier)

Estrategia escolhida: **script CLI** (sem endpoint de dev em producao).

Scripts (workspace `@saborreal/api`):
- Dev/local: `npm -w @saborreal/api run bootstrap:users`
- Producao (apos build): `npm -w @saborreal/api run bootstrap:users:prod`

Variaveis exigidas para rodar:
- `BOOTSTRAP_ADMIN_IDENTIFIER` (email ou telefone)
- `BOOTSTRAP_ADMIN_PASSWORD`

Opcionais:
- `BOOTSTRAP_MOTOBOY_IDENTIFIER`
- `BOOTSTRAP_MOTOBOY_PASSWORD`

Alias (legado, nao recomendado):
- `BOOTSTRAP_COURIER_IDENTIFIER`
- `BOOTSTRAP_COURIER_PASSWORD`

Comportamento:
- Idempotente: se usuario existir com o mesmo role, apenas confirma.
- Se usuario existir com role diferente, falha (evita escalacao acidental).

## Checklist Passo 0 (concluido quando preencher)

- [ ] Preencher `WEB_URL` (para `CORS_ORIGINS`)
- [ ] Definir `JWT_SECRET` (e armazenar com seguranca)
- [ ] Confirmar se Postgres exige `PG_SSL=true`
- [x] Confirmar estrategia de bootstrap (admin/courier): script CLI

## Seed do catalogo (cardapio)

Scripts (workspace `@saborreal/api`):
- Dev/local: `npm -w @saborreal/api run seed:catalog`
- Producao (apos build): `npm -w @saborreal/api run seed:catalog:prod`

Observacoes:
- Idempotente via UPSERT (nao apaga itens existentes).
- Exige migrations aplicadas (tabelas `catalog_categories` e `catalog_items`).

## Comando unico (migrate + seed + bootstrap)

- Dev/local: `npm -w @saborreal/api run mvp:bootstrap`
- Producao (apos build): `npm -w @saborreal/api run mvp:bootstrap:prod`
