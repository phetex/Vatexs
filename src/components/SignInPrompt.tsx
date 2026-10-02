import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { useThemedStyles } from '../context/ThemeContext';
import { spacing } from '../theme/colors';

interface SignInPromptProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

// Shown in place of account-based screens (Sell, Messages, Profile) for guests.
export function SignInPrompt({ icon, title, subtitle }: SignInPromptProps) {
  const router = useRouter();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' as const },
    actions: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <EmptyState icon={icon} title={title} subtitle={subtitle} />
      <View style={styles.actions}>
        <Button title="Sign in" onPress={() => router.push('/(auth)/sign-in')} />
        <Button title="Create account" variant="outline" onPress={() => router.push('/(auth)/sign-up')} />
      </View>
    </SafeAreaView>
  );
}
