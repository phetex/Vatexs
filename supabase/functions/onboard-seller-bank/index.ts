import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from '@supabase/server';
import { resolveAccountNumber, createTransferRecipient } from '../_shared/paystack.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const sellerId = ctx.userClaims!.id;
    const { account_number, bank_code, bank_name } = await req.json();

    if (!account_number || !bank_code || !bank_name) {
      return Response.json({ error: 'account_number, bank_code and bank_name are required' }, { status: 400 });
    }

    let resolved;
    try {
      resolved = await resolveAccountNumber(account_number, bank_code);
    } catch (err) {
      return Response.json({ error: `Could not verify account: ${(err as Error).message}` }, { status: 400 });
    }

    const accountName = resolved.data.account_name as string;

    let recipient;
    try {
      recipient = await createTransferRecipient({
        name: accountName,
        accountNumber: account_number,
        bankCode: bank_code,
      });
    } catch (err) {
      return Response.json({ error: `Could not save payout account: ${(err as Error).message}` }, { status: 502 });
    }

    const last4 = String(account_number).slice(-4);

    const { error: upsertError } = await ctx.supabaseAdmin.from('seller_payout_accounts').upsert({
      seller_id: sellerId,
      paystack_recipient_code: recipient.data.recipient_code,
      bank_name,
      account_name: accountName,
      account_number_last4: last4,
    });

    if (upsertError) {
      return Response.json({ error: upsertError.message }, { status: 500 });
    }

    return Response.json({ account_name: accountName, bank_name, last4 });
  }),
};
