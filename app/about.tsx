import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';

export default function About() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xl, alignItems: 'center' as const },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: spacing.md,
    },
    brand: { fontSize: 24, fontWeight: '800' as const, color: colors.text, marginTop: spacing.md },
    tagline: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' as const },
    body: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: spacing.lg, textAlign: 'center' as const },
    card: { width: '100%' as const, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
    cardRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: spacing.xs },
    cardLabel: { fontSize: 13, color: colors.textMuted },
    cardValue: { fontSize: 13, fontWeight: '600' as const, color: colors.primary },
    footer: { fontSize: 11, color: colors.textFaint, marginTop: spacing.xl, textAlign: 'center' as const },
  }));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.logoWrap}>
          <Ionicons name="pricetags" size={32} color={colors.primary} />
        </View>
        <Text style={styles.brand}>Vatexs</Text>
        <Text style={styles.tagline}>Buy and sell fashion, tech, home & more — safely.</Text>

        <Text style={styles.body}>
          Vatexs is a marketplace built to make buying and selling secondhand and new goods simple and safe. Every
          paid order is protected by escrow: your money is held by Vatexs until you confirm the item arrived, so
          you never have to just trust a stranger.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Version</Text>
            <Text style={styles.cardValue}>{version}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Website</Text>
            <Text style={styles.cardValue} onPress={() => Linking.openURL('https://vatexs.store')}>
              vatexs.store
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Support</Text>
            <Text style={styles.cardValue} onPress={() => Linking.openURL('mailto:support@vatexs.store')}>
              support@vatexs.store
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>Made for buyers and sellers across Nigeria and West Africa.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
