import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useMessages } from '../../src/hooks/useMessages';
import { supabase } from '../../src/lib/supabase';
import { colors, radius, spacing } from '../../src/theme/colors';
import type { ConversationWithDetails } from '../../src/types/database';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const navigation = useNavigation();
  const { messages, loading, sendMessage } = useMessages(id);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase
      .from('conversations')
      .select(
        `*, listings ( id, title, price, currency ), buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ), seller:profiles!conversations_seller_id_fkey ( id, full_name, avatar_url )`
      )
      .eq('id', id)
      .single()
      .then(({ data }) => setConversation(data as unknown as ConversationWithDetails));
  }, [id]);

  useEffect(() => {
    if (!conversation) return;
    const other = conversation.buyer_id === session?.user.id ? conversation.seller : conversation.buyer;
    navigation.setOptions({ title: other?.full_name || 'Chat' });
  }, [conversation, session, navigation]);

  const onSend = async () => {
    if (!draft.trim() || !session) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      await sendMessage(session.user.id, body);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {conversation?.listings ? (
        <View style={styles.listingBanner}>
          <Text style={styles.listingBannerText} numberOfLines={1}>
            Re: {conversation.listings.title}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.sender_id === session?.user.id;
            return (
              <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <SafeAreaView edges={['bottom']} style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listingBanner: { padding: spacing.sm, backgroundColor: colors.primaryLight, alignItems: 'center' },
  listingBannerText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  listContent: { padding: spacing.lg },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: colors.text },
  bubbleTextMine: { color: colors.white },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
