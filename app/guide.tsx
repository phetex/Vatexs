import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';

interface Section {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    icon: 'search-outline',
    title: 'Buying',
    body: 'Browse by category or search for what you want. Tap a listing to see photos, description, and seller details. Message the seller with any questions before you buy.',
  },
  {
    icon: 'add-circle-outline',
    title: 'Selling',
    body: "Tap Sell, add up to 6 photos, set your price and category, and publish. Your listing goes live immediately — you can mark it sold or delete it any time from the listing page.",
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Payments & escrow',
    body: "For NGN listings, buyers can pay in-app via Paystack. Vatexs holds the payment until the buyer confirms the item arrived, then releases it to the seller (minus a 10% fee). Sellers need a payout account set up (Profile → Payout account) to receive money.",
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Messaging',
    body: 'Every conversation is tied to a listing, so context is never lost. You\'ll get a push notification when someone replies.',
  },
  {
    icon: 'help-buoy-outline',
    title: 'Problems & disputes',
    body: "If an order goes wrong, open Orders → Report a problem. Our team reviews it and can issue a refund directly if the payment is still held in escrow.",
  },
  {
    icon: 'airplane-outline',
    title: 'Going away?',
    body: "Turn on Holiday mode (Profile → Settings) to hide your listings from buyers while you're unavailable. Nothing gets deleted — just switch it back off when you're back.",
  },
];

export default function Guide() {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
    title: { fontSize: 22, fontWeight: '800' as const, color: colors.text, marginBottom: spacing.xs },
    subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      backgroundColor: colors.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: spacing.sm,
    },
    cardTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text, marginBottom: 4 },
    cardBody: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your guide to Vatexs</Text>
        <Text style={styles.subtitle}>Everything you need to know to buy and sell with confidence.</Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
