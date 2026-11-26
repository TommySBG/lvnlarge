-- =============================================================================
-- LVN'LARGE — 0001 initial schema
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Security model
--   * Row Level Security (RLS) is ON for every table.
--   * Shoppers (anon) can only READ published catalogue data.
--   * Admin users (rows in admin_users) manage everything through their login.
--   * Customer-side writes (sign-ups, bags, orders, payments) happen only in
--     trusted server code using the secret key, after server-side validation.
--   * Money is stored in kobo (integer). ₦15,000 = 1,500,000 kobo.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.admin_role as enum (
  'owner', 'order_manager', 'inventory_manager', 'marketing_manager'
);

create type public.product_status as enum ('draft', 'published', 'archived');

create type public.order_status as enum (
  'payment_pending',
  'paid',
  'processing',
  'pickup_arrangement_pending',
  'ready_for_pickup',
  'collected',
  'cancelled',
  'refunded'
);

create type public.fulfilment_method as enum ('pickup', 'delivery');

create type public.payment_status as enum (
  'pending', 'success', 'failed', 'abandoned', 'reversed'
);

create type public.stock_change_reason as enum (
  'initial', 'manual_adjustment', 'sale', 'cancellation_restock', 'refund_restock'
);

create type public.notification_kind as enum (
  'new_order', 'needs_attention', 'low_stock', 'payment_issue'
);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Admins
-- -----------------------------------------------------------------------------
create table public.admin_users (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         public.admin_role not null default 'owner',
  display_name text,
  created_at   timestamptz not null default now()
);

-- True when the logged-in user is an admin. SECURITY DEFINER so policies can
-- call it without granting read access to admin_users itself.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Catalogue
-- -----------------------------------------------------------------------------
create table public.product_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(trim(name)) between 1 and 80),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.sizes (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique check (length(trim(label)) between 1 and 20),
  sort_order integer not null default 0
);

-- Measurement chart per garment type, e.g.
-- chart = {"columns":["Chest","Length"],"rows":[{"size":"M","values":["40","28"]}]}
create table public.size_guides (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(trim(name)) between 1 and 80),
  unit       text not null default 'inches' check (unit in ('inches', 'cm')),
  chart      jsonb not null default '{"columns":[],"rows":[]}'::jsonb,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(trim(name)) between 1 and 160),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description      text,
  product_type_id  uuid not null references public.product_types (id) on delete restrict,
  size_guide_id    uuid references public.size_guides (id) on delete set null,
  price_kobo       integer not null check (price_kobo >= 0),
  status           public.product_status not null default 'draft',
  is_featured      boolean not null default false,
  is_new_arrival   boolean not null default false,
  -- Coming Soon: visible but never purchasable.
  is_coming_soon   boolean not null default false,
  -- Preorder is only ever switched on by an admin; sold out never implies it.
  allow_preorder   boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index products_status_idx on public.products (status);
create index products_type_idx on public.products (product_type_id);

-- Colours are per product, so a single-colour product can simply have none.
create table public.product_colours (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 60),
  hex        text check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  unique (product_id, name)
);

-- One row per size + colour combination, each with its own stock.
create table public.product_variants (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products (id) on delete cascade,
  size_id              uuid references public.sizes (id) on delete restrict,
  colour_id            uuid references public.product_colours (id) on delete cascade,
  sku                  text unique,
  price_override_kobo  integer check (price_override_kobo >= 0),
  stock_quantity       integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold  integer not null default 3 check (low_stock_threshold >= 0),
  allow_preorder       boolean not null default false,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique nulls not distinct (product_id, size_id, colour_id)
);

create index product_variants_product_idx on public.product_variants (product_id);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  colour_id    uuid references public.product_colours (id) on delete cascade,
  storage_path text not null,
  alt_text     text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id);

create table public.collections (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique check (length(trim(name)) between 1 and 120),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description      text,
  cover_image_path text,
  is_featured      boolean not null default false,
  is_published     boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- A product can belong to many collections.
create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (collection_id, product_id)
);

create index collection_products_product_idx on public.collection_products (product_id);

-- -----------------------------------------------------------------------------
-- Visitors
-- -----------------------------------------------------------------------------
-- Entering an email to access the store is NOT marketing consent.
create table public.subscribers (
  id                     uuid primary key default gen_random_uuid(),
  email                  text not null unique
                           check (email = lower(email) and length(email) between 3 and 254),
  marketing_consent      boolean not null default false,
  marketing_consent_at   timestamptz,
  marketing_withdrawn_at timestamptz,
  entry_count            integer not null default 1 check (entry_count >= 1),
  first_seen_at          timestamptz not null default now(),
  last_seen_at           timestamptz not null default now()
);

-- Bag identified by an unguessable id kept in an httpOnly cookie.
-- Adding to the bag never reserves stock.
create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  email      text check (email is null or email = lower(email)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity   integer not null check (quantity between 1 and 99),
  added_at   timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- -----------------------------------------------------------------------------
-- Orders & payments
-- -----------------------------------------------------------------------------
create sequence public.order_number_seq start 1;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  -- Assigned only when payment is verified, so the physical order book has no
  -- gaps from abandoned checkouts. Reference looks like LVN-0001.
  order_number        bigint unique,
  reference           text generated always as (
                        case
                          when order_number is null then null
                          when order_number < 10000 then 'LVN-' || lpad(order_number::text, 4, '0')
                          else 'LVN-' || order_number::text
                        end
                      ) stored unique,
  customer_name       text not null check (length(trim(customer_name)) between 1 and 120),
  customer_email      text not null check (customer_email = lower(customer_email)),
  customer_phone      text not null check (length(customer_phone) between 7 and 20),
  customer_notes      text check (customer_notes is null or length(customer_notes) <= 1000),
  subscriber_id       uuid references public.subscribers (id) on delete set null,
  status              public.order_status not null default 'payment_pending',
  fulfilment_method   public.fulfilment_method not null default 'pickup',
  delivery_address    jsonb,               -- reserved for future delivery
  pickup_location     text,
  pickup_at           timestamptz,
  pickup_code         text unique,
  -- Only a SHA-256 hash of the private tracking-link token is stored.
  tracking_token_hash text not null unique,
  subtotal_kobo       integer not null check (subtotal_kobo >= 0),
  charges_kobo        integer not null default 0 check (charges_kobo >= 0),
  total_kobo          integer not null,
  -- Paid but stock ran out at the same moment, or similar issue for the owner.
  needs_attention     boolean not null default false,
  attention_reason    text,
  paid_at             timestamptz,
  collected_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (total_kobo = subtotal_kobo + charges_kobo)
);

create index orders_status_idx on public.orders (status);
create index orders_email_idx on public.orders (customer_email);
create index orders_created_idx on public.orders (created_at desc);

-- Frozen copy of what was bought, so later product edits never change it.
create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  variant_id      uuid references public.product_variants (id) on delete set null,
  product_name    text not null,
  size_label      text,
  colour_name     text,
  unit_price_kobo integer not null check (unit_price_kobo >= 0),
  quantity        integer not null check (quantity >= 1),
  line_total_kobo integer generated always as (unit_price_kobo * quantity) stored
);

create index order_items_order_idx on public.order_items (order_id);

-- One row per payment attempt (a retry gets a new Paystack reference).
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  provider         text not null default 'paystack',
  reference        text not null unique,
  amount_kobo      integer not null check (amount_kobo >= 0),
  currency         text not null default 'NGN',
  status           public.payment_status not null default 'pending',
  channel          text,
  gateway_response jsonb,
  paid_at          timestamptz,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

-- Every webhook Paystack sends. event_key is unique, so a duplicate is ignored.
create table public.payment_events (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null default 'paystack',
  event_key        text not null unique,
  event_type       text not null,
  reference        text,
  payload          jsonb not null,
  received_at      timestamptz not null default now(),
  processed_at     timestamptz,
  processing_error text
);

create table public.order_status_history (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  from_status      public.order_status,
  to_status        public.order_status not null,
  note             text,
  customer_visible boolean not null default true,
  changed_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- -----------------------------------------------------------------------------
-- Inventory audit & admin notifications
-- -----------------------------------------------------------------------------
create table public.stock_movements (
  id         uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  change     integer not null check (change <> 0),
  reason     public.stock_change_reason not null,
  order_id   uuid references public.orders (id) on delete set null,
  note       text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_variant_idx on public.stock_movements (variant_id, created_at desc);

create table public.admin_notifications (
  id         uuid primary key default gen_random_uuid(),
  kind       public.notification_kind not null,
  title      text not null,
  body       text,
  order_id   uuid references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index admin_notifications_unread_idx on public.admin_notifications (is_read, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
create trigger set_updated_at before update on public.size_guides
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.collections
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.carts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.admin_users          enable row level security;
alter table public.product_types        enable row level security;
alter table public.sizes                enable row level security;
alter table public.size_guides          enable row level security;
alter table public.products             enable row level security;
alter table public.product_colours      enable row level security;
alter table public.product_variants     enable row level security;
alter table public.product_images       enable row level security;
alter table public.collections          enable row level security;
alter table public.collection_products  enable row level security;
alter table public.subscribers          enable row level security;
alter table public.carts                enable row level security;
alter table public.cart_items           enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.payments             enable row level security;
alter table public.payment_events       enable row level security;
alter table public.order_status_history enable row level security;
alter table public.stock_movements      enable row level security;
alter table public.admin_notifications  enable row level security;

-- Admins can read their own admin row (used by the login check). No API writes.
create policy "admins read own row" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

-- Reference data: readable by everyone, managed by admins.
create policy "public read" on public.product_types for select to anon, authenticated using (true);
create policy "public read" on public.sizes         for select to anon, authenticated using (true);
create policy "public read" on public.size_guides   for select to anon, authenticated using (true);

-- Products: shoppers see published ones only.
create policy "public read published" on public.products
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "public read published" on public.product_colours
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.status = 'published' or (select public.is_admin()))));

create policy "public read published" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.status = 'published' or (select public.is_admin()))));

create policy "public read published" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.status = 'published' or (select public.is_admin()))));

create policy "public read published" on public.collections
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "public read published" on public.collection_products
  for select to anon, authenticated
  using ((select public.is_admin()) or (
    exists (select 1 from public.collections c where c.id = collection_id and c.is_published)
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  ));

-- Admin full management of catalogue tables.
do $$
declare t text;
begin
  foreach t in array array[
    'product_types', 'sizes', 'size_guides', 'products', 'product_colours',
    'product_variants', 'product_images', 'collections', 'collection_products'
  ] loop
    execute format(
      'create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format(
      'create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format(
      'create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

-- Private tables: admins only. Shoppers never touch these directly.
do $$
declare t text;
begin
  foreach t in array array[
    'subscribers', 'orders', 'order_items', 'payments', 'payment_events',
    'order_status_history', 'stock_movements', 'admin_notifications'
  ] loop
    execute format(
      'create policy "admin read" on public.%I for select to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

create policy "admin update" on public.subscribers
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin update" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin update" on public.admin_notifications
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
-- carts / cart_items: no policies — server code only (secret key).

-- -----------------------------------------------------------------------------
-- Grants (RLS above still decides which rows are visible)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on public.product_types, public.sizes, public.size_guides, public.products,
  public.product_colours, public.product_variants, public.product_images,
  public.collections, public.collection_products
  to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on sequence public.order_number_seq to service_role;

revoke all on public.carts, public.cart_items from anon, authenticated;
revoke insert, update, delete on public.admin_users from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Starter data taken directly from the master brief (owner can edit/add later)
-- -----------------------------------------------------------------------------
insert into public.sizes (label, sort_order) values
  ('XS', 10), ('S', 20), ('M', 30), ('L', 40), ('XL', 50), ('XXL', 60), ('One Size', 100);

insert into public.product_types (name, slug, sort_order) values
  ('Polo Shirts',                 'polo-shirts',                10),
  ('Joggers',                     'joggers',                    20),
  ('Plain T-Shirts',              'plain-t-shirts',             30),
  ('Graphic Round-Neck T-Shirts', 'graphic-round-neck-t-shirts', 40),
  ('Trucker Hats',                'trucker-hats',               50),
  ('Snapbacks',                   'snapbacks',                  60);

-- Collections start UNPUBLISHED with no description; the owner writes the copy.
insert into public.collections (name, slug, sort_order) values
  ('Swagging Since 06',   'swagging-since-06',  10),
  ('After One Art',       'after-one-art',      20),
  ('Swag Affairs Polo',   'swag-affairs-polo',  30),
  ('Plain Tees/Joggers',  'plain-tees-joggers', 40),
  ('LVN''LRG Joggers',    'lvnlrg-joggers',     50),
  ('Combine You',         'combine-you',        60),
  ('Cap A Lot',           'cap-a-lot',          70);

commit;
