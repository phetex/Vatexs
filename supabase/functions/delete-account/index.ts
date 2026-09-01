import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims!.id;
    const admin = ctx.supabaseAdmin;

    // Escrow integrity: refuse while money is mid-flight on any order.
    const { count: inFlightCount } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .in('status', ['pending', 'paid']);

    if (inFlightCount && inFlightCount > 0) {
      return Response.json(
        { error: 'You have an order still in progress. Please complete or resolve it before deleting your account.' },
        { status: 409 }
      );
    }

    // Any historical financial/support record blocks a hard delete (orders,
    // tickets and ticket_messages all reference profiles with no cascade, by
    // design, so those records survive). Anonymize + lock the account instead.
    const [{ count: orderHistory }, { count: ticketHistory }, { count: ticketMsgHistory }] = await Promise.all([
      admin.from('orders').select('id', { count: 'exact', head: true }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      admin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('reporter_id', userId),
      admin.from('ticket_messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
    ]);

    const hasHistory = (orderHistory ?? 0) > 0 || (ticketHistory ?? 0) > 0 || (ticketMsgHistory ?? 0) > 0;

    // Always safe to clear regardless of which path we take below.
    await Promise.all([
      admin.from('favorites').delete().eq('user_id', userId),
      admin.from('messages').delete().eq('sender_id', userId),
      admin.from('seller_payout_accounts').delete().eq('seller_id', userId),
      admin.from('push_tokens').delete().eq('user_id', userId),
      admin.from('push_debug_log').delete().eq('user_id', userId),
      admin.from('blocked_users').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    ]);

    if (!hasHistory) {
      // No financial/support record references this profile — safe to fully
      // delete the auth user, which cascades profiles -> listings/images/
      // conversations/etc.
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return Response.json({ error: `Could not delete account: ${error.message}` }, { status: 500 });
      return Response.json({ deleted: true });
    }

    // Has history: anonymize the profile and lock the auth account instead
    // of deleting it, so past orders/tickets stay resolvable.
    const { data: listings } = await admin.from('listings').select('id').eq('seller_id', userId);
    if (listings && listings.length > 0) {
      const listingIds = listings.map((l: { id: string }) => l.id);
      const { data: referenced } = await admin.from('orders').select('listing_id').in('listing_id', listingIds);
      const referencedIds = new Set((referenced ?? []).map((o: { listing_id: string }) => o.listing_id));
      const deletableIds = listingIds.filter((id: string) => !referencedIds.has(id));
      const keepIds = listingIds.filter((id: string) => referencedIds.has(id));
      if (deletableIds.length > 0) await admin.from('listings').delete().in('id', deletableIds);
      if (keepIds.length > 0) await admin.from('listings').update({ status: 'hidden' }).in('id', keepIds);
    }

    await admin
      .from('profiles')
      .update({
        full_name: 'Deleted user',
        avatar_url: null,
        phone: null,
        location: null,
        bio: null,
        interested_categories: [],
        holiday_mode: false,
      })
      .eq('id', userId);

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
      password: crypto.randomUUID() + crypto.randomUUID(),
      email: `deleted-${userId}@vatexs.store`,
    });
    if (banError) return Response.json({ error: `Could not lock account: ${banError.message}` }, { status: 500 });

    return Response.json({ deleted: true, anonymized: true });
  }),
};
