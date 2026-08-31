import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';
import { TextField } from '../src/components/TextField';
import { supabase } from '../src/lib/supabase';
import { functionErrorMessage } from '../src/lib/functionError';
import { usePayoutAccount } from '../src/hooks/usePayoutAccount';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { radius, spacing } from '../src/theme/colors';

interface Bank {
  name: string;
  code: string;
}

export default function PayoutSetup() {
  const { colors } = useTheme();
  const { account, loading: accountLoading, refresh } = usePayoutAccount();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    loading: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    currentCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    currentTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.text },
    currentSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    warnCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    warnText: { flex: 1, marginLeft: spacing.sm, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
    sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.text, marginBottom: spacing.md },
    bankList: { marginTop: spacing.sm },
    bankRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bankName: { fontSize: 14, color: colors.text },
    selectedBankRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.md },
    selectedBankText: { fontSize: 15, fontWeight: '700' as const, color: colors.primary, marginLeft: 4 },
  }));

  useEffect(() => {
    supabase.functions
      .invoke('list-banks')
      .then(({ data, error }) => {
        if (!error && data?.banks) setBanks(data.banks);
        setBanksLoading(false);
      })
      .catch(() => setBanksLoading(false));
  }, []);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    const q = search.trim().toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, search]);

  const onSubmit = async () => {
    if (!selectedBank || accountNumber.trim().length < 10) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('onboard-seller-bank', {
      body: { account_number: accountNumber.trim(), bank_code: selectedBank.code, bank_name: selectedBank.name },
    });
    setSubmitting(false);
    if (error || data?.error) {
      Alert.alert('Could not verify account', await functionErrorMessage(error, data, 'Please check the details and try again.'));
      return;
    }
    Alert.alert('Payout account saved', `Confirmed: ${data.account_name}`);
    setSelectedBank(null);
    setAccountNumber('');
    refresh();
  };

  if (accountLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {account ? (
        <View style={styles.currentCard}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.currentTitle}>Payout account active</Text>
            <Text style={styles.currentSubtitle}>
              {account.bank_name} •••• {account.account_number_last4} ({account.account_name})
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.warnCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.warnText}>
            You need a payout account before buyers can release payments to you for items you sell.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{account ? 'Update payout account' : 'Add a payout account'}</Text>

      {!selectedBank ? (
        <>
          <TextField label="Search your bank" value={search} onChangeText={setSearch} placeholder="e.g. GTBank" />
          {banksLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              style={styles.bankList}
              renderItem={({ item }) => (
                <Pressable style={styles.bankRow} onPress={() => setSelectedBank(item)}>
                  <Text style={styles.bankName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Pressable>
              )}
            />
          )}
        </>
      ) : (
        <View>
          <Pressable style={styles.selectedBankRow} onPress={() => setSelectedBank(null)}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
            <Text style={styles.selectedBankText}>{selectedBank.name}</Text>
          </Pressable>
          <TextField
            label="Account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="10-digit NUBAN account number"
            keyboardType="number-pad"
            maxLength={10}
          />
          <Button
            title="Verify & save"
            onPress={onSubmit}
            loading={submitting}
            disabled={accountNumber.trim().length < 10}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
