# MCPM

A React + TypeScript app for prediction market simulation and analysis.

This version removes direct Supabase usage. The frontend now calls local `/api` endpoints served by this same app (no Supabase required), while still supporting an external backend via `VITE_API_BASE_URL` if you prefer.

## Local development

Requirements:
- Node.js 18+
- npm

```sh
git clone <YOUR_GIT_URL>
cd MCPM
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start the Vite development server
- `npm run build` - Build production assets
- `npm run preview` - Preview the production build locally
- `npm start` - Start the production preview server (binds to `0.0.0.0:$PORT` for Railway)
- `npm run test` - Run test suite

## Backend/API configuration

The frontend calls:
- `POST /api/firecrawl-scrape`
- `POST /api/ai-analysis`

By default it uses same-origin requests and the included Node server handles these routes.

Required server env vars for full functionality:
- `AI_GATEWAY_API_KEY` (required for `POST /api/ai-analysis`)
- `AI_GATEWAY_URL` (optional, defaults to OpenRouter Chat Completions endpoint)

Optional frontend override:
- `VITE_API_BASE_URL` (if you want the frontend to call a separate backend service instead of same-origin).

## Deploying on Railway

1. Deploy this service (it now includes both frontend + `/api` routes in one process).
2. Set `AI_GATEWAY_API_KEY` (and optionally `AI_GATEWAY_URL`) on Railway.
3. If you later split backend/frontend, set `VITE_API_BASE_URL` in the frontend service.

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
