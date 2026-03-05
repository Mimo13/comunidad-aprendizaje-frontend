# Frontend Worker (Cloudflare)

Este proyecto contiene solo el frontend de la aplicación:
- SPA React + Vite en `src/`
- Worker Cloudflare en `worker/index.ts`
- Configuración de despliegue en `wrangler.jsonc`

## Uso

```bash
npm ci
npm run dev
```

Para `wrangler dev`, crea `.dev.vars` a partir de `.dev.vars.example`.

## Build

```bash
npm run build
```

## Deploy a Cloudflare Workers

```bash
npm run cf:deploy
```

El worker sirve los assets de `dist/` y reenvía `/api/*` al backend configurado con `BACKEND_URL` en `wrangler.jsonc`.

Además, reenvía:
- `/health` -> `BACKEND_URL/health`
- `/uploads/*` -> `BACKEND_URL/uploads/*`
