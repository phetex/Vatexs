import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme/colors';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://vatexs.com/reset-password.html',
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Reset your password</Text>

          {sent ? (
            <View>
              <Text style={styles.subtitle}>
                If an account exists for {email.trim()}, we've sent a link to reset your password. Open it to set a
                new password, then come back and sign in.
              </Text>
              <Button title="Back to sign in" variant="outline" onPress={() => router.replace('/(auth)/sign-in')} style={styles.backButton} />
            </View>
          ) : (
            <View>
              <Text style={styles.subtitle}>Enter your account email and we'll send you a reset link.</Text>
              <View style={styles.form}>
                <TextField
                  label="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title="Send reset link" onPress={onSubmit} loading={loading} disabled={!email.trim()} />
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered it? </Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  form: { marginTop: spacing.md },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
  backButton: { marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
