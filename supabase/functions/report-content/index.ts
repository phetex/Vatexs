import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { sendPushToUser } from '../_shared/push.ts';

const TARGET_TYPES = ['listing', 'message', 'user'];
const REASONS: Record<string, string> = {
  spam_scam: 'Spam or scam',
  offensive: 'Offensive or inappropriate',
  prohibited_item: 'Prohibited item',
  harassment: 'Harassment or abuse',
  other: 'Other',
};

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const reporterId = ctx.userClaims!.id;
    const { target_type, target_id, reason, details } = await req.json();

    if (!TARGET_TYPES.includes(target_type) || !target_id || !REASONS[reason]) {
      return Response.json({ error: 'A valid target and reason are required.' }, { status: 400 });
    }
    const cleanDetails = typeof details === 'string' ? details.trim().slice(0, 500) : '';

    let reportedUserId: string | null = null;
    let snapshot: Record<string, unknown> = {};

    if (target_type === 'listing') {
      const { data: listing } = await ctx.supabaseAdmin
        .from('listings')
        .select('id, seller_id, title, description, price, currency')
        .eq('id', target_id)
        .single();
      if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });
      reportedUserId = listing.seller_id;
      snapshot = { title: listing.title, description: listing.description, price: listing.price, currency: listing.currency };
    } else if (target_type === 'message') {
      const { data: message } = await ctx.supabaseAdmin
        .from('messages')
        .select('id, sender_id, body, conversation_id, conversations ( buyer_id, seller_id )')
        .eq('id', target_id)
        .single();
      if (!message) return Response.json({ error: 'Message not found.' }, { status: 404 });
      const convo = message.conversations as unknown as { buyer_id: string; seller_id: string } | null;
      if (!convo || (convo.buyer_id !== reporterId && convo.seller_id !== reporterId)) {
        return Response.json({ error: 'You can only report messages from your own conversations.' }, { status: 403 });
      }
      reportedUserId = message.sender_id;
      snapshot = { body: message.body, conversation_id: message.conversation_id };
    } else {
      const { data: user } = await ctx.supabaseAdmin.from('profiles').select('id, full_name').eq('id', target_id).single();
      if (!user) return Response.json({ error: 'User not found.' }, { status: 404 });
      reportedUserId = user.id;
      snapshot = { full_name: user.full_name };
    }

    if (reportedUserId === reporterId) {
      return Response.json({ error: "You can't report your own content." }, { status: 400 });
    }

    const { data: report, error: insertError } = await ctx.supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: reporterId,
        target_type,
        target_id,
        reported_user_id: reportedUserId,
        reason: REASONS[reason],
        details: cleanDetails || null,
        snapshot,
      })
      .select('id')
      .single();

    if (insertError) {
      // 23505 = this reporter already has an open report on the same target.
      if (insertError.code === '23505') return Response.json({ ok: true, duplicate: true });
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    const { data: admins } = await ctx.supabaseAdmin.from('profiles').select('id').eq('is_admin', true);
    for (const admin of admins ?? []) {
      await sendPushToUser(ctx.supabaseAdmin, admin.id, 'New content report', `${REASONS[reason]} — ${target_type} reported`, {
        type: 'new_report',
        report_id: report.id,
      });
    }

    return Response.json({ ok: true });
  }),
};
