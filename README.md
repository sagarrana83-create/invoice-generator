# Invoice Generator (Next.js SaaS)

Production-ready Invoice Generator web app built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Prisma + SQLite**, secure authentication, invoice CRUD, dashboard analytics, and PDF export.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- JWT cookie auth + bcrypt password hashing
- PDFKit for invoice PDF generation

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Update `JWT_SECRET` with a long random value.
3. Generate Prisma client and migrate DB:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Project Structure

```txt
app/
  (auth)/login, signup      -> Authentication screens
  dashboard/                -> KPI overview
  invoices/                 -> Invoice list, filters, create/edit pages
  api/                      -> Backend API routes (auth, invoices, clients, dashboard)
components/
  auth-form.tsx             -> Login/signup form client logic
  dashboard-shell.tsx       -> Reusable app shell/navbar
  invoice-form.tsx          -> Reusable create/edit invoice form
  header.tsx, input.tsx     -> Reusable UI primitives
lib/
  auth.ts                   -> JWT session helpers + cookie handling
  prisma.ts                 -> Prisma singleton
  validations.ts            -> Zod request validation schemas
  utils.ts                  -> currency/date formatters
prisma/
  schema.prisma             -> Users, Clients, Invoices, InvoiceItems schema
```

## Frontend ↔ Backend Flow
1. Frontend submits forms using `fetch` to `app/api/*` routes.
2. API routes validate payloads with Zod.
3. Auth routes hash passwords and issue signed JWT cookie sessions.
4. Protected routes/pages read the session cookie and fetch user-scoped Prisma data.
5. Invoice APIs persist invoice + items + client relations in SQLite.
6. PDF route loads invoice from DB and returns a generated PDF download.

## Feature Coverage
- Email/password signup and login with secure hashing.
- Protected dashboard and invoices routes (middleware + server checks).
- Dashboard cards: total invoices, paid, pending/overdue, paid revenue.
- Full invoice creation/editing:
  - Company info, logo upload (base64), optional tax ID.
  - Client details.
  - Invoice metadata and status.
  - Dynamic line items with live totals.
  - Tax %, discount, subtotal, grand total.
  - Notes + terms.
- Invoice management:
  - Table listing.
  - Search/filter by client, status, date.
  - Edit/delete.
  - Mark paid/pending.
- PDF generation + download.
- Responsive clean SaaS UI with dark-mode-compatible palette.

## Production Notes
- Replace default JWT secret in `.env`.
- Move logo/file uploads to object storage (S3/R2) for large-scale production.
- Add CSRF protection + rate limiting for hardened deployments.
- Add automated tests and CI before marketplace distribution.
