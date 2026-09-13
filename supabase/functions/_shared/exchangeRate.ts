// Live GBP -> NGN rate for converting the referral reward (~£10) into the
// naira amount actually credited. Falls back to a conservative fixed rate
// if the rate API is unreachable, so a reward is never blocked by it.
const FALLBACK_GBP_TO_NGN = 2000;

export async function getGbpToNgnRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/GBP');
    const data = await res.json();
    const rate = data?.rates?.NGN;
    return typeof rate === 'number' && rate > 0 ? rate : FALLBACK_GBP_TO_NGN;
  } catch {
    return FALLBACK_GBP_TO_NGN;
  }
}
