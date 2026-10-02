import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { REPORT_REASONS, reportContent, type ReportReason, type ReportTargetType } from '../lib/moderation';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { radius, spacing } from '../theme/colors';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string | null;
  title?: string;
}

export function ReportModal({ visible, onClose, targetType, targetId, title }: ReportModalProps) {
  const { colors } = useTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const styles = useThemedStyles((colors) => ({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' as const },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.lg,
      maxHeight: '90%' as const,
    },
    headerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    title: { fontSize: 18, fontWeight: '800' as const, color: colors.text },
    intro: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 19 },
    reasonRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    reasonText: { flex: 1, fontSize: 15, color: colors.text, marginLeft: spacing.sm },
    input: {
      marginTop: spacing.md,
      minHeight: 70,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.sm + 2,
      fontSize: 14,
      color: colors.text,
      textAlignVertical: 'top' as const,
    },
    error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
    submit: { marginTop: spacing.md },
    doneWrap: { alignItems: 'center' as const, paddingVertical: spacing.lg },
    doneTitle: { fontSize: 17, fontWeight: '800' as const, color: colors.text, marginTop: spacing.sm },
    doneBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center' as const, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 19 },
  }));

  useEffect(() => {
    if (visible) {
      setReason(null);
      setDetails('');
      setError(null);
      setDone(false);
    }
  }, [visible]);

  const onSubmit = async () => {
    if (!reason || !targetId) return;
    setSubmitting(true);
    setError(null);
    const message = await reportContent({ targetType, targetId, reason, details: details.trim() || undefined });
    setSubmitting(false);
    if (message) setError(message);
    else setDone(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {done ? (
              <View style={styles.doneWrap}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                <Text style={styles.doneTitle}>Thanks for letting us know</Text>
                <Text style={styles.doneBody}>
                  Our team reviews every report and removes content and accounts that break our Terms, usually within 24 hours.
                </Text>
                <Button title="Done" onPress={onClose} style={{ alignSelf: 'stretch' }} />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{title ?? 'Report'}</Text>
                  <Pressable onPress={onClose} hitSlop={12}>
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.intro}>
                  Vatexs has no tolerance for objectionable content or abusive users. Tell us what's wrong and we'll review it.
                </Text>
                {REPORT_REASONS.map((r) => (
                  <Pressable key={r.key} style={styles.reasonRow} onPress={() => setReason(r.key)}>
                    <Ionicons
                      name={reason === r.key ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={reason === r.key ? colors.primary : colors.textFaint}
                    />
                    <Text style={styles.reasonText}>{r.label}</Text>
                  </Pressable>
                ))}
                <TextInput
                  style={styles.input}
                  placeholder="Add details (optional)"
                  placeholderTextColor={colors.textFaint}
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  maxLength={500}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title="Submit report" onPress={onSubmit} loading={submitting} disabled={!reason} style={styles.submit} />
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
