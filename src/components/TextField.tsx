import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextField({ label, error, style, secureTextEntry, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const styles = useThemedStyles((colors) => ({
    container: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, marginBottom: spacing.xs },
    inputWrap: { position: 'relative' as const, justifyContent: 'center' as const },
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
    inputWithToggle: { paddingRight: 44 },
    toggle: { position: 'absolute' as const, right: spacing.md },
    error: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
    placeholder: { color: colors.textFaint },
  }));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          key={secureTextEntry ? String(visible) : undefined}
          placeholderTextColor={styles.placeholder.color}
          secureTextEntry={secureTextEntry && !visible}
          style={[styles.input, secureTextEntry ? styles.inputWithToggle : null, error ? styles.inputError : null, style]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable style={styles.toggle} onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
