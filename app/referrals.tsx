import { Share, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { useAuth } from '../src/context/AuthContext';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { useExchangeRates } from '../src/hooks/useExchangeRates';
import { currencyForCountry } from '../src/lib/countries';
import { formatPrice } from '../src/lib/format';
import { radius, spacing } from '../src/theme/colors';

export default function Referrals() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { convert } = useExchangeRates();
  const code = profile?.referral_code ?? '';
  const balance = profile?.wallet_credit_ngn ?? 0;
  const viewerCurrency = currencyForCountry(profile?.country_code);
  const convertedBalance = viewerCurrency && viewerCurrency !== 'NGN' ? convert(balance, 'NGN', viewerCurrency) : null;

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
    hero: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: spacing.md,
    },
    heroTitle: { fontSize: 18, fontWeight: '800' as const, color: colors.text, textAlign: 'center' as const },
    heroSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' as const, marginTop: 6, lineHeight: 19 },
    balanceCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
    balanceLabel: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
    balanceAmount: { fontSize: 26, fontWeight: '800' as const, color: colors.text, marginTop: 4 },
    balanceEstimate: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
    codeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed' as const,
      padding: spacing.lg,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    codeLabel: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted, marginBottom: 6 },
    code: { fontSize: 24, fontWeight: '800' as const, color: colors.primary, letterSpacing: 3 },
    shareButton: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.text, marginBottom: spacing.sm },
    step: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, marginBottom: spacing.md },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing.sm,
    },
    stepNumberText: { fontSize: 12, fontWeight: '800' as const, color: colors.primary },
    stepText: { flex: 1, fontSize: 13.5, color: colors.textMuted, lineHeight: 19 },
    note: { fontSize: 12, color: colors.textFaint, lineHeight: 18, marginTop: spacing.md },
  }));

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on Vatexs! Use my referral code ${code} when you sign up: https://vatexs.store?ref=${code}`,
      });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift" size={26} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Refer & earn</Text>
          <Text style={styles.heroSubtitle}>
            Invite a friend to Vatexs. When they complete their first order, you earn credit worth about £10 —
            redeemable against your own purchases.
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your wallet credit</Text>
          <Text style={styles.balanceAmount}>{formatPrice(balance, 'NGN')}</Text>
          {convertedBalance != null ? <Text style={styles.balanceEstimate}>≈ {formatPrice(convertedBalance, viewerCurrency!)}</Text> : null}
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.code}>{code}</Text>
        </View>
        <Button title="Share my code" onPress={onShare} style={styles.shareButton} />

        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Share your code with a friend who doesn't use Vatexs yet.</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>They enter it when creating their account.</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Once they complete their first order, ~£10 in Vatexs credit lands in your wallet.</Text>
        </View>

        <Text style={styles.note}>
          Wallet credit can be applied at checkout to reduce what you pay in Naira. It has no cash withdrawal value
          and can't be transferred.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
