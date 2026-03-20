# Deploy to Render (MVP)

Este repo já vem com `render.yaml` (Blueprint).

Para o passo-a-passo “sem pular etapa”, veja:
- `docs/MVP_RUNBOOK.md`
- `docs/MVP_DEPLOY_RENDER.md`
- `docs/RENDER_ENV_TEMPLATE.md`

## 1) GitHub (repo)

Repo: `https://github.com/RafaelsXavi/Projeto-SaborReal`

## 2) Render (Blueprint)

1. Render → New → Blueprint → selecione o repo acima
2. O `render.yaml` cria: Postgres + `saborreal-api` (Docker) + `saborreal-web` (Static)
3. Após o Web subir, ajuste `CORS_ORIGINS` na API para o domínio real do Web
4. Garanta que `VITE_API_URL` (no Web) aponte para a API e que o CSP do Web permita esse domínio (ver `apps/web/index.html`)

## 3) Bootstrap (no Shell da API)

Rode nessa ordem:

1. Migrations:
- `node apps/api/dist/scripts/migrate.js`

2. Seed do catálogo:
- `node apps/api/dist/scripts/seed-catalog.js`

3. Criar admin (1x):
- setar `BOOTSTRAP_ADMIN_IDENTIFIER` e `BOOTSTRAP_ADMIN_PASSWORD` (temporário)
- `node apps/api/dist/scripts/bootstrap-users.js`
- remover `BOOTSTRAP_ADMIN_PASSWORD` depois de validar o login

## 4) Validar (go/no-go)

- `GET https://<api>/healthz` → 200
- `GET https://<api>/healthz/readyz` → 200
- Web: `https://<web>/#/menu`
- Admin: `#/admin` | Motoboy: `#/motoboy`
