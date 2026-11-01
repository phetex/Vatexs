import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';

interface UpdateBannerProps {
  version: string;
  url: string;
  onDismiss: () => void;
}

export function UpdateBanner({ version, url, onDismiss }: UpdateBannerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    banner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      marginBottom: spacing.md,
    },
    text: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
    title: { fontWeight: '700' as const },
    button: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, marginLeft: spacing.sm },
    buttonText: { color: colors.white, fontSize: 13, fontWeight: '700' as const },
    close: { padding: spacing.xs, marginLeft: spacing.xs },
  }));

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        <Text style={styles.title}>Update available. </Text>
        Version {version} of Vatexs is ready.
      </Text>
      <Pressable style={styles.button} onPress={() => Linking.openURL(url)} accessibilityRole="button">
        <Text style={styles.buttonText}>Update</Text>
      </Pressable>
      <Pressable style={styles.close} onPress={onDismiss} hitSlop={10} accessibilityLabel="Dismiss">
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
