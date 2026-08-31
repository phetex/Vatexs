import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { useTicketMessages } from '../../src/hooks/useTicketMessages';
import { fetchTicket } from '../../src/hooks/useTickets';
import { supabase } from '../../src/lib/supabase';
import { functionErrorMessage } from '../../src/lib/functionError';
import { formatPrice, timeAgo } from '../../src/lib/format';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { radius, spacing } from '../../src/theme/colors';
import type { SupportTicketWithDetails } from '../../src/types/database';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { session, profile } = useAuth();
  const { messages, loading: messagesLoading } = useTicketMessages(id);
  const [ticket, setTicket] = useState<SupportTicketWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList>(null);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    summary: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    subject: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
    orderLine: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    list: { padding: spacing.lg },
    bubbleRow: { flexDirection: 'row' as const, marginBottom: spacing.sm },
    bubbleRowMine: { justifyContent: 'flex-end' as const },
    bubbleRowTheirs: { justifyContent: 'flex-start' as const },
    bubble: { maxWidth: '80%' as const, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
    bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
    adminTag: { fontSize: 10, fontWeight: '700' as const, color: colors.accent, marginBottom: 2 },
    bubbleText: { fontSize: 15, color: colors.text },
    bubbleTextMine: { color: colors.white },
    bubbleTime: { fontSize: 10, color: colors.textFaint, marginTop: 4 },
    bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
    adminBar: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    adminButton: { marginBottom: spacing.sm },
    adminRow: { flexDirection: 'row' as const, gap: spacing.sm },
    adminHalfButton: { flex: 1 },
    inputBar: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.text,
      marginRight: spacing.sm,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));

  const loadTicket = () => {
    fetchTicket(id)
      .then(setTicket)
      .finally(() => setLoading(false));
  };

  useEffect(loadTicket, [id]);

  const onSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    const { data, error } = await supabase.functions.invoke('reply-ticket', { body: { ticket_id: id, body } });
    setSending(false);
    if (error || data?.error) Alert.alert('Could not send', await functionErrorMessage(error, data, 'Please try again.'));
    else setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const onSetStatus = (status: 'resolved' | 'closed') => {
    Alert.alert(`Mark as ${status}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setBusy(true);
          const { data, error } = await supabase.functions.invoke('resolve-ticket', { body: { ticket_id: id, status } });
          setBusy(false);
          if (error || data?.error) Alert.alert('Error', await functionErrorMessage(error, data, 'Please try again.'));
          else loadTicket();
        },
      },
    ]);
  };

  const onRefund = () => {
    if (!ticket?.order_id) return;
    Alert.alert(
      'Refund this order?',
      `This immediately refunds ${formatPrice(ticket.orders?.amount ?? 0, ticket.orders?.currency ?? 'NGN')} back to the buyer via Paystack. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const { data, error } = await supabase.functions.invoke('process-refund', {
              body: { order_id: ticket.order_id, ticket_id: ticket.id },
            });
            setBusy(false);
            if (error || data?.error) Alert.alert('Refund failed', await functionErrorMessage(error, data, 'Please try again.'));
            else loadTicket();
          },
        },
      ]
    );
  };

  if (loading || !ticket) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isAdmin = !!profile?.is_admin;
  const canRefund = isAdmin && ticket.order_id && ticket.orders?.status === 'paid';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.summary}>
        <Text style={styles.subject}>{ticket.subject}</Text>
        {ticket.orders ? (
          <Text style={styles.orderLine}>
            Order: {formatPrice(ticket.orders.amount, ticket.orders.currency)} · {ticket.orders.status}
          </Text>
        ) : null}
      </View>

      {messagesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.sender_id === session?.user.id;
            return (
              <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {item.is_admin_reply ? <Text style={styles.adminTag}>VATEXS SUPPORT</Text> : null}
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                  <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{timeAgo(item.created_at)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {isAdmin ? (
        <View style={styles.adminBar}>
          {canRefund ? <Button title="Refund order" variant="danger" onPress={onRefund} loading={busy} style={styles.adminButton} /> : null}
          <View style={styles.adminRow}>
            <Button title="Resolved" variant="secondary" onPress={() => onSetStatus('resolved')} loading={busy} style={styles.adminHalfButton} />
            <Button title="Close" variant="outline" onPress={() => onSetStatus('closed')} loading={busy} style={styles.adminHalfButton} />
          </View>
        </View>
      ) : null}

      <SafeAreaView edges={['bottom']} style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textFaint}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={onSend} disabled={!draft.trim() || sending}>
          <Ionicons name="arrow-up" size={20} color={colors.white} />
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
