import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CategoryChip } from '../../src/components/CategoryChip';
import { ListingCard } from '../../src/components/ListingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuth } from '../../src/context/AuthContext';
import { useCategories } from '../../src/hooks/useCategories';
import { useListings } from '../../src/hooks/useListings';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useTrackScreen } from '../../src/lib/analytics';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { spacing } from '../../src/theme/colors';

export default function Home() {
  useTrackScreen('home');
  const { colors } = useTheme();
  const router = useRouter();
  const { session, profile } = useAuth();
  const { categories } = useCategories();
  const { unreadCount } = useNotifications();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const { listings, loading, refreshing, refresh } = useListings({ categoryId });
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    brand: { fontSize: 26, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.8 },
    greeting: { marginTop: 3, fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
    bellButton: { padding: spacing.xs, position: 'relative' as const },
    bellBadge: {
      position: 'absolute' as const,
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 3,
    },
    bellBadgeText: { fontSize: 10, fontWeight: '800' as const, color: colors.white },
    signInPill: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999 },
    signInPillText: { color: colors.white, fontSize: 13, fontWeight: '700' as const },
    chipRow: { marginBottom: spacing.lg },
    chipRowContent: { paddingHorizontal: spacing.lg },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    row: { justifyContent: 'space-between' as const },
    loading: { marginTop: spacing.xl },
  }));

  const firstName = profile?.full_name?.split(' ')[0];

  // Interested categories (from Personalisation) float to the front of the row.
  const orderedCategories = useMemo(() => {
    const interested = profile?.interested_categories ?? [];
    if (interested.length === 0) return categories;
    return [...categories].sort((a, b) => {
      const aIn = interested.includes(a.id) ? 0 : 1;
      const bIn = interested.includes(b.id) ? 0 : 1;
      return aIn - bIn;
    });
  }, [categories, profile?.interested_categories]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.brand}>Vatexs</Text>
                <Text style={styles.greeting}>{firstName ? `Hi ${firstName}, find something great.` : 'Find something great.'}</Text>
              </View>
              {session ? (
                <Pressable style={styles.bellButton} onPress={() => router.push('/notifications')} hitSlop={8}>
                  <Ionicons name="notifications-outline" size={24} color={colors.text} />
                  {unreadCount > 0 ? (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ) : (
                <Pressable style={styles.signInPill} onPress={() => router.push('/(auth)/sign-in')} hitSlop={8}>
                  <Text style={styles.signInPillText}>Sign in</Text>
                </Pressable>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
              <CategoryChip label="All" active={categoryId === null} onPress={() => setCategoryId(null)} />
              {orderedCategories.map((c) => (
                <CategoryChip
                  key={c.id}
                  label={c.name}
                  icon={c.icon as any}
                  active={categoryId === c.id}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <EmptyState icon="pricetags-outline" title="No listings yet" subtitle="Be the first to sell something in this category." />
          )
        }
        renderItem={({ item }) => <ListingCard listing={item} />}
      />
    </SafeAreaView>
  );
}
