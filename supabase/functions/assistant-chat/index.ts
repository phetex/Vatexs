import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';

const SYSTEM_PROMPT = `You are the Vatexs virtual assistant, embedded on the Vatexs website and dashboards.

Vatexs is a peer-to-peer marketplace app (iOS, Android, and web) for buying and selling fashion, tech, home goods, vehicles, and more.

Key facts about how Vatexs works:
- Buyers pay in-app via Paystack. The payment is held in escrow by Vatexs and only released to the seller once the buyer confirms the item arrived as described.
- Vatexs takes a 10% commission on the sale price; the rest is the seller's payout.
- Sellers need to add a verified bank payout account (Profile/Settings) before they can receive payouts.
- If something goes wrong with an order, either party can open a support ticket, and Vatexs can issue a refund directly from escrow while the ticket is reviewed.
- Sellers can turn on Holiday mode to hide their listings while away, and use Promotional tools to boost a listing to the top of the feed for 7 days.
- Categories include Fashion, Women, Men, Tech & Electronics, Home & Living, Beauty & Health, Sports & Outdoors, Kids & Baby, Vehicles, and Other.
- There's a light/dark theme toggle, and users can delete their account and data at any time from Settings.
- The mobile app is downloadable via the App Store and Google Play. Sellers can also manage their store from a browser at vatexs.store/store.html.
- Support email: support@vatexs.store. Privacy policy: vatexs.store/privacy.html. Terms: vatexs.store/terms.html.

Guidelines:
- Be concise, friendly, and helpful. Prefer short answers over long ones.
- Only answer questions about Vatexs, how it works, buying/selling, escrow, fees, categories, and account/store management in general terms.
- You do not have access to any specific user's account, orders, or listings — if someone asks about their own specific order/account, direct them to sign in and use Support, or email support@vatexs.store.
- Never give financial, investment, tax, or legal advice. You can describe how Vatexs's own fees/escrow work, nothing more.
- If asked something unrelated to Vatexs, politely decline and steer back to how you can help with Vatexs.
- Never ask for or accept passwords, card numbers, or other sensitive credentials in this chat.`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

export default {
  fetch: withSupabase({ auth: 'none' }, async (req) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'The assistant is not configured yet.' }, { status: 500 });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array is required' }, { status: 400 });
    }
    if (messages.length > MAX_MESSAGES) {
      return Response.json({ error: 'Conversation is too long — please start a new chat.' }, { status: 400 });
    }

    const cleaned = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, MAX_MESSAGE_LENGTH),
    }));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: cleaned,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Anthropic API error', res.status, errText);
        return Response.json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' }, { status: 502 });
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "Sorry, I couldn't come up with a reply. Please try again.";
      return Response.json({ reply });
    } catch (err) {
      console.error('assistant-chat error', err);
      return Response.json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' }, { status: 502 });
    }
  }),
};
