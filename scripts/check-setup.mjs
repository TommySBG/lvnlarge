// Checks that keys work and the database tables exist. Never prints secrets.
// Usage: node --env-file=.env.local scripts/check-setup.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const paystack = process.env.PAYSTACK_SECRET_KEY;

let failed = false;
function check(passed, okMessage, failMessage = okMessage) {
  if (!passed) failed = true;
  console.log(passed ? `  OK    ${okMessage}` : `  FAIL  ${failMessage}`);
}

console.log("Keys");
check(Boolean(url), "Supabase URL set", "NEXT_PUBLIC_SUPABASE_URL missing");
check(publishable?.startsWith("sb_publishable_"), "Supabase publishable key", "Supabase publishable key missing or wrong format");
check(secret?.startsWith("sb_secret_"), "Supabase secret key", "Supabase secret key missing or wrong format");
check(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith("pk_test_"), "Paystack public key (test)", "Paystack public key missing or not a test key");
check(paystack?.startsWith("sk_test_"), "Paystack secret key (test)", "Paystack secret key missing or not a test key");

if (paystack) {
  const res = await fetch("https://api.paystack.co/transaction?perPage=1", {
    headers: { Authorization: `Bearer ${paystack}` },
  });
  check(res.ok, "Paystack test API reachable", `Paystack API returned HTTP ${res.status}`);
}

if (url && secret && publishable) {
  const db = createClient(url, secret, { auth: { persistSession: false } });
  const anon = createClient(url, publishable, { auth: { persistSession: false } });

  console.log("Database tables");
  const tables = [
    "admin_users", "product_types", "sizes", "size_guides", "products", "product_colours",
    "product_variants", "product_images", "collections", "collection_products", "subscribers",
    "carts", "cart_items", "orders", "order_items", "payments", "payment_events",
    "order_status_history", "stock_movements", "admin_notifications", "gallery_images",
  ];
  for (const table of tables) {
    const { count, error } = await db.from(table).select("*", { count: "exact" }).limit(1);
    check(
      !error && count !== null,
      `${table} (${count} rows)`,
      `${table}: ${error?.message || "not found — has the SQL migration been run?"}`,
    );
  }

  console.log("Security spot-checks (as an anonymous shopper)");
  for (const table of ["orders", "subscribers", "payments", "carts"]) {
    const { data, error } = await anon.from(table).select("id").limit(1);
    check(Boolean(error) || (data ?? []).length === 0, `${table} hidden from shoppers`, `${table} is READABLE by shoppers`);
  }
  const { data: drafts } = await anon.from("collections").select("id").eq("is_published", false).limit(1);
  check((drafts ?? []).length === 0, "unpublished collections hidden", "unpublished collections visible");

  console.log("Admins");
  const { count: admins } = await db.from("admin_users").select("*", { count: "exact" }).limit(1);
  check(Boolean(admins), `${admins} admin account(s)`, "no admin yet — run scripts/make-owner.mjs");
}

console.log(failed ? "\nSome checks failed." : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
