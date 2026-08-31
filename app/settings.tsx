import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { colors, radius, spacing } from '../src/theme/colors';

function Row({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const { profile, session, refreshProfile } = useAuth();
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [savingAnalytics, setSavingAnalytics] = useState(false);

  const updateProfile = async (patch: Record<string, unknown>) => {
    if (!session) return;
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
    if (error) Alert.alert('Could not save', error.message);
    await refreshProfile();
  };

  const onToggleHoliday = async (value: boolean) => {
    setSavingHoliday(true);
    await updateProfile({ holiday_mode: value });
    setSavingHoliday(false);
    if (value) {
      Alert.alert('Holiday mode on', "Your listings are now hidden from other buyers until you turn this back off.");
    }
  };

  const onToggleAnalytics = async (value: boolean) => {
    setSavingAnalytics(true);
    await updateProfile({ analytics_opt_in: value });
    setSavingAnalytics(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>For you</Text>
        <View style={styles.card}>
          <Row
            icon="sparkles-outline"
            title="Personalisation"
            subtitle="Pick categories you're interested in"
            onPress={() => router.push('/personalisation')}
          />
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Row icon="receipt-outline" title="My orders" onPress={() => router.push('/orders')} />
          <Row icon="wallet-outline" title="Balance" onPress={() => router.push('/balance')} />
        </View>

        <Text style={styles.sectionLabel}>Selling</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="airplane-outline"
            title="Holiday mode"
            subtitle="Hide your listings from buyers while you're away"
            value={!!profile?.holiday_mode}
            onValueChange={onToggleHoliday}
            disabled={savingHoliday}
          />
          <Row icon="rocket-outline" title="Promotional tools" subtitle="Boost a listing to the top of Home" onPress={() => router.push('/promotions')} />
        </View>

        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="analytics-outline"
            title="Analytics & cookies"
            subtitle="Allow anonymous usage data to help improve Vatexs"
            value={!!profile?.analytics_opt_in}
            onValueChange={onToggleAnalytics}
            disabled={savingAnalytics}
          />
        </View>

        <Text style={styles.sectionLabel}>Legal & about</Text>
        <View style={styles.card}>
          <Row icon="document-text-outline" title="Legal information" onPress={() => router.push('/legal')} />
          <Row icon="information-circle-outline" title="About Vatexs" onPress={() => router.push('/about')} />
        </View>

        <Text style={styles.sectionLabel}>Help</Text>
        <View style={styles.card}>
          <Row icon="book-outline" title="Your guide to Vatexs" onPress={() => router.push('/guide')} />
          <Row icon="help-buoy-outline" title="Support" onPress={() => router.push('/support')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.md, textTransform: 'uppercase' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
