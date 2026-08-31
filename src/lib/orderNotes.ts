import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

export type OrderNoteType = 'grn' | 'issue_note';

export async function downloadOrderNote(orderId: string, type: OrderNoteType) {
  const { data, error } = await supabase.functions.invoke('order-note', { body: { order_id: orderId, type } });
  if (error || data?.error) {
    throw new Error(data?.error ?? error?.message ?? 'Could not generate the document.');
  }

  const fileUri = `${FileSystem.cacheDirectory}${data.filename}`;
  await FileSystem.writeAsStringAsync(fileUri, data.base64, { encoding: FileSystem.EncodingType.Base64 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: data.filename });
  }
}
