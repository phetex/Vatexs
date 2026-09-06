import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const adminId = ctx.userClaims!.id;
    const { data: adminProfile } = await ctx.supabaseAdmin.from('profiles').select('is_admin').eq('id', adminId).single();
    if (!adminProfile?.is_admin) {
      return Response.json({ error: 'Only admins can send broadcasts' }, { status: 403 });
    }

    const { title, body } = await req.json();
    if (!title?.trim() || !body?.trim()) {
      return Response.json({ error: 'title and body are required' }, { status: 400 });
    }

    const { data: tokenRows } = await ctx.supabaseAdmin.from('push_tokens').select('token');
    const tokens = [...new Set((tokenRows ?? []).map((t: { token: string }) => t.token))];

    if (tokens.length === 0) {
      return Response.json({ sent: 0, message: 'No devices with push notifications enabled yet.' });
    }

    const batches = chunk(tokens, 100);
    for (const batch of batches) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.map((token) => ({ to: token, title: title.trim(), body: body.trim(), sound: 'default', data: { type: 'broadcast' } }))),
      });
    }

    return Response.json({ sent: tokens.length });
  }),
};
