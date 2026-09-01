import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ConversationWithDetails } from '../types/database';

const CONVERSATION_SELECT = `
  *,
  listings ( id, title, price, currency ),
  buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ),
  seller:profiles!conversations_seller_id_fkey ( id, full_name, avatar_url ),
  messages ( body, created_at, sender_id )
`;

export function useConversations() {
  const { session } = useAuth();
  const instanceId = useId();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const [{ data }, { data: blocked }] = await Promise.all([
      supabase
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false }),
      supabase.from('blocked_users').select('blocked_id').eq('blocker_id', session.user.id),
    ]);
    const blockedIds = new Set((blocked ?? []).map((b) => b.blocked_id));
    const rows = (data as unknown as ConversationWithDetails[]) ?? [];
    setConversations(rows.filter((c) => !blockedIds.has(c.buyer_id === session.user.id ? c.seller_id : c.buyer_id)));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`conversations-list-${instanceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchConversations, instanceId]);

  return { conversations, loading, refresh: fetchConversations };
}

export async function findOrCreateConversation(listingId: string, buyerId: string, sellerId: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
