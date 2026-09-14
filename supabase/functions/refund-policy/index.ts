import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { buildRefundPolicyPdf, base64FromBytes } from '../_shared/pdf.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims!.id;
    const { order_id } = await req.json().catch(() => ({ order_id: null }));

    let reference: string | null = null;

    if (order_id) {
      const { data: order } = await ctx.supabaseAdmin
        .from('orders')
        .select('buyer_id, seller_id, paystack_reference')
        .eq('id', order_id)
        .single();

      if (order) {
        const { data: requester } = await ctx.supabaseAdmin.from('profiles').select('is_admin').eq('id', userId).single();
        const authorized = !!requester?.is_admin || order.buyer_id === userId || order.seller_id === userId;
        if (authorized) reference = order.paystack_reference;
      }
    }

    const bytes = await buildRefundPolicyPdf(reference);
    const base64 = base64FromBytes(bytes);

    return Response.json({ base64, filename: 'vatexs-refund-policy.pdf' });
  }),
};
