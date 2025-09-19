# ECCang Label App

A minimal mono-repo that wraps ECCang's SOAP API with a NestJS backend and a Next.js front-end for creating orders and printing labels. The project ships with a shared package for Zod schemas, Prisma models backed by SQLite, and credential-based authentication via NextAuth.

## Tech stack

- **Package manager**: pnpm workspaces
- **Backend**: NestJS 10, Prisma 5, SQLite
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, NextAuth credentials
- **Shared**: Zod schemas for ECCang payloads

## Getting started

1. Install dependencies (Node 18+ recommended):

   ```bash
   corepack enable
   pnpm install
   ```

2. Copy `.env.example` to `.env` and adjust if needed.

   ```bash
   cp .env.example .env
   ```

   The provided ECCang sandbox credentials are already included for local development.

3. Generate the Prisma client and apply migrations:

   ```bash
   pnpm --filter @googl/api prisma migrate dev
   pnpm --filter @googl/api prisma db seed
   ```

   The seed script provisions a bootstrap user using `BOOTSTRAP_EMAIL` / `BOOTSTRAP_PASSWORD` from the `.env` file.

4. Start the API server:

   ```bash
   pnpm --filter @googl/api start:dev
   ```

   The Nest app listens on `http://localhost:4000` and exposes REST endpoints under `/api`.

5. In a separate terminal start the web app:

   ```bash
   pnpm --filter @googl/web dev
   ```

   The Next.js site runs on `http://localhost:3000`. Sign in with the bootstrap credentials and navigate to **New Shipment** to create an order, then use **Labels** to browse stored labels.

## Testing

- Unit tests for the ECCang SOAP client:

  ```bash
  pnpm --filter @googl/api test
  ```

- Optional end-to-end smoke test (requires the API server plus live ECCang credentials). Enable with an environment flag:

  ```bash
  RUN_E2E=true pnpm --filter @googl/api test:e2e
  ```

## Project structure

```
.
├─ apps/
│  ├─ api/       # NestJS REST API + Prisma access
│  └─ web/       # Next.js 14 front-end (App Router)
├─ packages/
│  └─ shared/    # Zod schemas & shared typings
├─ prisma/       # Prisma schema and seed script
├─ .env.example
└─ README.md
```

## API overview

- `POST /api/orders` – Validates the shipment payload, calls ECCang `createOrder`, polls `getTrackNumber` when required, persists the order, and returns the combined ECCang + database record.
- `POST /api/orders/:reference/label` – Retrieves `getLabelUrl`, stores a label record, and returns the stored label.
- `GET /api/orders/:reference` – Fetches a stored order and its latest label.
- `GET /api/labels` – Lists stored labels with optional `q` (reference/method) search and pagination.

## Front-end flow

1. **Login** – NextAuth credentials provider (JWT sessions) backed by Prisma `User` records.
2. **New Shipment** – React Hook Form + Zod validates input, posts to the Nest API, and renders the resulting order/track data with a "Get label" action.
3. **Labels** – Lists persisted labels, supports keyword search, and allows on-demand reprints.

## Notes

- All ECCang communication occurs server-side inside the Nest app; the browser never talks to ECCang directly.
- SQLite keeps the footprint small while supporting NextAuth and order/label persistence. Swap `DATABASE_URL` in `.env` to point to another Prisma-supported database for production.
- The e2e smoke test is disabled by default so CI can skip it when the external ECCang sandbox is unavailable.
- Tailwind keeps the UI intentionally minimal but clear for the MVP scope.
