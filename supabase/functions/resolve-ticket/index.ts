import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { sendUserNotification } from '../_shared/resend.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const callerId = ctx.userClaims!.id;
    const { ticket_id, status, resolution_note } = await req.json();

    if (!ticket_id || !['resolved', 'closed'].includes(status)) {
      return Response.json({ error: "ticket_id and a valid status ('resolved' or 'closed') are required" }, { status: 400 });
    }

    const { data: callerProfile } = await ctx.supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', callerId)
      .single();

    if (!callerProfile?.is_admin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: ticket, error: updateError } = await ctx.supabaseAdmin
      .from('support_tickets')
      .update({ status, resolution_note: resolution_note ?? null, resolved_at: new Date().toISOString() })
      .eq('id', ticket_id)
      .select('reporter_id, subject')
      .single();

    if (updateError || !ticket) {
      return Response.json({ error: updateError?.message ?? 'Ticket not found' }, { status: 404 });
    }

    const { data: reporterUser } = await ctx.supabaseAdmin.auth.admin.getUserById(ticket.reporter_id);
    if (reporterUser?.user?.email) {
      await sendUserNotification(
        reporterUser.user.email,
        `[Vatexs] Your ticket has been ${status}: ${ticket.subject}`,
        `<p>Your support ticket "${ticket.subject}" has been marked as <strong>${status}</strong>.</p>
         ${resolution_note ? `<p>${resolution_note}</p>` : ''}`
      );
    }

    return Response.json({ updated: true });
  }),
};
