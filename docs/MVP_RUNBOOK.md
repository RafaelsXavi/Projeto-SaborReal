# MVP Runbook (execucao rapida e segura)

Objetivo: colocar um MVP funcional no ar (Web + API + Postgres) com o minimo de risco, validando ponta-a-ponta antes de divulgar.

Este runbook complementa `docs/MVP_DEPLOY_RENDER.md` (politicas/variaveis).

## 0) Escopo do MVP (nao-negociaveis)

- Cliente: ver cardapio -> carrinho -> selecionar entrega -> criar pedido.
- Admin: ver lista -> trocar status (PLACED -> PREPARING -> READY_FOR_PICKUP).
- Motoboy: ver disponiveis -> aceitar -> concluir entrega.
- Infra: healthchecks OK, banco OK, seed aplicado, admin criado.

Se algo disso falhar, nao "compensa no deploy": corrija local primeiro.

## 1) Preflight local (15-30 min)

1) Subir DBs locais e aplicar dados
- `npm run docker:up`
- `npm run db:migrate`
- `npm run seed:catalog`

2) Checks obrigatorios antes do push
- `npm run lint`
- `npm run typecheck`
- `npm test`
- Web: `npm -w @saborreal/web run build`

3) Smoke manual rapido (browser)
- Web: `npm run dev:all` e validar `#/menu`, `#/cart`, `#/orders`, `#/admin`, `#/motoboy`.
- API: validar `GET http://localhost:3001/healthz` e `GET /healthz/readyz`.

## 2) Git + CI (5 min)

1) Subir no GitHub (main)
2) Conferir Actions (`.github/workflows/ci.yml`) verde:
- `npm run ci:check`
- `npm run ci:web:build`

Se CI falhar, nao avance pro Render.

## 3) Render (deploy via Blueprint) (10 min)

1) Atualizar `render.yaml` (repo/urls)
- `repo:` deve apontar para o repo real.
- `CORS_ORIGINS` deve ser o dominio final do Web.

2) No Render:
- New -> Blueprint -> conectar repo -> deploy

3) Environment (API)
- Obrigatorio: `NODE_ENV=production`, `TRUST_PROXY=true`, `DEV_AUTH_ENABLED=false`, `CORS_ORIGINS=https://<web>`
- Segredo: `JWT_SECRET` (forte)
- Banco: `DATABASE_URL` (Render injetado pelo blueprint)

4) Environment (WEB)
- `VITE_API_URL=https://<api>`

## 4) Bootstrap (migrations + seed + 1o admin) (5-10 min)

No Render, abra o Shell do servico `saborreal-api` e rode na ordem:

1) Migrations
- `node apps/api/dist/scripts/migrate.js`

2) Seed do catalogo
- `node apps/api/dist/scripts/seed-catalog.js`

3) Criar admin (1x)
- Setar no Render (temporariamente) as env vars:
  - `BOOTSTRAP_ADMIN_IDENTIFIER` (email ou telefone)
  - `BOOTSTRAP_ADMIN_PASSWORD` (min 8)
- Rodar:
  - `node apps/api/dist/scripts/bootstrap-users.js`
- Remover `BOOTSTRAP_ADMIN_PASSWORD` depois de confirmar o login.

Obs: o script falha se `DEV_AUTH_ENABLED=true` em producao (intencional).

## 5) Validacao em producao (go/no-go) (10 min)

1) Healthchecks
- `GET https://<api>/healthz` -> 200
- `GET https://<api>/healthz/readyz` -> 200

2) Catalogo
- `GET https://<api>/v1/catalog` -> `ok: true`, `items` e `categories`

3) Fluxo end-to-end
- Criar conta customer, login, criar pedido, acompanhar.
- Admin: logar e avancar status ate READY_FOR_PICKUP.
- Motoboy: aceitar e concluir.

## 6) Pos-deploy (primeiras 24h)

- Ativar alertas basicos (uptime check em `/healthz` e `/healthz/readyz`).
- Conferir logs da API (picos de 4xx/5xx, rate-limit, CORS).
- Backups do Postgres (Render geralmente oferece snapshots no plano; confirme).

## 7) Proximos passos (performance + custo)

- Web: remover Tailwind CDN e compilar CSS no build (menos requests e mais previsivel).
- API: habilitar compressao (se o provedor nao fizer) e cache de respostas estaticas (catalog).
- DB: revisar queries/admin e adicionar paginação quando tiver volume.

