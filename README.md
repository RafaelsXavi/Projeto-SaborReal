# Projeto SaborReal

Monorepo (workspaces) com uma API Node.js/TypeScript focada em isolamento de superfícies (cliente/admin/motoboy) e segurança por padrão.

## Estrutura

- `apps/api`: API Express (v1) com middlewares de segurança, CORS allowlist, rate limit e RBAC por rotas.
- `packages/shared`: tipos/constantes compartilhadas (roles, status do pedido).

## Requisitos

- Node.js 22+
- Docker (opcional, para Postgres + Mongo via `docker compose`)

### Observação (Windows / PowerShell)

Se você receber erro de política de execução ao rodar `npm`, use `npm.cmd`:

- `C:\Program Files\nodejs\npm.cmd run dev`

Ou ajuste a Execution Policy do PowerShell (ex.: `RemoteSigned` no escopo do usuário).

## Configuração

- Copie o arquivo de exemplo:
  - `cp .env.example .env`
- Ajuste `CORS_ORIGINS` com uma lista separada por vírgula (ex.: `http://localhost:5173`).

## Comandos (raiz do repo)

- Dev (API): `npm run dev`
- Build (todos workspaces): `npm run build`
- Typecheck (todos): `npm run typecheck`
- Lint (Biome): `npm run lint`
- Test (smoke de segurança): `npm test`
- Migrations (Postgres): `npm run db:migrate`

## Docker (Postgres + Mongo + API)

- Subir: `npm run docker:up`
- Logs: `npm run docker:logs`
- Status: `npm run docker:ps`
- Descer: `npm run docker:down`

## Endpoints (API)

- `GET /healthz`: liveness (não depende de banco).
- `GET /healthz/readyz`: readiness (retorna `503` se Postgres/Mongo não estiverem configurados).
- `GET /v1/catalog`: retorna `{ items: [] }` (placeholder).
- `POST /v1/orders`: exige role `customer`, header `Idempotency-Key` e CSRF quando usando cookie auth.
- `GET /v1/admin/orders`: exige role `admin` (retorna `401` sem auth).
- `POST /v1/auth/register`: cria conta `customer` (email/telefone + senha).
- `POST /v1/auth/login`: cria sessão (cookies) e emite refresh-token com rotação.
- `POST /v1/auth/refresh`: rotaciona refresh-token e renova access.
- `POST /v1/auth/logout`: revoga refresh atual e limpa cookies.
- `GET /v1/auth/session`: retorna sessão atual (se autenticado).

## Segurança (o que já está implementado)

- `helmet` habilitado e `X-Powered-By` desabilitado.
- CORS por allowlist (`CORS_ORIGINS`), bloqueando origens não permitidas.
- Rate limit global (por IP).
- `X-Request-Id` em requests/respostas e logs estruturados com `pino-http`.
- Respostas de erro minimizadas (detalhes só em log; em produção, `500` não vaza mensagem).

## Estado atual / próximos passos

- Autenticação JWT (HS256) com cookies httpOnly + CSRF (double submit) foi adicionada (ver `JWT_*` no `.env.example`).
- Implementar persistência de pedidos + idempotência no checkout.
- Definir migrations/DDL no Postgres e esquema/coleções no Mongo (sem PII no Mongo).
- Ajustar `trust proxy` no deploy e revisar configurações de cookies/HTTPS.

## Postgres (migrations + smoke test DB)

1) Suba o Postgres (Docker):
- `npm run docker:up`

2) Rode as migrations:
- `npm run db:migrate`
  - Em produção (container): `npm -w @saborreal/api run build` e depois `npm -w @saborreal/api run db:migrate:prod`

3) (Opcional) Smoke test com Postgres (auth real + orders):
- `npm run test:db`

## Frontend (web)

- Dev (web): `npm run dev:web`
- Dev (API + web): `npm run dev:all`

Variáveis (Vite):
- `VITE_API_URL` (default: `http://localhost:3001`) — veja `apps/web/.env.example`.

### UI (protótipo)

O frontend `apps/web` contém um protótipo de telas baseado nos HTMLs de referência, com navegação via hash:

- `#/menu` (Cardápio)
- `#/cart` (Carrinho)
- `#/orders` (Meus Pedidos)
- `#/login` (Login/Cadastro)
- `#/courier` (Entregas/Motoboy)
- `#/admin` (Admin/Painel de Pedidos)

Obs: por enquanto o estilo usa Tailwind via CDN (bom para protótipo). Quando a UI estiver fechada, o ideal é migrar para Tailwind no build do Vite.

