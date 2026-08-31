import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { useAuth } from '../src/context/AuthContext';
import { isListingFeatured, useListings } from '../src/hooks/useListings';
import { supabase } from '../src/lib/supabase';
import { formatPrice } from '../src/lib/format';
import { colors, radius, spacing } from '../src/theme/colors';

const BOOST_DAYS = 7;

function BoostRow({ listing, onChanged }: { listing: ReturnType<typeof useListings>['listings'][number]; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const image = listing.listing_images?.[0]?.url;
  const active = isListingFeatured(listing);

  const onBoost = async () => {
    setBusy(true);
    const until = new Date(Date.now() + BOOST_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('listings').update({ featured: true, featured_until: until }).eq('id', listing.id);
    setBusy(false);
    if (error) {
      Alert.alert('Could not boost listing', error.message);
      return;
    }
    onChanged();
  };

  const onStop = async () => {
    setBusy(true);
    const { error } = await supabase.from('listings').update({ featured: false }).eq('id', listing.id);
    setBusy(false);
    if (error) {
      Alert.alert('Could not update listing', error.message);
      return;
    }
    onChanged();
  };

  return (
    <View style={styles.row}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={18} color={colors.textFaint} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
        {active ? (
          <Text style={styles.activeLabel}>
            Boosted until {new Date(listing.featured_until as string).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
      <Button
        title={active ? 'Stop' : 'Boost'}
        variant={active ? 'outline' : 'primary'}
        onPress={active ? onStop : onBoost}
        loading={busy}
        style={styles.boostButton}
      />
    </View>
  );
}

export default function Promotions() {
  const { session } = useAuth();
  const { listings, loading, refresh } = useListings({ sellerId: session?.user.id });
  const sellable = listings.filter((l) => l.status === 'active');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Boost a listing to bump it to the top of Home and category feeds for {BOOST_DAYS} days. Free while Vatexs is
          in early access.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : sellable.length === 0 ? (
          <EmptyState icon="rocket-outline" title="Nothing to boost yet" subtitle="List an item for sale to start promoting it." />
        ) : (
          sellable.map((listing) => <BoostRow key={listing.id} listing={listing} onChanged={() => refresh()} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  image: { width: 52, height: 52, borderRadius: radius.sm },
  imagePlaceholder: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  price: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  activeLabel: { fontSize: 11, fontWeight: '600', color: colors.primary, marginTop: 4 },
  boostButton: { marginLeft: spacing.sm, minWidth: 84 },
});
