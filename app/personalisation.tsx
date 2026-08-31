import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { CategoryChip } from '../src/components/CategoryChip';
import { useAuth } from '../src/context/AuthContext';
import { useCategories } from '../src/hooks/useCategories';
import { supabase } from '../src/lib/supabase';
import { useThemedStyles } from '../src/context/ThemeContext';
import { spacing } from '../src/theme/colors';

export default function Personalisation() {
  const { profile, session, refreshProfile } = useAuth();
  const { categories } = useCategories();
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.lg },
    title: { fontSize: 22, fontWeight: '800' as const, color: colors.text, marginBottom: spacing.xs },
    subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
    chipsWrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
    saved: { color: colors.success, fontSize: 13, fontWeight: '600' as const, marginTop: spacing.md, textAlign: 'center' as const },
    save: { marginTop: spacing.lg },
  }));

  useEffect(() => {
    if (profile?.interested_categories) setSelected(profile.interested_categories);
  }, [profile?.interested_categories]);

  const toggle = (id: number) => {
    setSaved(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const onSave = async () => {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ interested_categories: selected }).eq('id', session.user.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      await refreshProfile();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>Pick a few categories and we'll bring them to the top of your Home feed.</Text>

        <View style={styles.chipsWrap}>
          {categories.map((c) => (
            <CategoryChip key={c.id} label={c.name} icon={c.icon as any} active={selected.includes(c.id)} onPress={() => toggle(c.id)} />
          ))}
        </View>

        {saved ? <Text style={styles.saved}>Saved ✓</Text> : null}
        <Button title="Save preferences" onPress={onSave} loading={saving} style={styles.save} />
      </ScrollView>
    </SafeAreaView>
  );
}
