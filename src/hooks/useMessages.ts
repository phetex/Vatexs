import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { functionErrorMessage } from '../lib/functionError';
import type { Message } from '../types/database';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (_senderId: string, body: string) => {
    const { data, error } = await supabase.functions.invoke('send-message', {
      body: { conversation_id: conversationId, body },
    });
    if (error || data?.error) throw new Error(await functionErrorMessage(error, data, 'Could not send message.'));
  };

  return { messages, loading, sendMessage };
}
