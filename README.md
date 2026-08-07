# SplitMate

Bill splitting and expense tracking app.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Routing**: React Router v7 (SPA mode)
- **Deployment**: Cloudflare Workers (static assets)

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

## Building

```bash
cd frontend
npm run build
```

## Deployment

```bash
cd frontend
npx wrangler login
npx wrangler deploy
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   ├── App.tsx          # Main app with routing
│   └── index.css        # Tailwind + design tokens
├── public/              # Static assets
├── vite.config.ts       # Vite + Cloudflare plugin
└── wrangler.jsonc       # Cloudflare Workers config
```

## License

Private
