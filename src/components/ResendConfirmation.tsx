import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useThemedStyles } from '../context/ThemeContext';
import { spacing } from '../theme/colors';

const COOLDOWN_SECONDS = 60;

export function ResendConfirmation({ email }: { email: string }) {
  const { resendConfirmation } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const styles = useThemedStyles((colors) => ({
    wrap: { alignItems: 'center' as const, marginBottom: spacing.md },
    link: { color: colors.primary, fontSize: 14, fontWeight: '700' as const },
    linkDisabled: { color: colors.textFaint },
    ok: { color: colors.success, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' as const },
    bad: { color: colors.danger, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' as const },
  }));

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onPress = async () => {
    if (!email.trim() || sending || cooldown > 0) return;
    setSending(true);
    setMessage(null);
    const { error } = await resendConfirmation(email.trim());
    setSending(false);
    if (error) {
      setMessage({ text: error, ok: false });
      return;
    }
    setMessage({ text: 'Confirmation email sent. Check your inbox and your spam folder.', ok: true });
    setCooldown(COOLDOWN_SECONDS);
  };

  const disabled = sending || cooldown > 0 || !email.trim();
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
        <Text style={[styles.link, disabled && styles.linkDisabled]}>
          {sending ? 'Sending…' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend confirmation email'}
        </Text>
      </Pressable>
      {message ? <Text style={message.ok ? styles.ok : styles.bad}>{message.text}</Text> : null}
    </View>
  );
}
