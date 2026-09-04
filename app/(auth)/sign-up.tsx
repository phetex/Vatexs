import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { useThemedStyles } from '../../src/context/ThemeContext';
import { spacing } from '../../src/theme/colors';

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' as const },
    title: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
    subtitle: { marginTop: spacing.xs, fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
    form: { marginTop: spacing.md },
    error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
    notice: { color: colors.success, fontSize: 13, marginBottom: spacing.md },
    footer: { flexDirection: 'row' as const, justifyContent: 'center' as const, marginTop: spacing.lg },
    footerText: { color: colors.textMuted, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: '700' as const },
  }));

  const onSubmit = async () => {
    setError(null);
    setNotice(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    setNotice('Account created. If email confirmation is required, check your inbox before signing in.');
    setTimeout(() => router.replace('/(tabs)'), 400);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join Vatexs to start buying and selling in minutes.</Text>

          <View style={styles.form}>
            <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jordan Smith" />
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
            />
            <TextField
              label="Confirm password"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <Button
              title="Create account"
              onPress={onSubmit}
              loading={loading}
              disabled={!email || !password || !fullName || !confirmPassword}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
