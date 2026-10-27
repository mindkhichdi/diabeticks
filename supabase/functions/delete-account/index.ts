import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Foreign keys to auth.users don't cascade, so every table is cleared explicitly.
// daily_meal_plans rows go with their weekly_diet_plans parent (ON DELETE CASCADE).
const USER_TABLES: { table: string; column: string }[] = [
  { table: "blood_sugar_readings", column: "user_id" },
  { table: "fitness_logs", column: "user_id" },
  { table: "food_logs", column: "user_id" },
  { table: "medicine_logs", column: "user_id" },
  { table: "medicine_preferences", column: "user_id" },
  { table: "prescriptions", column: "user_id" },
  { table: "weekly_diet_plans", column: "user_id" },
  { table: "user_stats", column: "user_id" },
  { table: "profiles", column: "id" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;

    // Who is asking? Only ever the signed-in user's own account.
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Uploaded prescription files live under <user id>/ in the 'prescriptions' bucket.
    const bucket = admin.storage.from("prescriptions");
    const { data: files } = await bucket.list(user.id, { limit: 1000 });
    if (files?.length) {
      const { error } = await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
      if (error) throw error;
    }

    // Files uploaded from the web app sit at the bucket root; their paths are on the prescription rows.
    const { data: rows } = await admin.from("prescriptions").select("file_path").eq("user_id", user.id);
    const strays = (rows ?? []).map((r) => r.file_path).filter((p) => p && !p.startsWith(`${user.id}/`));
    if (strays.length) {
      const { error } = await bucket.remove(strays);
      if (error) throw error;
    }

    for (const { table, column } of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq(column, user.id);
      if (error) throw new Error(`${table}: ${error.message}`);
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ ok: true });
  } catch (e) {
    console.error("delete-account failed", e);
    return json({ error: "Couldn't delete the account. Try again." }, 500);
  }
});
