import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';

function Row({ icon, title, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing.md,
    },
    rowTitle: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: colors.text },
  }));
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <Ionicons name="open-outline" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

export default function Legal() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
    intro: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.lg },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' as const, marginBottom: spacing.lg },
    sectionLabel: { fontSize: 13, fontWeight: '700' as const, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' as const },
    body: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Vatexs is operated as a peer-to-peer marketplace. Buyers and sellers transact directly with each other;
          Vatexs facilitates payment escrow and dispute resolution but is not a party to the sale itself.
        </Text>

        <View style={styles.card}>
          <Row icon="document-text-outline" title="Privacy Policy" onPress={() => Linking.openURL('https://vatexs.store/privacy.html')} />
          <Row icon="reader-outline" title="Terms of Service" onPress={() => Linking.openURL('https://vatexs.store/terms.html')} />
        </View>

        <Text style={styles.sectionLabel}>Payments</Text>
        <Text style={styles.body}>
          Payments are processed by Paystack. Funds are held in escrow until the buyer confirms receipt, at which
          point they're transferred to the seller's verified bank account, minus a 10% Vatexs service fee.
        </Text>

        <Text style={styles.sectionLabel}>Disputes & refunds</Text>
        <Text style={styles.body}>
          If an order goes wrong, either party can open a support ticket. Vatexs can issue a refund to the buyer
          directly from escrow while a ticket is under review.
        </Text>

        <Text style={styles.sectionLabel}>Contact</Text>
        <Text style={styles.body}>For legal or compliance enquiries, contact us at support@vatexs.store.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
