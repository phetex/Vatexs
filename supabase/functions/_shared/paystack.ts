const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey() {
  const key = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

async function paystackFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!res.ok || body.status === false) {
    throw new Error(body.message ?? `Paystack request to ${path} failed`);
  }
  return body;
}

export interface InitializeTransactionParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export function initializeTransaction(params: InitializeTransactionParams) {
  return paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

export function verifyTransaction(reference: string) {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function listBanks(country = 'nigeria') {
  return paystackFetch(`/bank?country=${encodeURIComponent(country)}&currency=NGN`);
}

export function resolveAccountNumber(accountNumber: string, bankCode: string) {
  return paystackFetch(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`);
}

export interface CreateRecipientParams {
  name: string;
  accountNumber: string;
  bankCode: string;
}

export function createTransferRecipient(params: CreateRecipientParams) {
  return paystackFetch('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN',
    }),
  });
}

export interface InitiateTransferParams {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason: string;
}

export function initiateTransfer(params: InitiateTransferParams) {
  return paystackFetch('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    }),
  });
}

export function refundTransaction(reference: string, amountKobo?: number) {
  return paystackFetch('/refund', {
    method: 'POST',
    body: JSON.stringify({
      transaction: reference,
      ...(amountKobo ? { amount: amountKobo } : {}),
    }),
  });
}

export async function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey()),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === signature;
}

export const COMMISSION_RATE = 0.1;

export function splitAmount(price: number) {
  const commission = Math.round(price * COMMISSION_RATE * 100) / 100;
  const payout = Math.round((price - commission) * 100) / 100;
  return { commission, payout };
}
