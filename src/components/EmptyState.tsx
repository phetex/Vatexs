import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { spacing } from '../theme/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: spacing.xl * 2, paddingHorizontal: spacing.lg },
    title: { marginTop: spacing.md, fontSize: 16, fontWeight: '600' as const, color: colors.text, textAlign: 'center' as const },
    subtitle: { marginTop: spacing.xs, fontSize: 13, color: colors.textMuted, textAlign: 'center' as const },
  }));

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.textFaint} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
