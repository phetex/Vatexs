import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { createSessionFromUrl } from '../src/lib/authDeepLink';
import { registerForPushNotifications } from '../src/lib/pushNotifications';
import { colors } from '../src/theme/colors';

function RootNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!url) return;
    createSessionFromUrl(url)
      .then((result) => {
        if (result?.type === 'recovery') {
          router.push('/update-password');
        }
      })
      .catch(() => {
        // Not an auth link (e.g. the Paystack payment callback) — ignore.
      });
  }, [url]);

  useEffect(() => {
    if (session) registerForPushNotifications(session.user.id);
  }, [session?.user.id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listing/[id]"
          options={{ headerShown: true, title: '', headerTransparent: true, headerTintColor: colors.white }}
        />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, headerTintColor: colors.text }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: true, title: 'Edit profile', presentation: 'modal' }} />
        <Stack.Screen name="payout-setup" options={{ headerShown: true, title: 'Payout account', presentation: 'modal' }} />
        <Stack.Screen name="orders" options={{ headerShown: true, title: 'Orders' }} />
        <Stack.Screen name="update-password" options={{ headerShown: true, title: 'Set new password' }} />
        <Stack.Screen name="support" options={{ headerShown: true, title: 'Support' }} />
        <Stack.Screen name="new-ticket" options={{ headerShown: true, title: 'New ticket', presentation: 'modal' }} />
        <Stack.Screen name="ticket/[id]" options={{ headerShown: true, title: 'Ticket' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="personalisation" options={{ headerShown: true, title: 'Personalisation' }} />
        <Stack.Screen name="guide" options={{ headerShown: true, title: 'Your guide to Vatexs' }} />
        <Stack.Screen name="balance" options={{ headerShown: true, title: 'Balance' }} />
        <Stack.Screen name="promotions" options={{ headerShown: true, title: 'Promotional tools' }} />
        <Stack.Screen name="legal" options={{ headerShown: true, title: 'Legal information' }} />
        <Stack.Screen name="about" options={{ headerShown: true, title: 'About Vatexs' }} />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
