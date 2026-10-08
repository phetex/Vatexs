import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { CountryPicker } from '../../src/components/CountryPicker';
import { useAuth } from '../../src/context/AuthContext';
import { PASSWORD_HINT, validatePassword } from '../../src/lib/passwordPolicy';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { spacing } from '../../src/theme/colors';

export default function SignUp() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(ref ?? '');
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
    agreeRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, marginBottom: spacing.md },
    agreeText: { flex: 1, marginLeft: spacing.sm, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    agreeLink: { color: colors.primary, fontWeight: '700' as const },
    browseLink: { color: colors.textMuted, fontSize: 13, fontWeight: '600' as const, textAlign: 'center' as const, marginTop: spacing.md },
    footer: { flexDirection: 'row' as const, justifyContent: 'center' as const, marginTop: spacing.lg },
    footerText: { color: colors.textMuted, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: '700' as const },
  }));

  const onSubmit = async () => {
    setError(null);
    setNotice(null);
    const policyError = validatePassword(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service to create an account.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim(), countryCode, referralCode.trim() || null);
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
              placeholder={PASSWORD_HINT}
            />
            <TextField
              label="Confirm password"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
            />
            <CountryPicker value={countryCode} onChange={setCountryCode} />
            <TextField
              label="Referral code (optional)"
              autoCapitalize="characters"
              value={referralCode}
              onChangeText={setReferralCode}
              placeholder="e.g. AB12CD34"
            />
            <Pressable style={styles.agreeRow} onPress={() => setAgreed((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
              <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={22} color={agreed ? colors.primary : colors.textFaint} />
              <Text style={styles.agreeText}>
                I agree to the{' '}
                <Text style={styles.agreeLink} onPress={() => Linking.openURL('https://vatexs.store/terms.html')}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.agreeLink} onPress={() => Linking.openURL('https://vatexs.store/privacy.html')}>
                  Privacy Policy
                </Text>
                . Vatexs has zero tolerance for objectionable content and abusive users — content can be reported, users can be blocked, and violators are removed.
              </Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <Button
              title="Create account"
              onPress={onSubmit}
              loading={loading}
              disabled={!email || !password || !fullName || !confirmPassword || !agreed}
            />
            <Text style={styles.browseLink} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
              Continue browsing without an account
            </Text>
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
