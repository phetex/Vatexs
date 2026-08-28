import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { colors, spacing } from '../../src/theme/colors';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>V</Text>
        </View>
        <Text style={styles.title}>Vatexs</Text>
        <Text style={styles.subtitle}>Buy and sell fashion, tech, home essentials and more — from people near you.</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Create account" onPress={() => router.push('/(auth)/sign-up')} />
        <Button title="I already have an account" variant="outline" onPress={() => router.push('/(auth)/sign-in')} style={styles.secondButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'space-between', padding: spacing.lg },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoLetter: { color: colors.white, fontSize: 34, fontWeight: '800' },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  actions: { paddingBottom: spacing.md },
  secondButton: { marginTop: spacing.sm },
});
