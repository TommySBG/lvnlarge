# LVN’LARGE

Full-stack e-commerce site for LVN’LARGE (Living Large). The master brief is in [CLAUDE.md](CLAUDE.md).

**Stack:** Next.js 16 (App Router, Cache Components) · Supabase (Postgres, Auth, Storage) · Paystack (test mode) · Resend (later) · Tailwind CSS 4.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the values (instructions are inside the file).
   `.env.local` is ignored by Git. **Never commit real keys or paste them into chats or tickets.**
3. Create the database: Supabase Dashboard → **SQL Editor** → New query → paste the contents of
   [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql) → **Run**.
   Run each migration file once, in number order (`0001`, `0002`, `0003`). Each file is
   "all or nothing", so an accidental second run changes nothing.
4. Check everything: `node --env-file=.env.local scripts/check-setup.mjs`
   and test the catalogue rules: `node --env-file=.env.local scripts/test-catalogue.mjs`
   (creates a temporary admin + test products, checks publishing/stock/photo rules, then deletes them).
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

## The shop (storefront)

- **Email gate:** every visitor enters an email at `/enter` before seeing the store ([proxy.ts](proxy.ts)).
  The email is saved in `subscribers` by a Server Action using the server key; ticking the optional box
  is the only thing that records marketing consent. A `lvn_entry` cookie remembers the visitor for a year.
- **Pages:** `/` (welcome + home), `/collections`, `/collections/[slug]`, `/shop` (filters live in the web
  address), `/product/[slug]`, `/gallery`, `/about`. Code is in `app/(shop)/` and `components/shop/`.
- **Data:** all shop reads go through [lib/shop/data.ts](lib/shop/data.ts) as an anonymous shopper, so Row
  Level Security guarantees drafts never show. Results are cached (`"use cache"`, tag `catalogue`) and every
  admin change calls `catalogueChanged()` ([lib/shop/cache.ts](lib/shop/cache.ts)) so the shop updates at once.
- **Brand files:** `public/brand/logo.png` and `public/brand/welcome.jpg`.
- **Admin extras:** More → **Sign-ups** (count, list, CSV download — "news list" = agreed to marketing only)
  and More → **LVN Gallery** (upload lookbook photos, captions, "Concept" label for AI artwork, Shop-the-look link).

## Key business rules in the database

- Money is stored in **kobo** (₦1 = 100 kobo), as Paystack expects.
- Each size + colour combination is a separate variant with its own stock.
- Stock only changes through `set_stock` / `adjust_stock` (database functions), which never go
  below 0 and record every change in `stock_movements`. Admins can't write `stock_quantity` directly.
- A product can't be published without a price, a photo and a size (Coming soon products need no size).
- Anything that has been ordered can't be deleted — products are archived, sizes/colours switched off.
- Photos are shrunk to 2000px wide in the browser, then uploaded straight to the Supabase Storage
  bucket `catalogue` (public read, admin-only upload, JPG/PNG/WebP, 8 MB max).
- The admin is mobile-first: bottom tab bar on phones, 16px inputs (no iOS zoom), 48px buttons.
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
components/          Shared UI (components/admin = admin screens)
lib/                 Server helpers (Supabase clients, auth)
  (shop)/            Storefront pages (home, collections, shop, product, gallery, about)
  enter/             Email gate
components/shop/     Storefront UI (header, cards, carousels, product view)
lib/shop/            Storefront data, filters, cache refresh
public/brand/        Logo and welcome photo
scripts/             Setup + test scripts (check-setup, make-owner, test-catalogue)
supabase/migrations/ Database SQL, run in order
```
