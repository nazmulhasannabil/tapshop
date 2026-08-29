# TapShop 🧾

A fast, mobile-first **tap-based shop bill / consumption tracker** for a group of
friends who keep a running tab at a regular canteen/tea shop.

> See item → **tap** item → quantity `+1` → total updates instantly → saved.

The core loop is optimized to feel like a casual game, not accounting software.

---

## Stack

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives) · **Lucide** icons · **Motion**
- **Drizzle ORM** + **PostgreSQL** (cloud-managed)
- **Better Auth** (email + password, session cookies, role handling)
- **Zustand** for optimistic client billing state
- **React Hook Form** + **Zod** · **Vitest** for tests

---

## What's in this milestone (walking skeleton)

The product's heart is built end-to-end and deployable:

- ✅ Email/password auth (register / login / logout) with session protection
- ✅ `ADMIN_EMAILS` allowlist → auto-promote the first admin on signup
- ✅ The billing screen: **Recently Used**, **Your Go-To's**, **All Items**
- ✅ Tap-to-add item cards with `+1` animation, subtle minus control, animated total
- ✅ Sticky bottom bill summary + "View Bill" bottom sheet (+/–/remove)
- ✅ "+ Add Item" bottom sheet
- ✅ **Rapid-tap-safe persistence**: one atomic Postgres upsert per tap
  (`ON CONFLICT (user_id, item_id, bill_date) DO UPDATE quantity = quantity + 1`)
- ✅ Optimistic UI with rollback + retry; price snapshot per day
- ✅ Server-derived identity (never trusts a client `userId`), Zod on every input
- ✅ Unit tests for the billing math (rapid taps, out-of-order confirms, snapshots)
- ✅ Route protection via Next 16 `proxy.ts`

### Roadmap (next phases)

History · personal stats (Recharts) · admin dashboard (TanStack Table) ·
activity feed · PWA install + offline · integration & security tests.

---

## Getting started

### Prerequisites

- Node.js **20.9+** and [pnpm](https://pnpm.io)
- A cloud-managed PostgreSQL database (Supabase, Railway, Render, etc.)

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your Postgres **pooled** connection string (use the pooler URL for Vercel/serverless) |
| `BETTER_AUTH_SECRET` | A random 32+ char string (e.g. `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | App origin, e.g. `http://localhost:3000` |
| `ADMIN_EMAILS` | Comma-separated emails to auto-promote to admin, e.g. `you@example.com` |

### 3. Create the schema + seed sample items

```bash
pnpm db:push      # apply the schema to Postgres
pnpm db:seed      # seed 8 sample items + demo accounts
```

The seed also provisions two demo logins:

| Role | Email | Password |
| --- | --- | --- |
| User  | `demo@tapshop.com`  | `password123` |
| Admin | `admin@tapshop.com` | `password123` |

### 4. Run

```bash
pnpm dev
```

Open <http://localhost:3000> and sign in with one of the demo accounts above,
or register your own. To make *your own* email an admin, list it in
`ADMIN_EMAILS` before registering (admin screens come in a later phase).

---

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Run Vitest unit tests |
| `pnpm db:push` | Push schema to the database |
| `pnpm db:generate` | Generate a SQL migration from schema changes |
| `pnpm db:migrate` | Apply generated migrations |
| `pnpm db:seed` | Seed sample items |
| `pnpm db:studio` | Open Drizzle Studio |

---

## How rapid taps stay correct

Two layers keep the count exact under furious tapping:

1. **Server (source of truth):** each tap is a single atomic statement —
   `INSERT … ON CONFLICT … DO UPDATE SET quantity = quantity + 1`. Ten quick taps
   produce ten atomic `+1`s, so the final quantity is exactly 10. There is no
   client read-modify-write, so concurrent requests can never overwrite each other.
2. **Client (optimistic UI):** the Zustand store tracks `confirmed` (server-known)
   and `pending` (in-flight taps). Displayed quantity is `confirmed + pending`.
   Each confirmation accounts for exactly one tap (`confirmed + 1`, `pending - 1`),
   so the displayed total stays invariant even when server responses arrive out
   of order. Failures roll back and offer retry.

Billing mutations use **Route Handlers** (`/api/bill/*`) called via `fetch`
rather than Server Actions, because Next dispatches Server Actions sequentially —
fine for forms, but a queue would slow rapid taps.

---

## Deploy (Vercel + PostgreSQL)

1. Push the repo to GitHub.
2. Import it in Vercel.
3. Add the same env vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
   `ADMIN_EMAILS`) in the Vercel project settings.
4. Set `BETTER_AUTH_URL` to your production origin.
5. Set `DATABASE_URL` to your provider's **pooled** production connection string.
6. Ensure the database schema exists (run `pnpm db:migrate` against your prod database,
   or add `pnpm db:migrate` to the build command).

---

## Project layout

```
src/
├── app/
│   ├── (auth)/          login, register
│   ├── (user)/          home (billing), profile
│   ├── admin/           (reserved for later phases)
│   └── api/             auth/* · bill/{add,decrease,remove} · items
├── components/{ui,billing,user}/
├── actions/             (later phases)
├── db/                  schema · migrations · seed · client
├── stores/              bill-store.ts (optimistic Zustand)
├── hooks/               use-bill.ts (orchestration)
├── lib/{auth,services,validations,api,config,constants}
├── types/
└── proxy.ts             Next 16 route protection (formerly middleware)
```
