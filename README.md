# MCPM

A React + TypeScript app for prediction market simulation and analysis.

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

## Deploying on Railway

This project is ready for Railway deployment as a Node service.

1. Create a new Railway project and connect this repository.
2. Railway will install dependencies and run the build command from `railway.toml`.
3. Railway will start the app with `npm start`, which listens on `0.0.0.0:$PORT`.

### Required environment variables

Set these in Railway if you use Supabase and AI analysis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `AI_GATEWAY_API_KEY`
- `AI_GATEWAY_URL` (optional, defaults to OpenRouter's chat completions endpoint)

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
