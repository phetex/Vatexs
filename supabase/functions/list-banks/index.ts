import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { listBanks } from '../_shared/paystack.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async () => {
    const result = await listBanks();
    const banks = (result.data as Array<{ name: string; code: string }>).map((b) => ({
      name: b.name,
      code: b.code,
    }));
    return Response.json({ banks });
  }),
};
