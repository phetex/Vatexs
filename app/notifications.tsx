import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../src/components/EmptyState';
import { useNotifications } from '../src/hooks/useNotifications';
import { timeAgo } from '../src/lib/format';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';
import type { AppNotification } from '../src/types/database';

function routeFor(n: AppNotification): string | null {
  const type = n.data?.type as string | undefined;
  switch (type) {
    case 'order_released':
    case 'order_paid':
    case 'order_refunded':
      return '/orders';
    case 'ticket_reply':
    case 'ticket_resolved':
    case 'new_ticket':
      return n.data?.ticket_id ? `/ticket/${n.data.ticket_id}` : '/support';
    case 'new_message':
      return n.data?.conversation_id ? `/chat/${n.data.conversation_id}` : null;
    case 'referral_reward':
      return '/referrals';
    default:
      return null;
  }
}

export default function Notifications() {
  const { colors } = useTheme();
  const router = useRouter();
  const { notifications, loading, unreadCount, refresh, markRead, markAllRead } = useNotifications();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingBottom: spacing.xl },
    loading: { marginTop: spacing.xl },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    markAllText: { color: colors.primary, fontSize: 13, fontWeight: '600' as const },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6, marginRight: spacing.sm },
    dotSpacer: { width: 8, marginRight: spacing.sm },
    rowBody: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700' as const, color: colors.text },
    body: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
    time: { fontSize: 11, color: colors.textFaint, marginTop: 4 },
  }));

  const onPress = async (n: AppNotification) => {
    if (!n.read) await markRead(n.id);
    const route = routeFor(n);
    if (route) router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {unreadCount > 0 ? (
        <View style={styles.header}>
          <Text style={styles.markAllText}>{unreadCount} unread</Text>
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <EmptyState icon="notifications-outline" title="No notifications yet" subtitle="Order updates, messages, and other alerts will show up here." />
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onPress(item)}>
            {item.read ? <View style={styles.dotSpacer} /> : <View style={styles.dot} />}
            <View style={styles.rowBody}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={3}>
                {item.body}
              </Text>
              <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
