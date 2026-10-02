import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';

let version = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Screens that render other users' content (Home, Search) re-fetch when this changes,
// so a blocked user's listings disappear immediately instead of on the next app launch.
export function useBlockVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

export async function fetchBlockedIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId);
  return new Set((data ?? []).map((b) => b.blocked_id as string));
}

export function notifyBlocklistChanged() {
  version += 1;
  listeners.forEach((l) => l());
}

export async function blockUser(blockerId: string, blockedId: string): Promise<string | null> {
  const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_id: blockedId });
  // 23505 = already blocked; treat as success.
  if (error && error.code !== '23505') return error.message;
  notifyBlocklistChanged();
  return null;
}
