import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const styles = useThemedStyles((colors) => ({
    container: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, marginBottom: spacing.xs },
    input: {
      height: 50,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    inputError: { borderColor: colors.danger },
    error: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
    placeholder: { color: colors.textFaint },
  }));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={styles.placeholder.color}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
