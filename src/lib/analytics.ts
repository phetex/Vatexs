import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const ANON_ID_KEY = 'vatexs.analyticsAnonId';

let optedIn = false;
let anonId: string | null = null;
let anonIdPromise: Promise<string> | null = null;

// No security property needed here — just a random, non-identifying label
// for grouping anonymous events from the same device. Avoids depending on
// crypto.randomUUID(), which isn't guaranteed available on Hermes.
function randomId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

async function getAnonId(): Promise<string> {
  if (anonId) return anonId;
  if (!anonIdPromise) {
    anonIdPromise = (async () => {
      try {
        const existing = await AsyncStorage.getItem(ANON_ID_KEY);
        if (existing) return existing;
        const fresh = randomId();
        await AsyncStorage.setItem(ANON_ID_KEY, fresh);
        return fresh;
      } catch {
        return randomId();
      }
    })();
  }
  anonId = await anonIdPromise;
  return anonId;
}

// Called from AuthContext whenever the profile loads/changes — keeps this
// module's gate in sync with the Settings toggle without threading the
// profile through every call site.
export function setAnalyticsOptIn(value: boolean) {
  optedIn = value;
}

export async function trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
  if (!optedIn) return;
  try {
    const id = await getAnonId();
    await supabase.from('analytics_events').insert({ anon_id: id, event_name: eventName, properties });
  } catch {
    // best-effort only — analytics must never disrupt the app
  }
}

export function useTrackScreen(screenName: string) {
  useEffect(() => {
    trackEvent('screen_view', { screen: screenName });
  }, [screenName]);
}
