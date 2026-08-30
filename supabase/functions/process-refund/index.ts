import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { refundTransaction } from '../_shared/paystack.ts';
import { sendUserNotification } from '../_shared/resend.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const callerId = ctx.userClaims!.id;
    const { order_id, ticket_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const { data: callerProfile } = await ctx.supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', callerId)
      .single();

    if (!callerProfile?.is_admin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: order } = await ctx.supabaseAdmin
      .from('orders')
      .select('id, buyer_id, paystack_reference, status, amount')
      .eq('id', order_id)
      .single();

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'paid') {
      return Response.json(
        { error: `Only orders still held in escrow can be refunded this way (status is "${order.status}"). Funds already released to the seller need to be recovered manually.` },
        { status: 409 }
      );
    }

    try {
      await refundTransaction(order.paystack_reference);
    } catch (err) {
      return Response.json({ error: `Refund failed: ${(err as Error).message}` }, { status: 502 });
    }

    await ctx.supabaseAdmin.from('orders').update({ status: 'refunded' }).eq('id', order.id);

    if (ticket_id) {
      await ctx.supabaseAdmin
        .from('support_tickets')
        .update({ status: 'refunded', resolved_at: new Date().toISOString() })
        .eq('id', ticket_id);
    }

    const { data: buyerUser } = await ctx.supabaseAdmin.auth.admin.getUserById(order.buyer_id);
    if (buyerUser?.user?.email) {
      await sendUserNotification(
        buyerUser.user.email,
        `[Vatexs] Your order has been refunded`,
        `<p>Your payment has been refunded and should appear back on your original payment method shortly.</p>`
      );
    }

    return Response.json({ refunded: true });
  }),
};
