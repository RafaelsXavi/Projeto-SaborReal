# Security Best Practices Report (SaborReal)

Data: 2026-03-19

## Executive summary

O projeto está bem encaminhado em **headers (Helmet)**, **CORS allowlist**, **JWT/cookies httpOnly**, **CSRF (double-submit)**, **rate limit global** e **logging com redaction**.

O maior risco atual no MVP é o **frontend carregar scripts de terceiros via CDN sem SRI/CSP** (supply-chain/XSS) e, por consequência, qualquer token acessível ao JS (como CSRF em `sessionStorage`) fica exposto se ocorrer XSS. Em paralelo, havia um ponto funcional/segurança crítico de **CSRF em ambiente com subdomínios** (web/api em `*.onrender.com`) que foi endereçado retornando o token no corpo das respostas de auth e persistindo no browser.

## Critical

### [C-01] CSRF em arquitetura multi-subdomínio (web/api) precisava de token legível no frontend

**Impacto:** sem o token, requests state-changing com cookie-auth falham (ou equipes acabam desabilitando CSRF para “fazer funcionar”).

**Evidência (API):** token agora é emitido e retornado em `login/refresh/session`.  
- `C:\Users\-PC-\Desktop\Projeto-SaborReal\apps\api\src\modules\auth\auth.controller.ts` linhas 150, 196, 270, 313.

**Evidência (API middleware):** validação double-submit continua ativa (cookie == header).  
- `C:\Users\-PC-\Desktop\Projeto-SaborReal\apps\api\src\modules\auth\auth.middleware.ts` linha 40+ (uso de `x-csrf-token`).

**Evidência (Web):** token é persistido em `sessionStorage` e enviado via header `X-CSRF-Token`.  
- `C:\Users\-PC-\Desktop\Projeto-SaborReal\apps\web\src\api.ts` linhas 59–75 e 100.

**Recomendação:** manter CSRF ativo e (para produção) reduzir ao máximo risco de XSS (ver [H-01]).

## High

### [H-01] Script de terceiros via CDN sem SRI/CSP (supply-chain/XSS)

**Impacto:** se o CDN ou a cadeia de dependências for comprometida, o atacante executa JS no seu domínio (rouba sessão/CSRF, faz ações como admin).

**Evidência:** Tailwind Play CDN carregado por `<script>` no HTML.  
- `C:\Users\-PC-\Desktop\Projeto-SaborReal\apps\web\index.html` linha 9.

**Recomendação (MVP):**
- Remover Tailwind CDN e migrar para Tailwind no build do Vite (CSS gerado no build).
- Se mantiver terceiros, considerar CSP e/ou SRI (onde aplicável) e reduzir dependências externas.

### [H-02] IDs de itens de catálogo devem ser não-adivinháveis e collision-safe

**Impacto:** IDs previsíveis facilitam enumeração e colisões; IDs fracos quebram consistência.

**Status:** padronizado para `randomUUID()` no repositório Postgres.

## Medium

### [M-01] Brute force e abuse em endpoints de auth

**Impacto:** ataques de força bruta em `/v1/auth/login` e enumeração.

**Estado:** existe rate limit global, mas recomenda-se limites mais estritos por rota (ex.: login/register/refresh) e eventualmente “slowdown” progressivo.

### [M-02] Segredos e variáveis de produção

**Impacto:** comprometimento de JWT e contas se `JWT_SECRET` fraco/vazado.

**Recomendação:** manter `JWT_SECRET` forte no Render; evitar expor `.env`; rotacionar segredos após qualquer vazamento.

## Low / hygiene

### [L-01] Dependências externas (fonts) e privacidade

**Evidência:** Google Fonts no web.  
- `C:\Users\-PC-\Desktop\Projeto-SaborReal\apps\web\index.html` linhas 11 e 15.

**Recomendação:** se necessário por privacidade/performance, self-host de fontes e cache.

