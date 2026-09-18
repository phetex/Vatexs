import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { fetchListing } from '../../src/hooks/useListings';
import { useFavorite } from '../../src/hooks/useFavorite';
import { findOrCreateConversation } from '../../src/hooks/useConversations';
import { supabase } from '../../src/lib/supabase';
import { functionErrorMessage } from '../../src/lib/functionError';
import { formatPrice, timeAgo } from '../../src/lib/format';
import { useExchangeRates } from '../../src/hooks/useExchangeRates';
import { currencyForCountry } from '../../src/lib/countries';
import { trackEvent, useTrackScreen } from '../../src/lib/analytics';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { radius, spacing } from '../../src/theme/colors';
import type { ListingWithDetails } from '../../src/types/database';

const { width } = Dimensions.get('window');

const CONDITION_LABEL: Record<string, string> = {
  new: 'New',
  like_new: 'Like new',
  used: 'Used',
  fair: 'Fair',
};

export default function ListingDetail() {
  useTrackScreen('listing_detail');
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { session, profile } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [useWalletCredit, setUseWalletCredit] = useState(true);
  const { isFavorite, toggle } = useFavorite(id);
  const { convert } = useExchangeRates();
  const viewerCurrency = currencyForCountry(profile?.country_code);
  const converted = listing && viewerCurrency && viewerCurrency !== listing.currency ? convert(listing.price, listing.currency, viewerCurrency) : null;
  const walletBalance = profile?.wallet_credit_ngn ?? 0;
  const walletApplicable = listing && listing.currency === 'NGN' ? Math.min(walletBalance, Math.max(0, listing.price - 100)) : 0;
  const chargeAmount = listing ? listing.price - (useWalletCredit ? walletApplicable : 0) : 0;
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    heroImage: { width, height: width, backgroundColor: colors.surface },
    heroPlaceholder: { alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.surface },
    heroWrap: { position: 'relative' as const },
    imageCounter: {
      position: 'absolute' as const,
      top: spacing.md,
      right: spacing.md,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '700' as const },
    dotsRow: {
      position: 'absolute' as const,
      bottom: spacing.md,
      left: 0,
      right: 0,
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: '#fff', width: 16 },
    body: { padding: spacing.lg },
    titleRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
    favoriteButton: { padding: spacing.xs },
    price: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
    title: { fontSize: 16, color: colors.text, marginTop: 2 },
    metaRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, alignItems: 'center' as const, marginTop: spacing.md, gap: spacing.md },
    metaPill: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
    metaPillText: { color: colors.primary, fontSize: 12, fontWeight: '700' as const },
    metaItem: { flexDirection: 'row' as const, alignItems: 'center' as const },
    metaText: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
    estimate: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
    section: { marginTop: spacing.lg },
    sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.text, marginBottom: spacing.sm },
    description: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
    sellerRow: { flexDirection: 'row' as const, alignItems: 'center' as const },
    sellerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm },
    sellerAvatarPlaceholder: { backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const },
    sellerName: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
    footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    footerRow: { flexDirection: 'row' as const },
    secondaryFooterButton: { marginTop: spacing.sm },
    walletRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    walletRowText: { flex: 1, fontSize: 12.5, color: colors.textMuted, marginRight: spacing.sm },
  }));

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
    trackEvent('buy_initiated', { category_id: listing.category_id, currency: listing.currency });
    setPaying(true);
    try {
      const redirectUrl = Linking.createURL('payment-callback');
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: { listing_id: listing.id, redirect_url: redirectUrl, use_wallet_credit: useWalletCredit && walletApplicable > 0 },
      });
      if (error || data?.error) {
        throw new Error(await functionErrorMessage(error, data, 'Could not start checkout.'));
      }
      await WebBrowser.openAuthSessionAsync(data.authorization_url, redirectUrl);
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

  const images = listing.listing_images?.length
    ? [...listing.listing_images].sort((a, b) => a.position - b.position)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        {images.length ? (
          <View style={styles.heroWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {images.map((img) => (
                <Image key={img.id} source={{ uri: img.url }} style={styles.heroImage} resizeMode="contain" />
              ))}
            </ScrollView>
            {images.length > 1 ? (
              <>
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {activeImage + 1}/{images.length}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {images.map((img, i) => (
                    <View key={img.id} style={[styles.dot, i === activeImage && styles.dotActive]} />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="image-outline" size={40} color={colors.textFaint} />
          </View>
        )}

        <SafeAreaView edges={['bottom']} style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
              {converted != null ? <Text style={styles.estimate}>≈ {formatPrice(converted, viewerCurrency!)} estimate</Text> : null}
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
            {walletApplicable > 0 ? (
              <View style={styles.walletRow}>
                <Text style={styles.walletRowText}>Use {formatPrice(walletApplicable, 'NGN')} wallet credit</Text>
                <Switch
                  value={useWalletCredit}
                  onValueChange={setUseWalletCredit}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.white}
                />
              </View>
            ) : null}
            <Button
              title={`Buy now — ${formatPrice(chargeAmount, listing.currency)}`}
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
