import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuth } from '../../src/context/AuthContext';
import { useConversations } from '../../src/hooks/useConversations';
import { timeAgo } from '../../src/lib/format';
import { colors, spacing } from '../../src/theme/colors';

export default function Messages() {
  const router = useRouter();
  const { session } = useAuth();
  const { conversations, loading } = useConversations();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? <EmptyState icon="chatbubbles-outline" title="No conversations yet" subtitle="Message a seller from a listing to start chatting." /> : null
        }
        renderItem={({ item }) => {
          const isBuyer = item.buyer_id === session?.user.id;
          const other = isBuyer ? item.seller : item.buyer;
          const lastMessage = item.messages?.[item.messages.length - 1];
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
              {other?.avatar_url ? (
                <Image source={{ uri: other.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={18} color={colors.textFaint} />
                </View>
              )}
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>
                    {other?.full_name || 'Vatexs user'}
                  </Text>
                  {lastMessage ? <Text style={styles.time}>{timeAgo(lastMessage.created_at)}</Text> : null}
                </View>
                {item.listings ? (
                  <Text style={styles.listingTitle} numberOfLines={1}>
                    {item.listings.title}
                  </Text>
                ) : null}
                <Text style={styles.preview} numberOfLines={1}>
                  {lastMessage?.body ?? 'Say hello 👋'}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 24, fontWeight: '800', color: colors.text, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, justifyContent: 'center' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  time: { fontSize: 12, color: colors.textFaint },
  listingTitle: { fontSize: 12, color: colors.primary, marginTop: 2 },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
