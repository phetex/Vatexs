import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { SupportTicketWithDetails } from '../types/database';

const TICKET_SELECT = `
  *,
  reporter:profiles!support_tickets_reporter_id_fkey ( id, full_name, avatar_url ),
  orders ( id, amount, currency, status, paystack_reference )
`;

export function useTickets() {
  const { profile, session } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    let query = supabase.from('support_tickets').select(TICKET_SELECT).order('created_at', { ascending: false });
    if (!profile?.is_admin) {
      query = query.eq('reporter_id', session.user.id);
    }
    const { data } = await query;
    setTickets((data as unknown as SupportTicketWithDetails[]) ?? []);
    setLoading(false);
  }, [session, profile?.is_admin]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('support-tickets-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchTickets]);

  return { tickets, loading, refresh: fetchTickets };
}

export async function fetchTicket(id: string) {
  const { data, error } = await supabase.from('support_tickets').select(TICKET_SELECT).eq('id', id).single();
  if (error) throw error;
  return data as unknown as SupportTicketWithDetails;
}
