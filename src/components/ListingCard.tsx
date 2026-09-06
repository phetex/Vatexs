import { Image, Platform, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';
import { formatPrice } from '../lib/format';
import { isListingFeatured } from '../hooks/useListings';
import type { ListingWithDetails } from '../types/database';

export function ListingCard({ listing }: { listing: ListingWithDetails }) {
  const router = useRouter();
  const image = listing.listing_images?.[0]?.url;
  const styles = useThemedStyles((colors) => ({
    card: { width: '48%' as const, marginBottom: spacing.lg },
    imageWrap: {
      borderRadius: radius.lg,
      overflow: 'hidden' as const,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: { shadowColor: colors.black, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
        android: { elevation: 2 },
      }),
    },
    image: { width: '100%' as const, aspectRatio: 1 },
    placeholder: { alignItems: 'center' as const, justifyContent: 'center' as const },
    placeholderText: { color: colors.textFaint, fontSize: 12, fontWeight: '600' as const },
    soldBadge: {
      position: 'absolute' as const,
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: colors.black,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    soldText: { color: colors.white, fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.5 },
    featuredBadge: {
      position: 'absolute' as const,
      top: spacing.sm,
      left: spacing.sm,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    price: { marginTop: spacing.sm, fontSize: 17, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.2 },
    title: { fontSize: 13.5, color: colors.text, marginTop: 2, lineHeight: 18 },
    metaRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 3, gap: 3 },
    meta: { fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  }));

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={() => router.push(`/listing/${listing.id}`)}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>No photo</Text>
          </View>
        )}
        {listing.status === 'sold' ? (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>SOLD</Text>
          </View>
        ) : isListingFeatured(listing) ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.soldText}>FEATURED</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {listing.title}
      </Text>
      {listing.location || listing.categories?.name ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={11} color={styles.meta.color} />
          <Text style={styles.meta} numberOfLines={1}>
            {listing.location || listing.categories?.name}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
