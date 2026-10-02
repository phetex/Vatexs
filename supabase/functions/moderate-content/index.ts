import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { sendPushToUser } from '../_shared/push.ts';
import { callerHasAal2 } from '../_shared/aal.ts';

const ACTIONS = ['remove_content', 'ban_user', 'dismiss'];

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const callerId = ctx.userClaims!.id;
    const { report_id, action, note } = await req.json();

    if (!report_id || !ACTIONS.includes(action)) {
      return Response.json({ error: 'report_id and a valid action are required.' }, { status: 400 });
    }

    const { data: callerProfile } = await ctx.supabaseAdmin.from('profiles').select('is_admin').eq('id', callerId).single();
    if (!callerProfile?.is_admin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (!callerHasAal2(req)) {
      return Response.json({ error: 'Two-factor authentication required for this action. Sign in through the admin portal and complete the code challenge.' }, { status: 403 });
    }

    const { data: report } = await ctx.supabaseAdmin.from('reports').select('*').eq('id', report_id).single();
    if (!report) return Response.json({ error: 'Report not found.' }, { status: 404 });

    const resolutionNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null;
    const now = new Date().toISOString();

    if (action !== 'dismiss') {
      // Take down the reported content (kept as a snapshot on the report for evidence).
      if (report.target_type === 'listing') {
        await ctx.supabaseAdmin.from('listings').update({ status: 'hidden', featured: false }).eq('id', report.target_id);
      } else if (report.target_type === 'message') {
        await ctx.supabaseAdmin.from('messages').delete().eq('id', report.target_id);
      }
    }

    if (action === 'ban_user' && report.reported_user_id) {
      const offenderId = report.reported_user_id as string;
      // Eject from Supabase Auth: blocks sign-in and token refresh (effectively permanent).
      const { error: banError } = await ctx.supabaseAdmin.auth.admin.updateUserById(offenderId, { ban_duration: '876000h' });
      if (banError) return Response.json({ error: banError.message }, { status: 500 });

      await ctx.supabaseAdmin
        .from('profiles')
        .update({ banned_at: now, ban_reason: resolutionNote ?? report.reason })
        .eq('id', offenderId);
      await ctx.supabaseAdmin.from('listings').update({ status: 'hidden', featured: false }).eq('seller_id', offenderId).eq('status', 'active');

      // Every other open report against this user is resolved by the ban.
      await ctx.supabaseAdmin
        .from('reports')
        .update({ status: 'actioned', resolution_note: resolutionNote ?? 'User removed from Vatexs.', resolved_at: now })
        .eq('reported_user_id', offenderId)
        .eq('status', 'open');
    }

    const { data: updated } = await ctx.supabaseAdmin
      .from('reports')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'actioned',
        resolution_note: resolutionNote,
        resolved_at: now,
      })
      .eq('id', report_id)
      .select('reporter_id')
      .single();

    // Report reasons of "blocked" are system-generated, so there's nothing to thank anyone for.
    if (updated?.reporter_id && report.reason !== 'blocked') {
      await sendPushToUser(
        ctx.supabaseAdmin,
        updated.reporter_id,
        'Thanks for your report',
        action === 'dismiss'
          ? 'We reviewed your report and found no violation of our Terms.'
          : 'We reviewed your report and took action. Thank you for helping keep Vatexs safe.',
        { type: 'report_update', report_id }
      );
    }

    return Response.json({ updated: true });
  }),
};
