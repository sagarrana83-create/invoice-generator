# Invoice SaaS

Next.js App Router SaaS for authenticated invoice management.

## Implemented
- Authentication: signup, login, logout, protected dashboard
- Company profile management per user
- Client management
- Invoice creation with multiple line items
- Automatic subtotal, tax, and total calculation
- Invoice lifecycle statuses: `draft`, `sent`, `paid`, `overdue`
- Server-side invoice PDF export
- Invoice delivery via email with PDF attachment
- Stripe Checkout payment flow + secure webhook-based status updates
- Analytics dashboard (revenue, pending, overdue, totals, recent invoices, monthly trend)
- Invoice list server-side search, filter, sort, and pagination
- Scheduled overdue automation endpoint

## Core routes
- `/login`
- `/signup`
- `/dashboard`
- `/dashboard/invoices`
- `/dashboard/invoices/new`
- `/dashboard/invoices/[id]`
- `/dashboard/invoices/[id]/pdf`
- `/dashboard/clients`
- `/dashboard/settings/company`
- `/api/stripe/webhook`
- `/api/jobs/overdue`

## Required environment variables
- `DATABASE_URL`
- `SESSION_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional, falls back to `SMTP_USER`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL` (recommended for Stripe redirect URLs)
- `CRON_SECRET` (required for overdue scheduled endpoint)

## Deployment checklist
1. Run Prisma migration and generate client:
   - `npm run prisma:migrate`
   - `npm run prisma:generate`
2. Configure Stripe webhook to `POST /api/stripe/webhook` with the signing secret.
3. Configure a cron job for overdue automation:
   - `POST /api/jobs/overdue`
   - Header: `Authorization: Bearer <CRON_SECRET>`
4. Set all production environment variables before starting app.

### Example cron (every day at 02:00 UTC)
```cron
0 2 * * * curl -X POST https://your-domain.com/api/jobs/overdue -H "Authorization: Bearer $CRON_SECRET"
```

## Security notes
- All invoice operations are scoped by authenticated user ID server-side.
- Stripe Checkout uses server-authoritative invoice totals from the database.
- Stripe webhook updates are signature-verified and idempotent (`paymentId` guard).
- Session handling uses signed httpOnly cookies and DB-backed sessions.

## Tech
- Next.js App Router + TypeScript strict
- Tailwind CSS
- Prisma + PostgreSQL
- Server Components + Server Actions
