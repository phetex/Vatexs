// Edge Functions that check is_admin do it via the service role client, which
// bypasses RLS entirely — so the database-level aal2 requirement (see
// 018_admin_mfa_enforcement.sql) never applies to them. For the handful of
// admin-only actions that move money or reach every user, read the aal claim
// straight from the caller's already-authenticated JWT so a stolen password
// alone (without the TOTP code) can't be used to call them directly.
export function callerHasAal2(req: Request): boolean {
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return false;
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/').padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(normalized));
    return payload.aal === 'aal2';
  } catch {
    return false;
  }
}
