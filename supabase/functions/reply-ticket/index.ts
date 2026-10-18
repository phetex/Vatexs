import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { sendSupportNotification, sendUserNotification } from '../_shared/resend.ts';
import { sendPushToUser } from '../_shared/push.ts';
import { callerHasAal2 } from '../_shared/aal.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const callerId = ctx.userClaims!.id;
    const { ticket_id, body } = await req.json();

    if (!ticket_id || !body) {
      return Response.json({ error: 'ticket_id and body are required' }, { status: 400 });
    }

    const { data: ticket } = await ctx.supabaseAdmin
      .from('support_tickets')
      .select('id, reporter_id, subject')
      .eq('id', ticket_id)
      .single();

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const { data: callerProfile } = await ctx.supabaseAdmin
      .from('profiles')
      .select('is_admin, is_staff')
      .eq('id', callerId)
      .single();

    // Staff reply as support only from a 2FA-verified session (the admin portal).
    const isAdmin = !!callerProfile?.is_admin || (!!callerProfile?.is_staff && callerHasAal2(req));

    if (!isAdmin && ticket.reporter_id !== callerId) {
      return Response.json({ error: 'You are not part of this ticket' }, { status: 403 });
    }

    const { error: insertError } = await ctx.supabaseAdmin.from('ticket_messages').insert({
      ticket_id,
      sender_id: callerId,
      is_admin_reply: isAdmin,
      body,
    });

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    if (isAdmin) {
      const { data: reporterUser } = await ctx.supabaseAdmin.auth.admin.getUserById(ticket.reporter_id);
      if (reporterUser?.user?.email) {
        await sendUserNotification(
          reporterUser.user.email,
          `[Vatexs] New reply on your ticket: ${ticket.subject}`,
          `<p>Vatexs support replied to your ticket "${ticket.subject}":</p><p>${body}</p>`
        );
      }
      await sendPushToUser(ctx.supabaseAdmin, ticket.reporter_id, 'Vatexs Support replied', ticket.subject, {
        type: 'ticket_reply',
        ticket_id,
      });
    } else {
      await sendSupportNotification(
        `[Vatexs] New reply on ticket: ${ticket.subject}`,
        `<p>${body}</p>`
      );
      const { data: admins } = await ctx.supabaseAdmin.from('profiles').select('id').or('is_admin.eq.true,is_staff.eq.true');
      for (const admin of admins ?? []) {
        await sendPushToUser(ctx.supabaseAdmin, admin.id, 'New ticket reply', ticket.subject, { type: 'ticket_reply', ticket_id });
      }
    }

    return Response.json({ sent: true });
  }),
};
