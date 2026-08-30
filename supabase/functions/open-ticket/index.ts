import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { sendSupportNotification } from '../_shared/resend.ts';

const CATEGORY_LABEL: Record<string, string> = {
  item_not_received: 'Item not received',
  item_not_as_described: 'Item not as described',
  payment_issue: 'Payment issue',
  account: 'Account issue',
  other: 'Other',
};

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const reporterId = ctx.userClaims!.id;
    const reporterEmail = ctx.userClaims!.email;
    const { order_id, category, subject, message } = await req.json();

    if (!category || !subject || !message) {
      return Response.json({ error: 'category, subject and message are required' }, { status: 400 });
    }

    if (order_id) {
      const { data: order } = await ctx.supabaseAdmin
        .from('orders')
        .select('id, buyer_id, seller_id')
        .eq('id', order_id)
        .single();
      if (!order || (order.buyer_id !== reporterId && order.seller_id !== reporterId)) {
        return Response.json({ error: 'You are not a participant on this order' }, { status: 403 });
      }
    }

    const { data: ticket, error: ticketError } = await ctx.supabaseAdmin
      .from('support_tickets')
      .insert({ order_id: order_id ?? null, reporter_id: reporterId, category, subject, message })
      .select('id')
      .single();

    if (ticketError || !ticket) {
      return Response.json({ error: ticketError?.message ?? 'Could not open ticket' }, { status: 500 });
    }

    await ctx.supabaseAdmin.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: reporterId,
      is_admin_reply: false,
      body: message,
    });

    await sendSupportNotification(
      `[Vatexs] New ${CATEGORY_LABEL[category] ?? category} ticket: ${subject}`,
      `<p><strong>From:</strong> ${reporterEmail}</p>
       <p><strong>Category:</strong> ${CATEGORY_LABEL[category] ?? category}</p>
       ${order_id ? `<p><strong>Order:</strong> ${order_id}</p>` : ''}
       <p><strong>Message:</strong></p>
       <p>${message}</p>`
    );

    return Response.json({ ticket_id: ticket.id });
  }),
};
