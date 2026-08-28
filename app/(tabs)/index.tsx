import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryChip } from '../../src/components/CategoryChip';
import { ListingCard } from '../../src/components/ListingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuth } from '../../src/context/AuthContext';
import { useCategories } from '../../src/hooks/useCategories';
import { useListings } from '../../src/hooks/useListings';
import { colors, spacing } from '../../src/theme/colors';

export default function Home() {
  const { profile } = useAuth();
  const { categories } = useCategories();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const { listings, loading, refreshing, refresh } = useListings({ categoryId });

  const firstName = profile?.full_name?.split(' ')[0];

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
              <Text style={styles.brand}>Vatexs</Text>
              <Text style={styles.greeting}>{firstName ? `Hi ${firstName}, find something great.` : 'Find something great.'}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
              <CategoryChip label="All" active={categoryId === null} onPress={() => setCategoryId(null)} />
              {categories.map((c) => (
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
          !loading ? <EmptyState icon="pricetags-outline" title="No listings yet" subtitle="Be the first to sell something in this category." /> : null
        }
        renderItem={({ item }) => <ListingCard listing={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  brand: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  greeting: { marginTop: 2, fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  chipRow: { marginBottom: spacing.md },
  chipRowContent: { paddingHorizontal: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between' },
});
