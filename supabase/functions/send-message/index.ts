import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { sendPushToUser } from '../_shared/push.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const senderId = ctx.userClaims!.id;
    const { conversation_id, body } = await req.json();

    if (!conversation_id || !body?.trim()) {
      return Response.json({ error: 'conversation_id and body are required' }, { status: 400 });
    }

    const { data: conversation } = await ctx.supabaseAdmin
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation || (conversation.buyer_id !== senderId && conversation.seller_id !== senderId)) {
      return Response.json({ error: 'You are not part of this conversation' }, { status: 403 });
    }

    const otherId = conversation.buyer_id === senderId ? conversation.seller_id : conversation.buyer_id;
    const { count: blockCount } = await ctx.supabaseAdmin
      .from('blocked_users')
      .select('blocker_id', { count: 'exact', head: true })
      .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${senderId})`);

    if (blockCount && blockCount > 0) {
      return Response.json({ error: 'You cannot message this user' }, { status: 403 });
    }

    const { data: message, error: insertError } = await ctx.supabaseAdmin
      .from('messages')
      .insert({ conversation_id, sender_id: senderId, body: body.trim() })
      .select('id, created_at')
      .single();

    if (insertError || !message) {
      return Response.json({ error: insertError?.message ?? 'Could not send message' }, { status: 500 });
    }

    const { data: senderProfile } = await ctx.supabaseAdmin.from('profiles').select('full_name').eq('id', senderId).single();
    const recipientId = conversation.buyer_id === senderId ? conversation.seller_id : conversation.buyer_id;

    await sendPushToUser(ctx.supabaseAdmin, recipientId, senderProfile?.full_name || 'New message', body.trim(), {
      type: 'new_message',
      conversation_id,
    });

    return Response.json({ id: message.id, created_at: message.created_at });
  }),
};
