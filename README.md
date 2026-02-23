# Invoice SaaS - Phase 1

Production-grade Next.js SaaS foundation with secure authentication and a protected dashboard.

## Tech Stack
- Next.js App Router + TypeScript (strict)
- Tailwind CSS
- Prisma + PostgreSQL
- Server Actions for auth flows
- JWT-backed httpOnly cookie sessions

## Environment Variables
Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:
- `DATABASE_URL`
- `SESSION_SECRET`

## Run Locally
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Authentication Flow
1. User submits `/signup` or `/login` form.
2. Server Action validates input with Zod.
3. Password is hashed/verified with bcrypt.
4. A database session record is created.
5. Signed JWT containing session ID + user ID is stored in an httpOnly cookie.
6. Middleware and dashboard layout enforce access control.

## Routes
- `/login` - Sign in
- `/signup` - Create account
- `/dashboard` - Protected SaaS dashboard

## Folder Structure
```text
src/
  app/
    (auth)/
      actions.ts
      login/page.tsx
      signup/page.tsx
    (dashboard)/
      dashboard/page.tsx
      layout.tsx
    layout.tsx
    page.tsx
    globals.css
  components/
    auth/auth-form.tsx
    dashboard/sidebar.tsx
    dashboard/top-nav.tsx
  lib/
    auth/password.ts
    auth/session.ts
    auth/validators.ts
    prisma.ts
prisma/
  schema.prisma
```
