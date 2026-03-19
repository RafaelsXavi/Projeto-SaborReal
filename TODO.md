# SaborReal Code Inspection & Improvement Plan

Status: Planning [1/1] | Critical Fixes [4/4] | Tests [1/8] | Perf [0/4] | Cleanup [0/3] | Deploy [0/2]

## 1. PLANNING (Done)
- [x] Inspection checklist & detailed plan created
- [x] Passo 0 definido (Render + politicas) em `docs/MVP_DEPLOY_RENDER.md`

## 2. CRITICAL FIXES
- [x] JWT_SECRET obrigatorio apenas em producao (dev/test tem fallback inseguro) (apps/api/src/config/env.ts)
- [x] Replace remote images with local assets (apps/web/src/pages/MenuPage.tsx)
- [x] Add ErrorBoundary to App.tsx
- [x] Disable devCreateUser in prod (confirm env - already guarded by DEV_AUTH_ENABLED)
- [x] Corrigir desync de roles entre src/dist do shared (prebuild do api + build do shared) (apps/api/package.json, packages/shared/dist)
- [x] Seed do catalogo via CLI + scripts de bootstrap do MVP (apps/api/src/scripts/seed-catalog.ts, docs/MVP_DEPLOY_RENDER.md)

## 3. TESTS (Write first!)
### Backend Unit
- [ ] auth refresh revoke test
- [ ] orders idempotency test
- [ ] catalog seed local imgs

### Smoke
- [x] security.smoke.mjs passa local mesmo sem DB (orders fallback + readyz tolerante)
### Frontend Vitest/RTL
- [ ] Vitest setup (vite.config.test.ts)
- [ ] useCatalog seed fallback test
- [ ] MenuPage add-to-cart test
- [ ] CourierPage role test

## 4. PERFORMANCE
- [ ] Migrate hooks to SWR/TanStack Query
- [ ] Compress assets to WebP
- [ ] Update catalog seed w/ local paths
- [ ] Add prefetch for routes

## 5. CLEANUP
- [ ] Biome fix all lints
- [ ] Remove console.logs (scripts)
- [ ] Accessibility ARIA fixes

## 6. DEPLOY
- [ ] Local full test: docker up + migrate + seed + curl
- [ ] Render deploy verification

Run after each step: `npm -ws run typecheck` + manual test.
