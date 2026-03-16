# Next Steps: Deploy to Render 🚀

## Local Status: ✅ Healthy
```
API: http://localhost:3001/healthz → OK
DBs: /healthz/readyz → Connected
Catalog: /v1/catalog → Loaded (seed success)
Web: npm run dev:web → http://localhost:5173/#/menu (full flow works)
```

## 1. GitHub Repo (2min)
```
git init
git add .
git commit -m "SaborReal MVP - Docker/Render ready"
# Create repo at github.com/YOUR/projeto-saborreal (public)
git remote add origin https://github.com/YOUR/projeto-saborreal.git
git branch -M main
git push -u origin main
```

## 2. Render.com Deploy (5min)
1. **render.com** → Sign up (GitHub login)
2. **New** → **Blueprint** → Connect GitHub repo → Select `projeto-saborreal`
3. Auto-deploys: Postgres + API(Docker) + Web(Static apps/web)
4. **Dashboard** → API service → Environment:
   ```
   JWT_SECRET=wf5GtTPC4emH/w77QPZOPY0X6OPVDtj0sQPJM144e2fBC/+tOO7cSzNMNjDy2okKvQqvIms/9PQhZ196kQ3XIg==
   DATABASE_URL=postgresql://[from Postgres service]
   MONGO_URI=  # Optional: Mongo Atlas free
   CORS_ORIGINS=https://saborreal-web.onrender.com
   TRUST_PROXY=true
   DEV_AUTH_ENABLED=false
   ```
5. **Shell** (API service): `npm run db:migrate:prod`
6. **Shell**: `npm run seed:catalog`

## 3. Live URLs
```
API: https://saborreal-api.onrender.com/healthz
Web: https://saborreal-web.onrender.com/#/menu
Admin: #/admin | Courier: #/courier
```

## 4. Verify (Browser/Postman)
```
GET https://saborreal-api.onrender.com/v1/catalog → {ok:true, items:49+, categories:8+}
POST /v1/auth/register → customer account
#/menu → add to cart → POST /v1/orders
```

**Done! MVP live globally. Scale with Redis/queue next.**

Created GitHub? Need `git` help?
