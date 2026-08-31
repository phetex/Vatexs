import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { CategoryChip } from '../src/components/CategoryChip';
import { supabase } from '../src/lib/supabase';
import { functionErrorMessage } from '../src/lib/functionError';
import { useThemedStyles } from '../src/context/ThemeContext';
import { spacing } from '../src/theme/colors';
import type { TicketCategory } from '../src/types/database';

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'item_not_received', label: 'Item not received' },
  { value: 'item_not_as_described', label: 'Not as described' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'account', label: 'Account issue' },
  { value: 'other', label: 'Other' },
];

export default function NewTicket() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [category, setCategory] = useState<TicketCategory | null>(orderId ? 'item_not_received' : null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg },
    orderNote: { fontSize: 13, color: colors.primary, fontWeight: '600' as const, marginBottom: spacing.md },
    sectionLabel: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, marginBottom: spacing.sm },
    chipsWrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: spacing.md },
    textArea: { height: 140, paddingTop: spacing.sm, textAlignVertical: 'top' as const },
    submit: { marginTop: spacing.md },
  }));

  const onSubmit = async () => {
    if (!category || !subject.trim() || !message.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('open-ticket', {
      body: { order_id: orderId ?? null, category, subject: subject.trim(), message: message.trim() },
    });
    setSubmitting(false);
    if (error || data?.error) {
      Alert.alert('Could not open ticket', await functionErrorMessage(error, data, 'Please try again.'));
      return;
    }
    router.replace(`/ticket/${data.ticket_id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {orderId ? <Text style={styles.orderNote}>Reporting an issue with order {orderId.slice(0, 8)}…</Text> : null}

          <Text style={styles.sectionLabel}>What's this about?</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((c) => (
              <CategoryChip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </View>

          <TextField label="Subject" value={subject} onChangeText={setSubject} placeholder="Short summary" />
          <TextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Describe what happened..."
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />

          <Button
            title="Submit"
            onPress={onSubmit}
            loading={submitting}
            disabled={!category || !subject.trim() || !message.trim()}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
