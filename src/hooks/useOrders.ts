import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { OrderWithDetails } from '../types/database';

const ORDER_SELECT = `
  *,
  listings ( id, title, listing_images ( url ) ),
  buyer:profiles!orders_buyer_id_fkey ( id, full_name, avatar_url ),
  seller:profiles!orders_seller_id_fkey ( id, full_name, avatar_url )
`;

export function useOrders() {
  const { session } = useAuth();
  const instanceId = useId();
  const [purchases, setPurchases] = useState<OrderWithDetails[]>([]);
  const [sales, setSales] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const [{ data: purchasesData }, { data: salesData }] = await Promise.all([
      supabase.from('orders').select(ORDER_SELECT).eq('buyer_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('orders').select(ORDER_SELECT).eq('seller_id', session.user.id).order('created_at', { ascending: false }),
    ]);
    setPurchases((purchasesData as unknown as OrderWithDetails[]) ?? []);
    setSales((salesData as unknown as OrderWithDetails[]) ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`orders-list-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchOrders, instanceId]);

  return { purchases, sales, loading, refresh: fetchOrders };
}
