import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ListingCard } from '../../src/components/ListingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useListings } from '../../src/hooks/useListings';
import { colors, radius, spacing } from '../../src/theme/colors';

export default function Search() {
  const [query, setQuery] = useState('');
  const { listings, loading } = useListings({ search: query.trim() || undefined });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textFaint} />
        <TextInput
          style={styles.input}
          placeholder="Search listings"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="search-outline"
              title={query ? `No results for "${query}"` : 'Search Vatexs'}
              subtitle={query ? 'Try a different keyword.' : 'Find fashion, tech, home goods and more.'}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between' },
});
