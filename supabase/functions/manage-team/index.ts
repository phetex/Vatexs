import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { callerHasAal2 } from '../_shared/aal.ts';
import { sendPushToUser } from '../_shared/push.ts';

const ROLES = ['admin', 'staff', 'none'];
const ROLE_LABEL: Record<string, string> = { admin: 'Admin', staff: 'Staff', none: 'regular user' };

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const callerId = ctx.userClaims!.id;
    const admin = ctx.supabaseAdmin;
    const { action, ...params } = await req.json();

    const { data: caller } = await admin.from('profiles').select('is_admin, full_name').eq('id', callerId).single();
    if (!caller?.is_admin) return Response.json({ error: 'Admin access required' }, { status: 403 });
    if (!callerHasAal2(req)) {
      return Response.json({ error: 'Two-factor authentication required for this action. Sign in through the admin portal and complete the code challenge.' }, { status: 403 });
    }

    if (action === 'list') {
      const { data: members } = await admin
        .from('profiles')
        .select('id, full_name, is_admin, is_staff, created_at')
        .or('is_admin.eq.true,is_staff.eq.true')
        .order('created_at', { ascending: true });

      const enriched = await Promise.all(
        (members ?? []).map(async (m) => {
          const { data: u } = await admin.auth.admin.getUserById(m.id);
          let mfa = false;
          try {
            const { data: f } = await admin.auth.admin.mfa.listFactors({ userId: m.id });
            mfa = !!f?.factors?.some((x: { status: string }) => x.status === 'verified');
          } catch { /* leave as not enrolled */ }
          return {
            id: m.id,
            full_name: m.full_name,
            role: m.is_admin ? 'admin' : 'staff',
            email: u?.user?.email ?? null,
            last_sign_in_at: u?.user?.last_sign_in_at ?? null,
            mfa_enrolled: mfa,
          };
        })
      );
      return Response.json({ members: enriched });
    }

    if (action === 'find') {
      const email = String(params.email ?? '').trim().toLowerCase();
      if (!email || !email.includes('@')) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });

      let found: { id: string; email?: string } | null = null;
      for (let page = 1; page <= 10 && !found; page++) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        const users = data?.users ?? [];
        found = users.find((u) => u.email?.toLowerCase() === email) ?? null;
        if (users.length < 1000) break;
      }
      if (!found) return Response.json({ error: 'No Vatexs account uses that email. They need to sign up in the app first.' }, { status: 404 });

      const { data: profile } = await admin.from('profiles').select('id, full_name, is_admin, is_staff, banned_at').eq('id', found.id).single();
      if (!profile) return Response.json({ error: 'That account has no profile yet.' }, { status: 404 });
      return Response.json({
        user: {
          id: profile.id,
          email: found.email,
          full_name: profile.full_name,
          role: profile.is_admin ? 'admin' : profile.is_staff ? 'staff' : 'none',
          banned: !!profile.banned_at,
        },
      });
    }

    if (action === 'set_role') {
      const userId = String(params.user_id ?? '');
      const role = String(params.role ?? '');
      if (!userId || !ROLES.includes(role)) return Response.json({ error: 'user_id and a valid role are required.' }, { status: 400 });
      if (userId === callerId) return Response.json({ error: "You can't change your own role. Ask another admin." }, { status: 400 });

      const { data: target } = await admin.from('profiles').select('id, full_name, is_admin, is_staff, banned_at').eq('id', userId).single();
      if (!target) return Response.json({ error: 'User not found.' }, { status: 404 });
      if (target.banned_at && role !== 'none') return Response.json({ error: 'That account is banned and cannot be given a team role.' }, { status: 400 });

      const currentRole = target.is_admin ? 'admin' : target.is_staff ? 'staff' : 'none';
      if (currentRole === role) return Response.json({ error: `They are already ${ROLE_LABEL[role]}.` }, { status: 400 });

      if (target.is_admin && role !== 'admin') {
        const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', true);
        if ((count ?? 0) <= 1) return Response.json({ error: 'There must always be at least one admin.' }, { status: 400 });
      }

      const { error: updateError } = await admin.from('profiles').update({ is_admin: role === 'admin', is_staff: role === 'staff' }).eq('id', userId);
      if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

      await admin.from('team_audit_log').insert({
        actor_id: callerId,
        action: `role_${currentRole}_to_${role}`,
        target_id: userId,
        detail: `${caller.full_name || 'An admin'} changed ${target.full_name || 'a user'} from ${ROLE_LABEL[currentRole]} to ${ROLE_LABEL[role]}`,
      });

      const message = role === 'none' ? 'Your Vatexs team access has been removed.' : `You are now ${ROLE_LABEL[role]} on the Vatexs team. Sign in to the admin portal to get started.`;
      await sendPushToUser(admin, userId, 'Team role updated', message, { type: 'team_role' });

      const { data: otherAdmins } = await admin.from('profiles').select('id').eq('is_admin', true).neq('id', callerId);
      for (const a of otherAdmins ?? []) {
        await sendPushToUser(admin, a.id, 'Team change', `${target.full_name || 'A user'} is now ${ROLE_LABEL[role]} (changed by ${caller.full_name || 'an admin'}).`, { type: 'team_role' });
      }
      return Response.json({ ok: true });
    }

    if (action === 'audit') {
      const { data } = await admin
        .from('team_audit_log')
        .select('id, action, detail, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
      return Response.json({ entries: data ?? [] });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  }),
};
