// End-to-end check of the catalogue database rules (migration 0002).
// Creates a TEMPORARY admin login + test products, checks every rule, then
// deletes everything it created. Never prints secrets.
// Usage: node --env-file=.env.local scripts/test-catalogue.mjs
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const anon = createClient(url, publishable, { auth: { persistSession: false } });
const admin = createClient(url, publishable, { auth: { persistSession: false } });

let failed = 0;
function check(passed, message, detail = "") {
  if (!passed) failed++;
  console.log(`  ${passed ? "OK  " : "FAIL"}  ${message}${!passed && detail ? ` — ${detail}` : ""}`);
}

const created = { userId: null, productIds: [], paths: [], orderId: null };
const email = `catalogue-test-${randomUUID().slice(0, 8)}@example.invalid`;
const password = randomBytes(24).toString("base64url");

try {
  console.log("Setup");
  const { data: userData, error: userError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError) throw new Error(`create test user: ${userError.message}`);
  created.userId = userData.user.id;
  const { error: roleError } = await service.from("admin_users").insert({ user_id: created.userId, role: "owner" });
  if (roleError) throw new Error(`grant test role: ${roleError.message}`);
  const { error: signInError } = await admin.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`sign in: ${signInError.message}`);
  check(true, "temporary admin created and signed in");

  const { data: sizes } = await service.from("sizes").select("id, label").order("sort_order");
  const labels = (sizes ?? []).map((s) => s.label);
  check(
    JSON.stringify(labels) === JSON.stringify(["S", "M", "L", "XL", "XXL", "3XL", "One Size"]),
    "sizes are S, M, L, XL, XXL, 3XL, One Size",
    labels.join(", "),
  );
  const sizeM = sizes.find((s) => s.label === "M").id;
  const { data: type } = await service.from("product_types").select("id").limit(1).single();

  console.log("Publishing rules");
  const { data: product, error: createError } = await admin
    .from("products")
    .insert({ name: "ZZ Test Product", slug: `zz-test-${randomUUID().slice(0, 8)}`, product_type_id: type.id, price_kobo: 1500000 })
    .select("id, low_stock_threshold")
    .single();
  check(!createError, "admin can create a draft product", createError?.message);
  created.productIds.push(product.id);
  check(product.low_stock_threshold === 3, "low-stock warning defaults to 3");

  let res = await admin.from("products").update({ status: "published" }).eq("id", product.id);
  check(res.error?.message === "Add at least one photo before publishing.", "can't publish without a photo", res.error?.message);

  const path = `products/${product.id}/${randomUUID()}.jpg`;
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0xff, 0xd9]);
  const upload = await admin.storage.from("catalogue").upload(path, jpeg, { contentType: "image/jpeg" });
  check(!upload.error, "admin can upload a photo", upload.error?.message);
  if (!upload.error) created.paths.push(path);
  const anonUpload = await anon.storage
    .from("catalogue")
    .upload(`products/${product.id}/${randomUUID()}.jpg`, jpeg, { contentType: "image/jpeg" });
  check(Boolean(anonUpload.error), "shoppers can NOT upload photos");
  const badType = await admin.storage
    .from("catalogue")
    .upload(`products/${product.id}/${randomUUID()}.txt`, Buffer.from("hi"), { contentType: "text/plain" });
  check(Boolean(badType.error), "non-image files are refused");

  res = await admin.from("product_images").insert({ product_id: product.id, storage_path: path, sort_order: 10 });
  check(!res.error, "admin can record a photo", res.error?.message);

  res = await admin.from("products").update({ status: "published" }).eq("id", product.id);
  check(res.error?.message === "Add at least one size before publishing.", "can't publish without a size", res.error?.message);

  console.log("Stock rules");
  res = await admin.from("product_variants").insert({ product_id: product.id, size_id: sizeM, stock_quantity: 50 });
  check(Boolean(res.error), "admin can NOT set stock directly when adding a size");
  const { data: variant, error: variantError } = await admin
    .from("product_variants")
    .insert({ product_id: product.id, size_id: sizeM })
    .select("id, stock_quantity")
    .single();
  check(!variantError && variant.stock_quantity === 0, "admin can add a size (stock starts at 0)", variantError?.message);

  res = await admin.from("product_variants").update({ stock_quantity: 99 }).eq("id", variant.id);
  check(Boolean(res.error), "admin can NOT change stock directly (must use stock tools)");

  let rpc = await admin.rpc("set_stock", { p_variant_id: variant.id, p_quantity: 5, p_note: "test" });
  check(rpc.data === 5, "set stock to 5", rpc.error?.message);
  rpc = await admin.rpc("adjust_stock", { p_variant_id: variant.id, p_change: -2, p_note: "test" });
  check(rpc.data === 3, "−2 → 3", rpc.error?.message);
  rpc = await admin.rpc("adjust_stock", { p_variant_id: variant.id, p_change: -10 });
  check(rpc.error?.message === "Stock can't go below 0.", "stock can't go below 0", rpc.error?.message);
  rpc = await anon.rpc("adjust_stock", { p_variant_id: variant.id, p_change: 5 });
  check(Boolean(rpc.error), "shoppers can NOT change stock");

  const { data: moves } = await service
    .from("stock_movements")
    .select("change, reason")
    .eq("variant_id", variant.id)
    .order("created_at");
  check(
    moves?.length === 2 && moves[0].reason === "initial" && moves[0].change === 5 && moves[1].change === -2,
    "every stock change is recorded in the history",
    JSON.stringify(moves),
  );

  console.log("Publishing & visibility");
  res = await admin.from("products").update({ status: "published" }).eq("id", product.id).select("published_at").single();
  check(!res.error && res.data.published_at, "publishes once it has a price, photo and size", res.error?.message);

  const { data: draft } = await admin
    .from("products")
    .insert({ name: "ZZ Test Draft", slug: `zz-draft-${randomUUID().slice(0, 8)}`, product_type_id: type.id, price_kobo: 100 })
    .select("id")
    .single();
  created.productIds.push(draft.id);

  const { data: seen } = await anon.from("products").select("id").in("id", created.productIds);
  const seenIds = (seen ?? []).map((row) => row.id);
  check(seenIds.includes(product.id), "shoppers can see the published product");
  check(!seenIds.includes(draft.id), "shoppers can NOT see the draft product");
  const { data: seenVariants } = await anon.from("product_variants").select("id").eq("product_id", product.id);
  check(seenVariants?.length === 1, "shoppers can see published sizes/stock");

  const coming = await admin
    .from("products")
    .update({ is_coming_soon: true, status: "published" })
    .eq("id", draft.id);
  check(
    coming.error?.message === "Add at least one photo before publishing.",
    "Coming soon products still need a photo",
    coming.error?.message,
  );

  console.log("Ordered items are protected");
  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({
      customer_name: "Test",
      customer_email: "test@example.invalid",
      customer_phone: "08000000000",
      tracking_token_hash: randomUUID(),
      subtotal_kobo: 1500000,
      total_kobo: 1500000,
    })
    .select("id")
    .single();
  if (orderError) throw new Error(`create test order: ${orderError.message}`);
  created.orderId = order.id;
  await service.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    variant_id: variant.id,
    product_name: "ZZ Test Product",
    unit_price_kobo: 1500000,
    quantity: 1,
  });

  res = await admin.from("product_variants").delete().eq("id", variant.id);
  check(Boolean(res.error?.message?.includes("has been ordered")), "an ordered size can't be deleted", res.error?.message);
  res = await admin.from("products").delete().eq("id", product.id);
  check(Boolean(res.error?.message?.includes("has been ordered")), "an ordered product can't be deleted", res.error?.message);
  res = await admin.from("products").delete().eq("id", draft.id);
  check(!res.error, "an unordered draft can be deleted", res.error?.message);
  if (!res.error) created.productIds = created.productIds.filter((id) => id !== draft.id);
} catch (error) {
  failed++;
  console.log(`  FAIL  ${error.message}`);
} finally {
  console.log("Cleanup");
  if (created.orderId) await service.from("orders").delete().eq("id", created.orderId);
  for (const id of created.productIds) {
    await service.from("stock_movements").delete().in(
      "variant_id",
      ((await service.from("product_variants").select("id").eq("product_id", id)).data ?? []).map((v) => v.id),
    );
    await service.from("products").delete().eq("id", id);
  }
  if (created.paths.length) await service.storage.from("catalogue").remove(created.paths);
  if (created.userId) await service.auth.admin.deleteUser(created.userId);
  const { count } = await service.from("products").select("*", { count: "exact", head: true }).like("name", "ZZ Test%");
  check(count === 0, "all test data removed");
}

console.log(failed ? `\n${failed} check(s) failed.` : "\nAll catalogue checks passed.");
process.exit(failed ? 1 : 0);
