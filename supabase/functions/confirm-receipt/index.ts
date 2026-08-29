import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { initiateTransfer } from '../_shared/paystack.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const buyerId = ctx.userClaims!.id;
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const { data: order, error: orderError } = await ctx.supabaseAdmin
      .from('orders')
      .select('id, buyer_id, seller_id, payout_amount, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.buyer_id !== buyerId) {
      return Response.json({ error: 'Only the buyer can confirm receipt' }, { status: 403 });
    }
    if (order.status !== 'paid') {
      return Response.json({ error: `Order is not in a releasable state (status: ${order.status})` }, { status: 409 });
    }

    const { data: payoutAccount } = await ctx.supabaseAdmin
      .from('seller_payout_accounts')
      .select('paystack_recipient_code')
      .eq('seller_id', order.seller_id)
      .single();

    if (!payoutAccount) {
      return Response.json({ error: 'The seller has not set up a payout account yet' }, { status: 409 });
    }

    try {
      await initiateTransfer({
        amountKobo: Math.round(Number(order.payout_amount) * 100),
        recipientCode: payoutAccount.paystack_recipient_code,
        reference: `vatexs_payout_${order.id}`,
        reason: 'Vatexs order payout',
      });
    } catch (err) {
      return Response.json({ error: `Transfer failed: ${(err as Error).message}` }, { status: 502 });
    }

    await ctx.supabaseAdmin
      .from('orders')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('id', order.id);

    return Response.json({ released: true });
  }),
};
