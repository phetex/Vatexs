import { useCallback, useEffect, useState } from 'react';
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
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
      .order('last_message_at', { ascending: false });
    setConversations((data as unknown as ConversationWithDetails[]) ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchConversations]);

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
