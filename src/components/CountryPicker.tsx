import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';
import { COUNTRIES } from '../lib/countries';

interface CountryPickerProps {
  label?: string;
  value: string | null;
  onChange: (code: string) => void;
}

export function CountryPicker({ label = 'Country', value, onChange }: CountryPickerProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = COUNTRIES.find((c) => c.code === value);
  const styles = useThemedStyles((colors) => ({
    container: { marginBottom: spacing.md },
    label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, marginBottom: spacing.xs },
    field: {
      height: 50,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    fieldText: { fontSize: 16, color: colors.text },
    placeholder: { color: colors.textFaint },
    modal: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    modalTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.text, flex: 1 },
    searchInput: {
      height: 44,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
      margin: spacing.lg,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowText: { fontSize: 15, color: colors.text },
  }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !selected && styles.placeholder]}>{selected ? selected.name : 'Select your country'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textFaint} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onChange(item.code);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <Text style={styles.rowText}>{item.name}</Text>
                {item.code === value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
