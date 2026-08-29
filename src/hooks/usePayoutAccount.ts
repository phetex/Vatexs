import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { SellerPayoutAccount } from '../types/database';

export function usePayoutAccount() {
  const { session } = useAuth();
  const [account, setAccount] = useState<SellerPayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from('seller_payout_accounts')
      .select('*')
      .eq('seller_id', session.user.id)
      .maybeSingle();
    setAccount((data as SellerPayoutAccount) ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return { account, loading, refresh: fetchAccount };
}
