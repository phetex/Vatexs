import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'vatexs.exchangeRates.v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

interface CachedRates {
  base: 'USD';
  rates: Record<string, number>;
  fetchedAt: number;
}

let memoryCache: CachedRates | null = null;
let inFlight: Promise<CachedRates | null> | null = null;

async function loadRates(): Promise<CachedRates | null> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) return memoryCache;

  try {
    const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const cached: CachedRates = JSON.parse(cachedRaw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        memoryCache = cached;
        return cached;
      }
    }
  } catch {
    // ignore cache read errors, fall through to network
  }

  try {
    const res = await fetch(RATES_URL);
    const data = await res.json();
    if (!data?.rates) return memoryCache;
    const fresh: CachedRates = { base: 'USD', rates: data.rates, fetchedAt: Date.now() };
    memoryCache = fresh;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
    return fresh;
  } catch {
    return memoryCache;
  }
}

// Estimate-only conversion between two currencies via a shared USD base.
// Real payment charges are unaffected — this never touches the payment flow.
export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number> | null): number | null {
  if (!rates || from === to) return from === to ? amount : null;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number> | null>(memoryCache?.rates ?? null);

  useEffect(() => {
    let cancelled = false;
    if (!inFlight) inFlight = loadRates();
    inFlight.then((result) => {
      inFlight = null;
      if (!cancelled && result) setRates(result.rates);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rates, convert: (amount: number, from: string, to: string) => convertAmount(amount, from, to, rates) };
}
