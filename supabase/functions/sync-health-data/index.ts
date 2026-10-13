import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const Sample = z.object({
  date: z.string().min(1).max(64),
  value: z.coerce.number().positive().max(1000),
  unit: z.string().max(16).optional(),
});
const Body = z.object({ samples: z.array(Sample).max(5000) });

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = req.headers.get('x-sync-token') ?? new URL(req.url).searchParams.get('token');
  if (!token || token.length < 20 || token.length > 200) return json({ error: 'Missing sync token' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: row } = await admin
    .from('health_sync_tokens').select('user_id').eq('token_hash', await sha256(token)).maybeSingle();
  if (!row) return json({ error: 'Invalid sync token' }, 401);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  // Accept either {samples:[...]} or a bare array
  const parsed = Body.safeParse(Array.isArray(raw) ? { samples: raw } : raw);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const rows = parsed.data.samples.flatMap((s) => {
    const t = new Date(s.date);
    if (isNaN(t.getTime())) return [];
    const mmol = s.unit?.toLowerCase().includes('mmol') || s.value < 35;
    const mg = Math.round(mmol ? s.value * 18.0182 : s.value);
    if (mg < 20 || mg > 600) return [];
    return [{ user_id: row.user_id, recorded_at: t.toISOString(), value_mgdl: mg, source: 'apple_health' }];
  });

  if (rows.length) {
    const { error } = await admin.from('cgm_readings')
      .upsert(rows, { onConflict: 'user_id,recorded_at,source', ignoreDuplicates: true });
    if (error) return json({ error: 'Could not save readings' }, 500);
  }
  await admin.from('health_sync_tokens').update({ last_synced_at: new Date().toISOString() }).eq('user_id', row.user_id);
  return json({ received: parsed.data.samples.length, saved: rows.length });
});
