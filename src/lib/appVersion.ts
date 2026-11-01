function parts(version: string): number[] {
  return version
    .split('.')
    .map((p) => parseInt(p, 10))
    .map((n) => (Number.isNaN(n) ? 0 : n));
}

// True when `installed` is an older version than `latest` (e.g. "1.0.1" < "1.0.2").
export function isOlderVersion(installed: string, latest: string): boolean {
  const a = parts(installed);
  const b = parts(latest);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}
