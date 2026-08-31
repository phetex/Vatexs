import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { initiateTransfer } from '../_shared/paystack.ts';
import { sendPushToUser } from '../_shared/push.ts';
import { sendUserNotification } from '../_shared/resend.ts';
import { buildOrderNotePdf, base64FromBytes } from '../_shared/pdf.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const buyerId = ctx.userClaims!.id;
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const { data: order, error: orderError } = await ctx.supabaseAdmin
      .from('orders')
      .select(
        'id, buyer_id, seller_id, amount, currency, commission_amount, payout_amount, paystack_reference, status, ' +
          'listings ( title ), buyer:profiles!orders_buyer_id_fkey ( full_name ), seller:profiles!orders_seller_id_fkey ( full_name )'
      )
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
      .select('paystack_recipient_code, bank_name, account_number_last4')
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

    const releasedAt = new Date().toISOString();
    await ctx.supabaseAdmin.from('orders').update({ status: 'released', released_at: releasedAt }).eq('id', order.id);

    await sendPushToUser(ctx.supabaseAdmin, order.seller_id, 'Payment released 💸', 'The buyer confirmed receipt and your payout is on its way.', {
      type: 'order_released',
      order_id: order.id,
    });

    // Order is closed — issue the Goods Received Note (buyer) and Issue Note (seller).
    // Best-effort: never fail the release itself if email/PDF generation has a problem.
    try {
      const itemTitle = (order.listings as unknown as { title: string } | null)?.title ?? 'Vatexs item';
      const buyerName = (order.buyer as unknown as { full_name: string } | null)?.full_name || 'Vatexs buyer';
      const sellerName = (order.seller as unknown as { full_name: string } | null)?.full_name || 'Vatexs seller';
      const noteBase = {
        orderId: order.id,
        paystackReference: order.paystack_reference,
        itemTitle,
        amount: Number(order.amount),
        currency: order.currency,
        commissionAmount: Number(order.commission_amount),
        payoutAmount: Number(order.payout_amount),
        buyerName,
        sellerName,
        releasedAt,
      };

      const [grnBytes, issueNoteBytes] = await Promise.all([
        buildOrderNotePdf({ ...noteBase, type: 'grn' }),
        buildOrderNotePdf({
          ...noteBase,
          type: 'issue_note',
          bankName: payoutAccount.bank_name,
          bankLast4: payoutAccount.account_number_last4,
        }),
      ]);

      const [{ data: buyerUser }, { data: sellerUser }] = await Promise.all([
        ctx.supabaseAdmin.auth.admin.getUserById(order.buyer_id),
        ctx.supabaseAdmin.auth.admin.getUserById(order.seller_id),
      ]);

      await Promise.all([
        buyerUser?.user?.email
          ? sendUserNotification(
              buyerUser.user.email,
              'Your Goods Received Note — Vatexs',
              `<p>Hi ${buyerName},</p><p>Your order for <strong>${itemTitle}</strong> is closed. Attached is your Goods Received Note confirming the item and payment release.</p>`,
              [{ filename: `vatexs-grn-${order.id.slice(0, 8)}.pdf`, content: base64FromBytes(grnBytes) }]
            )
          : Promise.resolve(),
        sellerUser?.user?.email
          ? sendUserNotification(
              sellerUser.user.email,
              'Your Issue Note — Vatexs',
              `<p>Hi ${sellerName},</p><p>Your order for <strong>${itemTitle}</strong> is closed and your payout has been released. Attached is your Issue Note.</p>`,
              [{ filename: `vatexs-issue-note-${order.id.slice(0, 8)}.pdf`, content: base64FromBytes(issueNoteBytes) }]
            )
          : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('Failed to generate/email order notes', err);
    }

    return Response.json({ released: true });
  }),
};
