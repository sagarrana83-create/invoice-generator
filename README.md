# Invoice SaaS

Next.js App Router SaaS for authenticated invoice management.

## Implemented
- Authentication: signup, login, logout, protected dashboard
- Company profile management per user
- Client management
- Invoice creation with multiple line items
- Automatic subtotal, tax, and total calculation
- Invoice lifecycle statuses: `draft`, `sent`, `paid`
- Server-side invoice PDF export
- Invoice delivery via email with PDF attachment

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

## Required environment variables
- `DATABASE_URL`
- `SESSION_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional, falls back to `SMTP_USER`)

## Tech
- Next.js App Router + TypeScript strict
- Tailwind CSS
- Prisma + PostgreSQL
- Server Components + Server Actions
