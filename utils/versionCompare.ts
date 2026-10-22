// utils/versionCompare.ts
export function isVersionOutdated(current: string, minimum: string): boolean {
  const cur = current.split('.').map(Number);
  const min = minimum.split('.').map(Number);
  const len = Math.max(cur.length, min.length);

  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0;
    const m = min[i] ?? 0;
    if (c < m) return true;   // current is older
    if (c > m) return false;  // current is newer
  }
  return false; // equal
}