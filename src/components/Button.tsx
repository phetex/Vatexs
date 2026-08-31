import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const { base, variantStyles, textVariantStyles } = useMemo(() => {
    const base = StyleSheet.create({
      base: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
      disabled: { opacity: 0.5 },
      pressed: { opacity: 0.85 },
      text: { fontSize: 16, fontWeight: '600' as const },
    });
    const variantStyles: Record<NonNullable<ButtonProps['variant']>, StyleProp<ViewStyle>> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.primaryLight },
      outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
      danger: { backgroundColor: colors.danger },
    };
    const textVariantStyles: Record<NonNullable<ButtonProps['variant']>, StyleProp<TextStyle>> = {
      primary: { color: colors.white },
      secondary: { color: colors.primary },
      outline: { color: colors.text },
      danger: { color: colors.white },
    };
    return { base, variantStyles, textVariantStyles };
  }, [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        base.base,
        variantStyles[variant],
        isDisabled && base.disabled,
        pressed && !isDisabled && base.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={[base.text, textVariantStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}
