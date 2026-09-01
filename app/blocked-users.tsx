import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';

interface BlockedRow {
  blocked_id: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

export default function BlockedUsers() {
  const { session } = useAuth();
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
    row: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.sm },
    avatar: { width: 44, height: 44, borderRadius: radius.pill },
    avatarPlaceholder: { backgroundColor: colors.surface, alignItems: 'center' as const, justifyContent: 'center' as const },
    name: { fontSize: 15, fontWeight: '600' as const, color: colors.text, flex: 1, marginLeft: spacing.md },
  }));

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_id, profiles:profiles!blocked_users_blocked_id_fkey ( full_name, avatar_url )')
      .eq('blocker_id', session.user.id)
      .order('created_at', { ascending: false });
    setRows((data as unknown as BlockedRow[]) ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const onUnblock = async (blockedId: string) => {
    if (!session) return;
    setUnblockingId(blockedId);
    await supabase.from('blocked_users').delete().eq('blocker_id', session.user.id).eq('blocked_id', blockedId);
    setUnblockingId(null);
    load();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#5B4EFF" style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {rows.length === 0 ? (
          <EmptyState icon="hand-left-outline" title="No blocked users" subtitle="Users you block will show up here so you can unblock them any time." />
        ) : (
          rows.map((row) => (
            <View key={row.blocked_id} style={styles.row}>
              {row.profiles?.avatar_url ? (
                <Image source={{ uri: row.profiles.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={18} color="#A0A0B0" />
                </View>
              )}
              <Text style={styles.name}>{row.profiles?.full_name || 'Vatexs user'}</Text>
              <Button
                title="Unblock"
                variant="outline"
                onPress={() => onUnblock(row.blocked_id)}
                loading={unblockingId === row.blocked_id}
                style={{ minWidth: 96 }}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
