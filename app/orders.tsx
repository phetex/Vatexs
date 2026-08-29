import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { useOrders } from '../src/hooks/useOrders';
import { supabase } from '../src/lib/supabase';
import { formatPrice, timeAgo } from '../src/lib/format';
import { colors, radius, spacing } from '../src/theme/colors';
import type { OrderStatus, OrderWithDetails } from '../src/types/database';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid — in escrow',
  released: 'Released to seller',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: colors.textMuted,
  paid: colors.primary,
  released: colors.success,
  refunded: colors.danger,
  cancelled: colors.textFaint,
};

function OrderRow({ order, isBuyer, onReleased }: { order: OrderWithDetails; isBuyer: boolean; onReleased: () => void }) {
  const [releasing, setReleasing] = useState(false);
  const image = order.listings.listing_images?.[0]?.url;
  const other = isBuyer ? order.seller : order.buyer;

  const onConfirmReceipt = () => {
    Alert.alert(
      'Confirm receipt',
      `Release ${formatPrice(order.payout_amount, order.currency)} to the seller? Only do this once you've received the item.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release payment',
          onPress: async () => {
            setReleasing(true);
            const { data, error } = await supabase.functions.invoke('confirm-receipt', { body: { order_id: order.id } });
            setReleasing(false);
            if (error || data?.error) {
              Alert.alert('Could not release payment', data?.error ?? error?.message ?? 'Please try again.');
              return;
            }
            onReleased();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderRow}>
        {image ? (
          <Image source={{ uri: image }} style={styles.orderImage} />
        ) : (
          <View style={[styles.orderImage, styles.orderImagePlaceholder]}>
            <Ionicons name="image-outline" size={20} color={colors.textFaint} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.orderTitle} numberOfLines={1}>
            {order.listings.title}
          </Text>
          <Text style={styles.orderMeta}>
            {isBuyer ? 'Seller' : 'Buyer'}: {other?.full_name || 'Vatexs user'}
          </Text>
          <Text style={styles.orderMeta}>{timeAgo(order.created_at)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.orderAmount}>{formatPrice(order.amount, order.currency)}</Text>
          <Text style={[styles.orderStatus, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status]}</Text>
        </View>
      </View>
      {isBuyer && order.status === 'paid' ? (
        <Button title="Confirm receipt & release payment" onPress={onConfirmReceipt} loading={releasing} style={styles.releaseButton} />
      ) : null}
    </View>
  );
}

export default function Orders() {
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases');
  const { purchases, sales, loading, refresh } = useOrders();
  const items = tab === 'purchases' ? purchases : sales;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <Text
          style={[styles.tabLabel, tab === 'purchases' && styles.tabLabelActive]}
          onPress={() => setTab('purchases')}
        >
          Purchases
        </Text>
        <Text style={[styles.tabLabel, tab === 'sales' && styles.tabLabelActive]} onPress={() => setTab('sales')}>
          Sales
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={tab === 'purchases' ? 'No purchases yet' : 'No sales yet'}
          subtitle={tab === 'purchases' ? 'Items you buy in-app will show up here.' : 'Items you sell in-app will show up here.'}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((order) => (
            <OrderRow key={order.id} order={order} isBuyer={tab === 'purchases'} onReleased={refresh} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  tabLabel: { fontSize: 15, fontWeight: '600', color: colors.textFaint, paddingBottom: spacing.sm },
  tabLabelActive: { color: colors.primary, borderBottomWidth: 2, borderBottomColor: colors.primary },
  list: { padding: spacing.lg },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center' },
  orderImage: { width: 56, height: 56, borderRadius: radius.sm },
  orderImagePlaceholder: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  orderTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  orderMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
  orderStatus: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'right' },
  releaseButton: { marginTop: spacing.md },
});
