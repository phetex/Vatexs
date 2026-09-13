import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { initializeTransaction, splitAmount } from '../_shared/paystack.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const buyerId = ctx.userClaims!.id;
    const buyerEmail = ctx.userClaims!.email;
    const { listing_id, redirect_url, use_wallet_credit } = await req.json();

    if (!listing_id) {
      return Response.json({ error: 'listing_id is required' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await ctx.supabaseAdmin
      .from('listings')
      .select('id, seller_id, title, price, currency, status, profiles!listings_seller_id_fkey ( holiday_mode )')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.status !== 'active') {
      return Response.json({ error: 'This listing is no longer available' }, { status: 409 });
    }
    if ((listing.profiles as unknown as { holiday_mode: boolean } | null)?.holiday_mode) {
      return Response.json({ error: 'This seller is currently away and not accepting orders' }, { status: 409 });
    }
    if (listing.seller_id === buyerId) {
      return Response.json({ error: 'You cannot buy your own listing' }, { status: 400 });
    }
    if (listing.currency !== 'NGN') {
      return Response.json(
        { error: 'In-app payment is currently only available for listings priced in NGN' },
        { status: 400 }
      );
    }

    let walletCreditUsed = 0;
    if (use_wallet_credit) {
      const { data: buyerProfile } = await ctx.supabaseAdmin.from('profiles').select('wallet_credit_ngn').eq('id', buyerId).single();
      const available = Number(buyerProfile?.wallet_credit_ngn ?? 0);
      const maxDiscount = Math.max(0, Number(listing.price) - 100); // leave at least ₦100 to charge
      walletCreditUsed = Math.min(available, maxDiscount);
    }
    const chargeAmount = Number(listing.price) - walletCreditUsed;

    const { commission, payout } = splitAmount(chargeAmount);
    const reference = `vatexs_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data: order, error: orderError } = await ctx.supabaseAdmin
      .from('orders')
      .insert({
        listing_id: listing.id,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        amount: chargeAmount,
        currency: listing.currency,
        commission_amount: commission,
        payout_amount: payout,
        paystack_reference: reference,
        wallet_credit_used: walletCreditUsed,
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      return Response.json({ error: orderError?.message ?? 'Could not create order' }, { status: 500 });
    }

    try {
      const result = await initializeTransaction({
        email: buyerEmail!,
        amountKobo: Math.round(chargeAmount * 100),
        reference,
        callbackUrl: redirect_url || 'vatexs://payment-callback',
        metadata: { order_id: order.id, listing_id: listing.id, listing_title: listing.title },
      });

      return Response.json({
        authorization_url: result.data.authorization_url,
        reference,
        order_id: order.id,
        wallet_credit_used: walletCreditUsed,
      });
    } catch (err) {
      await ctx.supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      return Response.json({ error: (err as Error).message }, { status: 502 });
    }
  }),
};
