# LVN’LARGE

Full-stack e-commerce site for LVN’LARGE (Living Large). The master brief is in [CLAUDE.md](CLAUDE.md).

**Stack:** Next.js 16 (App Router, Cache Components) · Supabase (Postgres, Auth, Storage) · Paystack (test mode) · Resend (later) · Tailwind CSS 4.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values (instructions are inside the file).
   `.env.local` is ignored by Git. **Never commit real keys or paste them into chats or tickets.**
3. Create the database: Supabase Dashboard → **SQL Editor** → New query → paste the contents of
   [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql) → **Run**.
   Run each migration file once, in number order.
4. Check everything: `node --env-file=.env.local scripts/check-setup.mjs`
5. Start the site: `npm run dev` → http://localhost:3000

## Environment variables

| Name | Where it's used | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server | No |
| `SUPABASE_SECRET_KEY` | Server only (bypasses Row Level Security) | **Yes** |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Browser (Paystack popup) | No |
| `PAYSTACK_SECRET_KEY` | Server only (verify payments + webhook signatures) | **Yes** |

On Vercel, add the same variables under Project → Settings → Environment Variables.
Use Paystack **test** keys until the merchant account is approved for live payments.

## Admin access

The admin dashboard is at `/admin`. Accounts are created by hand — public sign-up is disabled.

1. Supabase → **Authentication → Sign In / Providers** → turn **off** “Allow new users to sign up”.
2. Supabase → **Authentication → Users → Add user → Create new user**: enter the email and a strong
   password, tick **Auto Confirm User**.
3. Grant the Owner role: `node --env-file=.env.local scripts/make-owner.mjs owner@example.com`
4. Sign in at `/admin/login`.

Roles in the database: `owner`, `order_manager`, `inventory_manager`, `marketing_manager`
(only `owner` is used for the first release).

## How data is protected

- Row Level Security is on for every table.
- Shoppers can only read **published** products and collections.
- Orders, payments, email sign-ups and bags are never readable from the browser; the server reads
  them with the secret key after checking the request (e.g. email + order reference).
- Admin pages call `requireAdmin()` on the server ([lib/auth.ts](lib/auth.ts)); [proxy.ts](proxy.ts)
  refreshes the login cookie and redirects logged-out visitors.

## Key business rules in the database

- Money is stored in **kobo** (₦1 = 100 kobo), as Paystack expects.
- Each size + colour combination is a separate variant with its own stock.
- Adding to the bag never reserves stock; stock is deducted only after Paystack payment is verified
  on the server.
- Order references (`LVN-0001`, …) are assigned only to **paid** orders, so the physical order book
  has no gaps. If stock runs out between payment and confirmation, the order is flagged
  **Needs attention** and the owner is alerted.
- Duplicate Paystack webhooks are ignored (unique `event_key`).
- Charges are currently ₦0.

## Project layout

```
app/                 Pages and routes (App Router)
  admin/             Admin login + dashboard (protected)
components/          Shared UI
lib/                 Server helpers (Supabase clients, auth)
scripts/             Setup scripts (check-setup, make-owner)
supabase/migrations/ Database SQL, run in order
```
