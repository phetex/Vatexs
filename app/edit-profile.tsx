import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { useThemedStyles } from '../src/context/ThemeContext';
import { spacing } from '../src/theme/colors';

export default function EditProfile() {
  const { session, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg },
    textArea: { height: 90, paddingTop: spacing.sm, textAlignVertical: 'top' as const },
    save: { marginTop: spacing.md },
  }));

  const onSave = async () => {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), location: location.trim() || null, phone: phone.trim() || null, bio: bio.trim() || null })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refreshProfile();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
          <TextField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Manchester" />
          <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="Shown only to buyers you message" keyboardType="phone-pad" />
          <TextField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell buyers a bit about you" multiline numberOfLines={3} style={styles.textArea} />
          <Button title="Save changes" onPress={onSave} loading={saving} style={styles.save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
