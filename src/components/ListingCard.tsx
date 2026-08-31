import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../theme/colors';
import { formatPrice } from '../lib/format';
import { isListingFeatured } from '../hooks/useListings';
import type { ListingWithDetails } from '../types/database';

export function ListingCard({ listing }: { listing: ListingWithDetails }) {
  const router = useRouter();
  const image = listing.listing_images?.[0]?.url;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/listing/${listing.id}`)}>
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
      <Text style={styles.meta} numberOfLines={1}>
        {listing.location || listing.categories?.name || ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', marginBottom: spacing.lg },
  imageWrap: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  image: { width: '100%', aspectRatio: 1 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textFaint, fontSize: 12 },
  soldBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.black,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  soldText: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  price: { marginTop: spacing.sm, fontSize: 16, fontWeight: '700', color: colors.text },
  title: { fontSize: 14, color: colors.text, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
