import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useMessages } from '../../src/hooks/useMessages';
import { supabase } from '../../src/lib/supabase';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { radius, spacing } from '../../src/theme/colors';
import type { ConversationWithDetails } from '../../src/types/database';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const { messages, loading, sendMessage } = useMessages(id);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    listingBanner: { padding: spacing.sm, backgroundColor: colors.primaryLight, alignItems: 'center' as const },
    listingBannerText: { color: colors.primary, fontSize: 12, fontWeight: '600' as const },
    listContent: { padding: spacing.lg },
    bubbleRow: { flexDirection: 'row' as const, marginBottom: spacing.sm },
    bubbleRowMine: { justifyContent: 'flex-end' as const },
    bubbleRowTheirs: { justifyContent: 'flex-start' as const },
    bubble: { maxWidth: '78%' as const, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
    bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
    bubbleText: { fontSize: 15, color: colors.text },
    bubbleTextMine: { color: colors.white },
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

  const other = conversation ? (conversation.buyer_id === session?.user.id ? conversation.seller : conversation.buyer) : null;

  const onBlock = () => {
    if (!other || !session) return;
    Alert.alert(
      `Block ${other.full_name || 'this user'}?`,
      "You won't be able to message each other any more. You can undo this later from Settings.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('blocked_users').insert({ blocker_id: session.user.id, blocked_id: other.id });
            if (error) {
              Alert.alert('Could not block user', error.message);
              return;
            }
            router.back();
          },
        },
      ]
    );
  };

  const onMenu = () => {
    if (!other) return;
    Alert.alert(other.full_name || 'Chat', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report a problem', onPress: () => router.push('/new-ticket') },
      { text: 'Block user', style: 'destructive', onPress: onBlock },
    ]);
  };

  useEffect(() => {
    if (!conversation) return;
    navigation.setOptions({
      title: other?.full_name || 'Chat',
      headerRight: () => (
        <Pressable onPress={onMenu} hitSlop={12} style={{ paddingHorizontal: 4 }}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [conversation, session, navigation, colors]);

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
