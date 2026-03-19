# Render - template de env vars (MVP)

Use este arquivo como checklist ao configurar o service `saborreal-api` e `saborreal-web` no Render.

## API (`saborreal-api`)

Obrigatorias:
- `NODE_ENV=production`
- `JWT_SECRET=<gerar um valor forte (32+ bytes)>`
- `DATABASE_URL=<injetado pelo blueprint (Postgres)>`
- `TRUST_PROXY=true`
- `DEV_AUTH_ENABLED=false`
- `CORS_ORIGINS=https://<NOME-DO-WEB>.onrender.com`

Recomendadas:
- `LOG_LEVEL=info`
- `PG_SSL=true`
- `PG_SSL_REJECT_UNAUTHORIZED=true`

Bootstrap (temporario; remover depois):
- `BOOTSTRAP_ADMIN_IDENTIFIER=<email ou telefone>`
- `BOOTSTRAP_ADMIN_PASSWORD=<min 8 chars>`
- (opcional) `BOOTSTRAP_MOTOBOY_IDENTIFIER=<email/telefone>`
- (opcional) `BOOTSTRAP_MOTOBOY_PASSWORD=<min 8 chars>`

## WEB (`saborreal-web`)

- `VITE_API_URL=https://<NOME-DA-API>.onrender.com`

