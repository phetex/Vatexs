import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { useAuth } from '../src/context/AuthContext';
import { useTickets } from '../src/hooks/useTickets';
import { timeAgo } from '../src/lib/format';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';
import type { TicketStatus } from '../src/types/database';

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
  refunded: 'Refunded',
  closed: 'Closed',
};

export default function Support() {
  const router = useRouter();
  const { colors } = useTheme();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { profile } = useAuth();
  const { tickets, loading } = useTickets();
  const STATUS_COLOR: Record<TicketStatus, string> = {
    open: colors.accent,
    in_review: colors.primary,
    resolved: colors.success,
    refunded: colors.success,
    closed: colors.textFaint,
  };
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    headerTitle: { fontSize: 22, fontWeight: '800' as const, color: colors.text, marginBottom: spacing.md },
    newButton: { marginBottom: spacing.md },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    cardTop: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    subject: { fontSize: 15, fontWeight: '700' as const, color: colors.text, flex: 1, marginRight: spacing.sm },
    statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
    statusText: { fontSize: 11, fontWeight: '700' as const },
    meta: { fontSize: 12, color: colors.textFaint, marginTop: 4 },
    preview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{profile?.is_admin ? 'All tickets' : 'Your support tickets'}</Text>
        <Button
          title="New ticket"
          onPress={() => router.push(orderId ? `/new-ticket?orderId=${orderId}` : '/new-ticket')}
          style={styles.newButton}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="help-buoy-outline" title="No tickets yet" subtitle="Report a problem with an order or ask a general question." />
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/ticket/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.subject} numberOfLines={1}>
                  {item.subject}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
              {profile?.is_admin ? <Text style={styles.meta}>From {item.reporter?.full_name || 'Vatexs user'}</Text> : null}
              <Text style={styles.preview} numberOfLines={1}>
                {item.message}
              </Text>
              <Text style={styles.meta}>{timeAgo(item.created_at)}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
