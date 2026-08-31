import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { ListingCard } from '../../src/components/ListingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuth } from '../../src/context/AuthContext';
import { useListings } from '../../src/hooks/useListings';
import { colors, spacing } from '../../src/theme/colors';

export default function Profile() {
  const { session, profile, signOut } = useAuth();
  const router = useRouter();
  const { listings, loading } = useListings({ sellerId: session?.user.id });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={28} color={colors.textFaint} />
                </View>
              )}
              <Text style={styles.name}>{profile?.full_name || 'Your profile'}</Text>
              {session?.user.email ? <Text style={styles.email}>{session.user.email}</Text> : null}
              <View style={styles.headerActions}>
                <Button title="Edit profile" variant="outline" onPress={() => router.push('/edit-profile')} style={styles.editButton} />
                <Button title="Orders" variant="outline" onPress={() => router.push('/orders')} style={styles.editButton} />
                <Button title="Payout account" variant="outline" onPress={() => router.push('/payout-setup')} style={styles.editButton} />
                <Button title={profile?.is_admin ? 'Support (admin)' : 'Support'} variant="outline" onPress={() => router.push('/support')} style={styles.editButton} />
                <Button title="Settings" variant="outline" onPress={() => router.push('/settings')} style={styles.editButton} />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Your listings</Text>
          </View>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="pricetag-outline" title="You haven't listed anything yet" subtitle="Tap Sell to publish your first item." /> : null}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListFooterComponent={<Button title="Sign out" variant="danger" onPress={signOut} style={styles.signOut} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between' },
  profileHeader: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  headerActions: { marginTop: spacing.md, width: '100%', gap: spacing.sm },
  editButton: { width: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  signOut: { marginTop: spacing.lg },
});
