# LOL vNext

Transportation Management & Profit Control System — greenfield rewrite.

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | Next.js 14 + TypeScript |
| Backend  | NestJS 10 + TypeScript  |
| Database | PostgreSQL 16       |
| Arch     | Modular Monolith (npm workspaces) |

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose

## Quick Start

```bash
# 1. Clone & install
cp .env.example .env
npm install

# 2. Build shared package
npm run build -w packages/shared

# 3. Start PostgreSQL
npm run docker:db

# 4. Start API (terminal 1)
npm run dev:api

# 5. Start Web (terminal 2)
npm run dev:web
```

- Web: http://localhost:3000
- API Health: http://localhost:3001/api/health

## Project Structure

```
lol-vnext/
├── packages/
│   ├── shared/     # @lol/shared — types, constants, utils
│   ├── api/        # @lol/api   — NestJS backend
│   └── web/        # @lol/web   — Next.js frontend
├── docker-compose.yml
├── .env.example
└── tsconfig.base.json
```

## Scripts

| Command             | Description                  |
|---------------------|------------------------------|
| `npm run dev:api`   | Start API in watch mode      |
| `npm run dev:web`   | Start Web dev server         |
| `npm run build`     | Build all packages           |
| `npm run lint`      | Lint all packages            |
| `npm run test`      | Run all tests                |
| `npm run test:api`  | Run API tests only           |
| `npm run docker:db`    | Start PostgreSQL only        |
| `npm run docker:up`   | Start all Docker services    |
| `npm run docker:down` | Stop all Docker services     |
| `npm run docker:reset`| Wipe volumes & restart DB    |

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable          | Default                          | Description           |
|-------------------|----------------------------------|-----------------------|
| `DATABASE_URL`    | `postgresql://lol:lol_secret@localhost:5432/lol_vnext` | PostgreSQL DSN |
| `API_PORT`        | `3001`                           | NestJS listen port    |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001`      | API URL for frontend  |
