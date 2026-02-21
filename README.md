# MCPM

A React + TypeScript app for prediction market simulation and analysis.

This version removes direct Supabase usage. The frontend now calls generic `/api` endpoints so you can run your own PostgreSQL-backed backend (for example on Railway) instead of Supabase Edge Functions.

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

By default it uses same-origin requests. To target a separate backend service, set:

- `VITE_API_BASE_URL` (example: `https://your-backend.up.railway.app`)

Your backend can use PostgreSQL via `DATABASE_URL` and any other secrets it needs (`AI_GATEWAY_API_KEY`, etc.).

## Deploying on Railway

1. Deploy this frontend service.
2. Deploy a backend service that implements the `/api/*` routes and connects to PostgreSQL.
3. Set `VITE_API_BASE_URL` in this frontend service to your backend URL.

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
