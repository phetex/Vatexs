const SUPPORT_INBOX = 'hello@vatexs.store';

export async function sendSupportNotification(subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) {
    console.error('RESEND_API_KEY is not set; skipping support notification email');
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vatexs Support <noreply@vatexs.store>',
      to: SUPPORT_INBOX,
      subject,
      html,
    }),
  });
}

export async function sendUserNotification(to: string, subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) {
    console.error('RESEND_API_KEY is not set; skipping user notification email');
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vatexs Support <noreply@vatexs.store>',
      to,
      subject,
      html,
    }),
  });
}
