import { supabase } from './supabase';
import { functionErrorMessage } from './functionError';

export type ReportTargetType = 'listing' | 'message' | 'user';

export const REPORT_REASONS = [
  { key: 'spam_scam', label: 'Spam or scam' },
  { key: 'offensive', label: 'Offensive or inappropriate' },
  { key: 'prohibited_item', label: 'Prohibited item' },
  { key: 'harassment', label: 'Harassment or abuse' },
  { key: 'other', label: 'Other' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['key'];

export async function reportContent(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('report-content', {
    body: { target_type: params.targetType, target_id: params.targetId, reason: params.reason, details: params.details },
  });
  if (error || data?.error) return functionErrorMessage(error, data, 'Could not submit your report.');
  return null;
}
