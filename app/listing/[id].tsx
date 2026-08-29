import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { fetchListing } from '../../src/hooks/useListings';
import { useFavorite } from '../../src/hooks/useFavorite';
import { findOrCreateConversation } from '../../src/hooks/useConversations';
import { supabase } from '../../src/lib/supabase';
import { formatPrice, timeAgo } from '../../src/lib/format';
import { colors, radius, spacing } from '../../src/theme/colors';
import type { ListingWithDetails } from '../../src/types/database';

const { width } = Dimensions.get('window');

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  used: 'Used',
  fair: 'Fair',
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const { isFavorite, toggle } = useFavorite(id);

  useEffect(() => {
    fetchListing(id)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [id]);

  const isOwner = listing && session?.user.id === listing.seller_id;

  const onMessageSeller = async () => {
    if (!listing || !session) return;
    setBusy(true);
    try {
      const conversationId = await findOrCreateConversation(listing.id, session.user.id, listing.seller_id);
      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      Alert.alert('Could not start conversation', err?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onBuyNow = async () => {
    if (!listing) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: { listing_id: listing.id },
      });
      if (error || data?.error) {
        throw new Error(data?.error ?? error?.message ?? 'Could not start checkout.');
      }
      await WebBrowser.openAuthSessionAsync(data.authorization_url, 'vatexs://payment-callback');
      const refreshed = await fetchListing(listing.id);
      setListing(refreshed);
      router.push('/orders');
    } catch (err: any) {
      Alert.alert('Could not start checkout', err?.message ?? 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const onMarkSold = async () => {
    if (!listing) return;
    setBusy(true);
    const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', listing.id);
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else setListing({ ...listing, status: 'sold' });
  };

  const onDelete = () => {
    if (!listing) return;
    Alert.alert('Delete listing', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.from('listings').delete().eq('id', listing.id);
          setBusy(false);
          if (error) Alert.alert('Error', error.message);
          else router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loading}>
        <Text>Listing not found.</Text>
      </View>
    );
  }

  const images = listing.listing_images?.length ? listing.listing_images : [];

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        {images.length ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {images.map((img) => (
              <Image key={img.id} source={{ uri: img.url }} style={styles.heroImage} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="image-outline" size={40} color={colors.textFaint} />
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
              <Text style={styles.title}>{listing.title}</Text>
            </View>
            {!isOwner ? (
              <Pressable onPress={toggle} style={styles.favoriteButton}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? colors.accent : colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{CONDITION_LABEL[listing.condition]}</Text>
            </View>
            {listing.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{listing.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{timeAgo(listing.created_at)}</Text>
            </View>
          </View>

          {listing.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.sellerRow}>
              {listing.profiles?.avatar_url ? (
                <Image source={{ uri: listing.profiles.avatar_url }} style={styles.sellerAvatar} />
              ) : (
                <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                  <Ionicons name="person" size={16} color={colors.textFaint} />
                </View>
              )}
              <Text style={styles.sellerName}>{listing.profiles?.full_name || 'Vatexs user'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {isOwner ? (
          listing.status === 'sold' ? (
            <Button title="Delete listing" variant="danger" onPress={onDelete} loading={busy} />
          ) : (
            <View style={styles.footerRow}>
              <Button title="Mark as sold" variant="secondary" onPress={onMarkSold} loading={busy} style={{ flex: 1, marginRight: spacing.sm }} />
              <Button title="Delete" variant="danger" onPress={onDelete} style={{ flex: 1 }} />
            </View>
          )
        ) : listing.currency === 'NGN' ? (
          <View>
            <Button
              title={`Buy now — ${formatPrice(listing.price, listing.currency)}`}
              onPress={onBuyNow}
              loading={paying}
              disabled={listing.status === 'sold'}
            />
            <Button
              title="Message seller"
              variant="outline"
              onPress={onMessageSeller}
              loading={busy}
              disabled={listing.status === 'sold'}
              style={styles.secondaryFooterButton}
            />
          </View>
        ) : (
          <Button title="Message seller" onPress={onMessageSeller} loading={busy} disabled={listing.status === 'sold'} />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width, height: width },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  body: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  favoriteButton: { padding: spacing.xs },
  price: { fontSize: 26, fontWeight: '800', color: colors.text },
  title: { fontSize: 16, color: colors.text, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  metaPill: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  metaPillText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
  section: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  description: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  sellerRow: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm },
  sellerAvatarPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sellerName: { fontSize: 14, fontWeight: '600', color: colors.text },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  footerRow: { flexDirection: 'row' },
  secondaryFooterButton: { marginTop: spacing.sm },
});
