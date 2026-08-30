import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { verifyWebhookSignature } from '../_shared/paystack.ts';
import { sendPushToUser } from '../_shared/push.ts';

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    const valid = await verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return new Response('invalid signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const reference = event.data.reference as string;
      const amountKobo = event.data.amount as number;

      const { data: order } = await ctx.supabaseAdmin
        .from('orders')
        .select('id, listing_id, seller_id, amount, status, listings ( title )')
        .eq('paystack_reference', reference)
        .single();

      if (order && order.status === 'pending' && Math.round(Number(order.amount) * 100) === amountKobo) {
        await ctx.supabaseAdmin
          .from('orders')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', order.id);

        await ctx.supabaseAdmin
          .from('listings')
          .update({ status: 'sold' })
          .eq('id', order.listing_id)
          .eq('status', 'active');

        const listingTitle = (order.listings as unknown as { title: string } | null)?.title ?? 'your item';
        await sendPushToUser(ctx.supabaseAdmin, order.seller_id, 'You made a sale! 🎉', `Someone just paid for "${listingTitle}".`, {
          type: 'order_paid',
          order_id: order.id,
        });
      }
    }

    return Response.json({ received: true });
  }),
};
