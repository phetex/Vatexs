import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { buildOrderNotePdf, base64FromBytes, type OrderNoteType } from '../_shared/pdf.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims!.id;
    const { order_id, type } = await req.json();

    if (!order_id || (type !== 'grn' && type !== 'issue_note')) {
      return Response.json({ error: 'order_id and a valid type ("grn" or "issue_note") are required' }, { status: 400 });
    }
    const noteType = type as OrderNoteType;

    const { data: order, error: orderError } = await ctx.supabaseAdmin
      .from('orders')
      .select(
        'id, buyer_id, seller_id, amount, currency, commission_amount, payout_amount, paystack_reference, status, released_at, ' +
          'listings ( title ), buyer:profiles!orders_buyer_id_fkey ( full_name, is_admin ), seller:profiles!orders_seller_id_fkey ( full_name )'
      )
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: requester } = await ctx.supabaseAdmin.from('profiles').select('is_admin').eq('id', userId).single();
    const isAdmin = !!requester?.is_admin;
    const isBuyer = order.buyer_id === userId;
    const isSeller = order.seller_id === userId;

    if (noteType === 'grn' && !isBuyer && !isAdmin) {
      return Response.json({ error: 'Only the buyer can access the Goods Received Note' }, { status: 403 });
    }
    if (noteType === 'issue_note' && !isSeller && !isAdmin) {
      return Response.json({ error: 'Only the seller can access the Issue Note' }, { status: 403 });
    }
    if (order.status !== 'released') {
      return Response.json({ error: 'This note is only available once the order is closed (released)' }, { status: 409 });
    }

    let bankName: string | null = null;
    let bankLast4: string | null = null;
    if (noteType === 'issue_note') {
      const { data: payoutAccount } = await ctx.supabaseAdmin
        .from('seller_payout_accounts')
        .select('bank_name, account_number_last4')
        .eq('seller_id', order.seller_id)
        .single();
      bankName = payoutAccount?.bank_name ?? null;
      bankLast4 = payoutAccount?.account_number_last4 ?? null;
    }

    const bytes = await buildOrderNotePdf({
      type: noteType,
      orderId: order.id,
      paystackReference: order.paystack_reference,
      itemTitle: (order.listings as unknown as { title: string } | null)?.title ?? 'Vatexs item',
      amount: Number(order.amount),
      currency: order.currency,
      commissionAmount: Number(order.commission_amount),
      payoutAmount: Number(order.payout_amount),
      buyerName: (order.buyer as unknown as { full_name: string } | null)?.full_name || 'Vatexs buyer',
      sellerName: (order.seller as unknown as { full_name: string } | null)?.full_name || 'Vatexs seller',
      bankName,
      bankLast4,
      releasedAt: order.released_at ?? new Date().toISOString(),
    });

    return Response.json({ base64: base64FromBytes(bytes), filename: `vatexs-${noteType}-${order.id.slice(0, 8)}.pdf` });
  }),
};
