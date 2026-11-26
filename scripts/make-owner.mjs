// Gives an existing Supabase login the Owner role in the admin dashboard.
// Usage: node --env-file=.env.local scripts/make-owner.mjs [email]
// With no email, it promotes the only user if exactly one exists.
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const wanted = process.argv[2]?.trim().toLowerCase();
const { data, error } = await db.auth.admin.listUsers({ perPage: 200 });
if (error) {
  console.error("Could not list users:", error.message);
  process.exit(1);
}

const users = wanted ? data.users.filter((u) => u.email?.toLowerCase() === wanted) : data.users;
if (users.length !== 1) {
  console.error(
    wanted
      ? "No user with that email. Create it first in Supabase → Authentication → Users."
      : `Found ${users.length} users. Pass the email: node --env-file=.env.local scripts/make-owner.mjs you@example.com`,
  );
  process.exit(1);
}

const user = users[0];
const { error: upsertError } = await db
  .from("admin_users")
  .upsert({ user_id: user.id, role: "owner" }, { onConflict: "user_id" });
if (upsertError) {
  console.error("Could not save admin role:", upsertError.message);
  process.exit(1);
}

const [name, domain] = (user.email ?? "").split("@");
console.log(`Owner role granted to ${name.slice(0, 2)}***@${domain}.`);
