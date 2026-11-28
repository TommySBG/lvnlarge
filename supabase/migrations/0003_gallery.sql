-- =============================================================================
-- LVN'LARGE — step 3: LVN Gallery (lookbook photos managed from the admin)
-- Run once in Supabase → SQL Editor, after 0001 and 0002.
-- Wrapped in a transaction: if anything fails, nothing is changed.
-- =============================================================================

begin;

-- What kind of photo it is. 'concept' = AI/concept artwork: always labelled
-- "Concept" on the site so it is never shown as proof of a real product.
create type public.gallery_kind as enum ('founder', 'model', 'customer', 'campaign', 'editorial', 'concept');

create table public.gallery_images (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path ~ '^gallery/[0-9a-f-]{36}\.jpg$'),
  caption      text check (caption is null or length(caption) <= 200),
  kind         public.gallery_kind not null default 'model',
  -- Optional "Shop the look" link to the product being worn.
  product_id   uuid references public.products (id) on delete set null,
  is_published boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index gallery_images_sort_idx on public.gallery_images (sort_order);

alter table public.gallery_images enable row level security;

create policy "public read published" on public.gallery_images
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "admin insert" on public.gallery_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.gallery_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.gallery_images
  for delete to authenticated using ((select public.is_admin()));

grant select on public.gallery_images to anon, authenticated;
grant insert, update, delete on public.gallery_images to authenticated;

commit;
