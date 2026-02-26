# Invoice SaaS

Next.js App Router SaaS for authenticated invoice management.

## Implemented
- Authentication: signup, login, logout, protected dashboard
- Company profile management per user
- Client management
- Invoice creation with multiple line items
- Automatic subtotal, tax, and total calculation
- Invoice lifecycle statuses: `draft`, `sent`, `paid`

## Core routes
- `/login`
- `/signup`
- `/dashboard`
- `/dashboard/invoices`
- `/dashboard/invoices/new`
- `/dashboard/invoices/[id]`
- `/dashboard/clients`
- `/dashboard/settings/company`

## Tech
- Next.js App Router + TypeScript strict
- Tailwind CSS
- Prisma + PostgreSQL
- Server Components + Server Actions
