import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';

interface CategoryChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, icon, active, onPress }: CategoryChipProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    icon: { marginRight: 6 },
    label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
    labelActive: { color: colors.white },
  }));

  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      {icon ? (
        <Ionicons name={icon} size={16} color={active ? colors.white : colors.textMuted} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}
