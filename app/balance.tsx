import { useMemo } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { useOrders } from '../src/hooks/useOrders';
import { formatPrice, timeAgo } from '../src/lib/format';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';

export default function Balance() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sales, loading } = useOrders();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
    card: { backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
    cardLabel: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
    cardAmount: { fontSize: 28, fontWeight: '800' as const, color: colors.text, marginTop: 4 },
    escrowRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: spacing.sm, gap: 6 },
    escrowText: { fontSize: 12, color: colors.textMuted, flex: 1 },
    note: { fontSize: 12, color: colors.textFaint, lineHeight: 18, marginBottom: spacing.md },
    linkButton: { marginBottom: spacing.sm },
    sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
    orderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.sm },
    orderImage: { width: 44, height: 44, borderRadius: radius.sm },
    orderImagePlaceholder: { backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const },
    orderTitle: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
    orderMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    orderAmount: { fontSize: 14, fontWeight: '700' as const, color: colors.success },
  }));

  const summary = useMemo(() => {
    const byCurrency: Record<string, { released: number; inEscrow: number }> = {};
    for (const order of sales) {
      const bucket = byCurrency[order.currency] ?? { released: 0, inEscrow: 0 };
      if (order.status === 'released') bucket.released += order.payout_amount;
      if (order.status === 'paid') bucket.inEscrow += order.payout_amount;
      byCurrency[order.currency] = bucket;
    }
    return Object.entries(byCurrency);
  }, [sales]);

  const releasedOrders = sales.filter((o) => o.status === 'released').slice(0, 10);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {summary.length === 0 ? (
          <EmptyState icon="wallet-outline" title="No earnings yet" subtitle="Money from your sales will show up here once buyers pay." />
        ) : (
          summary.map(([currency, bucket]) => (
            <View key={currency} style={styles.card}>
              <Text style={styles.cardLabel}>Total earned ({currency})</Text>
              <Text style={styles.cardAmount}>{formatPrice(bucket.released, currency)}</Text>
              {bucket.inEscrow > 0 ? (
                <View style={styles.escrowRow}>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.escrowText}>
                    {formatPrice(bucket.inEscrow, currency)} in escrow — released once buyers confirm receipt
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.note}>
          Payouts are sent straight to your bank account via Paystack the moment a buyer confirms an order — Vatexs
          never holds a separate withdrawable balance.
        </Text>

        <Button title="Payout account" variant="outline" onPress={() => router.push('/payout-setup')} style={styles.linkButton} />
        <Button title="View all sales" variant="outline" onPress={() => router.push('/orders')} style={styles.linkButton} />

        {releasedOrders.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recent payouts</Text>
            {releasedOrders.map((order) => {
              const image = order.listings?.listing_images?.[0]?.url;
              return (
                <View key={order.id} style={styles.orderRow}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.orderImage} />
                  ) : (
                    <View style={[styles.orderImage, styles.orderImagePlaceholder]}>
                      <Ionicons name="image-outline" size={18} color={colors.textFaint} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.orderTitle} numberOfLines={1}>
                      {order.listings?.title ?? 'Listing unavailable'}
                    </Text>
                    <Text style={styles.orderMeta}>{timeAgo(order.released_at ?? order.created_at)}</Text>
                  </View>
                  <Text style={styles.orderAmount}>+{formatPrice(order.payout_amount, order.currency)}</Text>
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
