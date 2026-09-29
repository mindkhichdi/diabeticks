import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PROMPT = `Identify the food in this photo and estimate its nutrition for the portion shown.
Respond with ONLY a JSON object, no markdown:
{"food_item": string, "quantity": string (e.g. "1 plate", "2 rotis"), "calories": number (kcal), "proteins": number (g), "carbs": number (g), "fats": number (g)}
If the photo shows no food, respond {"error": "no_food"}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured." }, 500);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Please sign in again." }, 401);

    const { image } = await req.json().catch(() => ({}));
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 8_000_000) {
      return json({ error: "Please upload a food photo." }, 400);
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{ role: "user", content: [{ type: "input_text", text: PROMPT }, { type: "input_image", image_url: image }] }],
        store: false,
        reasoning: { effort: "low" },
      }),
    });

    if (!upstream.ok) {
      console.error("gateway", upstream.status, await upstream.text());
      const msg = upstream.status === 429 ? "Too many requests right now. Try again in a minute."
        : upstream.status === 402 ? "AI credits have run out."
        : "Couldn't read that photo right now.";
      return json({ error: msg }, upstream.status);
    }

    const data = await upstream.json();
    const text: string = data.output_text ?? (data.output ?? [])
      .flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "Couldn't read that photo. Try a clearer shot." }, 502);
    const r = JSON.parse(m[0]);
    if (r.error) return json({ error: "No food found in that photo." }, 422);
    const num = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
    return json({
      food_item: String(r.food_item ?? "Food").slice(0, 120),
      quantity: String(r.quantity ?? "1 serving").slice(0, 60),
      calories: num(r.calories), proteins: num(r.proteins), carbs: num(r.carbs), fats: num(r.fats),
    });
  } catch (e) {
    console.error(e);
    return json({ error: "Couldn't read that photo right now." }, 500);
  }
});
