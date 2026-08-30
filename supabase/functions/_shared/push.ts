import { createClient } from 'npm:@supabase/supabase-js@2';

export async function sendPushToUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const { data: tokens } = await supabaseAdmin.from('push_tokens').select('token').eq('user_id', userId);
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    title,
    body,
    sound: 'default',
    data: data ?? {},
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
}
