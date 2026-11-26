-- =============================================================================
-- LVN'LARGE — 0002 catalogue admin
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
--   * Sizes: S, M, L, XL, XXL, 3XL, One Size (no XS) — owner decision.
--   * Photo storage bucket "catalogue" (public read, admin-only upload).
--   * Stock changes go through set_stock / adjust_stock, which lock the row,
--     never allow negative stock, and write a stock_movements history entry.
--   * Ordered products/variants can't be deleted (archive / switch off instead).
--   * A product can't be published without a price, a photo and a size.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Sizes
-- -----------------------------------------------------------------------------
delete from public.sizes where label = 'XS';
insert into public.sizes (label, sort_order) values ('3XL', 70)
  on conflict (label) do nothing;

-- -----------------------------------------------------------------------------
-- Low-stock warning level, set once per product (owner default: 3).
-- The admin copies it onto each of the product's variants.
-- -----------------------------------------------------------------------------
alter table public.products
  add column low_stock_threshold integer not null default 3
  check (low_stock_threshold between 0 and 1000);

-- -----------------------------------------------------------------------------
-- Photo storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogue', 'catalogue', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "catalogue admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalogue' and (select public.is_admin()));

create policy "catalogue admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalogue' and (select public.is_admin()));

create policy "catalogue admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalogue' and (select public.is_admin()))
  with check (bucket_id = 'catalogue' and (select public.is_admin()));

create policy "catalogue admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalogue' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Stock changes (always recorded in stock_movements)
-- -----------------------------------------------------------------------------
create or replace function public.set_stock(
  p_variant_id uuid,
  p_quantity integer,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_reason public.stock_change_reason;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 0 or p_quantity > 100000 then
    raise exception 'Stock must be a number from 0 to 100000.' using errcode = '22023';
  end if;

  select stock_quantity into v_current
  from public.product_variants where id = p_variant_id
  for update;
  if not found then
    raise exception 'That size/colour no longer exists.' using errcode = 'P0002';
  end if;

  if v_current = p_quantity then
    return v_current;
  end if;

  v_reason := case
    when exists (select 1 from public.stock_movements where variant_id = p_variant_id)
      then 'manual_adjustment'::public.stock_change_reason
    else 'initial'::public.stock_change_reason
  end;

  update public.product_variants set stock_quantity = p_quantity where id = p_variant_id;
  insert into public.stock_movements (variant_id, change, reason, note, created_by)
  values (p_variant_id, p_quantity - v_current, v_reason, nullif(trim(p_note), ''), auth.uid());

  return p_quantity;
end;
$$;

create or replace function public.adjust_stock(
  p_variant_id uuid,
  p_change integer,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_new integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_change is null or p_change = 0 or abs(p_change) > 100000 then
    raise exception 'Enter a stock change.' using errcode = '22023';
  end if;

  select stock_quantity into v_current
  from public.product_variants where id = p_variant_id
  for update;
  if not found then
    raise exception 'That size/colour no longer exists.' using errcode = 'P0002';
  end if;

  v_new := v_current + p_change;
  if v_new < 0 then
    raise exception 'Stock can''t go below 0.' using errcode = '22023';
  end if;

  update public.product_variants set stock_quantity = v_new where id = p_variant_id;
  insert into public.stock_movements (variant_id, change, reason, note, created_by)
  values (p_variant_id, p_change, 'manual_adjustment', nullif(trim(p_note), ''), auth.uid());

  return v_new;
end;
$$;

revoke all on function public.set_stock(uuid, integer, text) from public, anon;
revoke all on function public.adjust_stock(uuid, integer, text) from public, anon;
grant execute on function public.set_stock(uuid, integer, text) to authenticated;
grant execute on function public.adjust_stock(uuid, integer, text) to authenticated;

-- Stock must only change through the functions above (or trusted server code):
-- admins may write every variant column EXCEPT stock_quantity.
revoke insert, update on public.product_variants from authenticated;
grant insert (product_id, size_id, colour_id, sku, price_override_kobo,
              low_stock_threshold, allow_preorder, is_active)
  on public.product_variants to authenticated;
grant update (size_id, colour_id, sku, price_override_kobo,
              low_stock_threshold, allow_preorder, is_active)
  on public.product_variants to authenticated;

-- -----------------------------------------------------------------------------
-- Never delete anything that appears on an order
-- -----------------------------------------------------------------------------
create or replace function public.prevent_delete_if_ordered()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'products'
     and exists (select 1 from public.order_items where product_id = old.id) then
    raise exception 'This product has been ordered, so it can only be archived.'
      using errcode = 'P0001';
  end if;
  if tg_table_name = 'product_variants'
     and exists (select 1 from public.order_items where variant_id = old.id) then
    raise exception 'This size/colour has been ordered, so it can only be switched off.'
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger prevent_delete_if_ordered before delete on public.products
  for each row execute function public.prevent_delete_if_ordered();
create trigger prevent_delete_if_ordered before delete on public.product_variants
  for each row execute function public.prevent_delete_if_ordered();

-- -----------------------------------------------------------------------------
-- Publishing rules
-- -----------------------------------------------------------------------------
create or replace function public.check_product_publishable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if new.price_kobo <= 0 then
      raise exception 'Set a price before publishing.' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.product_images where product_id = new.id) then
      raise exception 'Add at least one photo before publishing.' using errcode = 'P0001';
    end if;
    if not new.is_coming_soon
       and not exists (select 1 from public.product_variants
                       where product_id = new.id and is_active) then
      raise exception 'Add at least one size before publishing.' using errcode = 'P0001';
    end if;
    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger check_product_publishable before insert or update on public.products
  for each row execute function public.check_product_publishable();

commit;
