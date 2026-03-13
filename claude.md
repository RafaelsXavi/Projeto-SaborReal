# Projeto SaborReal (AI Guide)

## Prioridade
Este projeto deve sempre priorizar isolamento e seguranca antes de novas features.

## Superficies (isolamento)
- Cliente: app publico para navegar cardapio, carrinho, checkout e acompanhar pedidos.
- Admin: painel privado para operacao (fila de pedidos, status, cardapio).
- Motoboy (courier): app privado para aceitar entregas e ver endereco apenas do pedido atribuido.

Regra: nunca confiar no frontend para autorizacao. Toda regra de acesso e filtragem de dados acontece no servidor.

## Autorizacao (RBAC)
Roles suportadas:
- customer
- admin
- courier

Principio do minimo privilegio:
- admin ve pedidos e operacao, mas nao deve expor PII desnecessaria.
- courier so pode listar pedidos disponiveis e, apos aceitar, ver somente dados minimos do cliente (endereco e referencia).
- customer so ve seus proprios pedidos e enderecos.

## Dados sensiveis (PII)
Enderecos, telefones e nomes sao PII.
- Nunca retornar PII em endpoints publicos.
- Nunca incluir PII em logs.
- Auditar transicoes de status e acessos relevantes.

## API conventions
- Versao: rotas em `/v1`.
- Erros: mensagens genericas para o cliente em producao; detalhes apenas em logs.
- Validacao: todo input deve ser validado (ex: Zod) antes de tocar dominio/banco.
- Idempotencia: checkout/criacao de pedido deve suportar idempotency key.

## Pedido (estados)
Estados sugeridos:
- PLACED
- PREPARING
- READY_FOR_PICKUP
- OUT_FOR_DELIVERY
- COMPLETED
- CANCELLED

Atribuicao do motoboy (accept) deve ser atomica.

## Execucao (monorepo)
- `npm run dev` roda a API.
- Workspace: `apps/*` e `packages/*`.

## Estrutura
- `apps/api`: API Express com middlewares de seguranca e RBAC.
- `packages/shared`: tipos/constantes compartilhadas (roles, order status).

## Checklist de seguranca (antes de deploy)
- HTTPS, cookies HttpOnly e SameSite, CORS estrito.
- Rate limit em auth e endpoints de escrita.
- Helmet habilitado.
- `trust proxy` configurado corretamente em producao.
- Secrets somente via env (nunca commitar `.env`).

## Estado atual (importante)
- Auth ainda e um stub: a API usa `requireAuth()` / `requireRole()`, mas `req.auth` nao e populado (falta implementar sessao/JWT + middleware).
- Smoke tests de seguranca existem em `apps/api/test/security.smoke.mjs` e rodam via `npm test`.

## Bancos (Postgres + Mongo)
- Postgres: fonte de verdade para autenticacao, usuarios, enderecos (PII), pedidos, itens do pedido, historico/auditoria.
- Mongo: somente dados sem PII (ex: catalogo/cardapio, configuracoes de apresentacao). Nunca persistir endereco/telefone/nome do cliente no Mongo.

Regras:
- Nao duplicar PII entre bancos.
- Todas as consultas ao Mongo devem ser por IDs/keys nao sensiveis.
- Eventos/auditoria e trilha de status devem ficar no Postgres.
