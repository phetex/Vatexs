import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { isOlderVersion } from '../lib/appVersion';

const DISMISSED_KEY = 'vatexs.updateNotice.dismissedVersion';

interface UpdateNotice {
  version: string;
  url: string;
}

// Shows a dismissible "update available" notice when the installed version is older than
// the latest published version stored in public.app_release.
export function useUpdateNotice() {
  const [notice, setNotice] = useState<UpdateNotice | null>(null);

  const check = useCallback(async () => {
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null;
    const installed = Constants.expoConfig?.version;
    if (!platform || !installed) return;

    const { data } = await supabase.from('app_release').select('latest_version, store_url').eq('platform', platform).maybeSingle();
    if (!data || !data.store_url?.startsWith('https://') || !isOlderVersion(installed, data.latest_version)) {
      setNotice(null);
      return;
    }

    let dismissed: string | null = null;
    try {
      dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
    } catch {
      // ignore storage errors; just show the notice
    }
    setNotice(dismissed === data.latest_version ? null : { version: data.latest_version, url: data.store_url });
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const dismiss = useCallback(async () => {
    if (notice) {
      try {
        await AsyncStorage.setItem(DISMISSED_KEY, notice.version);
      } catch {
        // ignore
      }
    }
    setNotice(null);
  }, [notice]);

  return { notice, dismiss };
}
