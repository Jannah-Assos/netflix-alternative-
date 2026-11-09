const one = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

/** Première valeur textuelle non vide (les champs d'Internet Archive peuvent être des tableaux). */
export function str(v: unknown): string | undefined {
  const x = one(v);
  if (typeof x === 'string') return x.trim() || undefined;
  if (typeof x === 'number' && Number.isFinite(x)) return String(x);
  return undefined;
}

export function num(v: unknown): number | undefined {
  const x = one(v);
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function stripHtml(input?: string): string | undefined {
  if (!input) return undefined;
  const text = input
    .replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text || undefined;
}

export function truncate(s: string | undefined, max: number): string | undefined {
  if (!s) return s;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** Durée en secondes depuis `123.4` ou `01:02:03`. */
export function parseDuration(v: unknown): number | undefined {
  const x = one(v);
  if (typeof x === 'number') return Number.isFinite(x) ? x : undefined;
  if (typeof x !== 'string' || !x.trim()) return undefined;
  if (x.includes(':')) {
    const parts = x.split(':').map(Number);
    if (parts.some((p) => !Number.isFinite(p))) return undefined;
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

export function toHttps(u?: string): string | undefined {
  return u ? u.replace(/^http:\/\//i, 'https://') : u;
}

export function yearOf(v: unknown): number | undefined {
  const m = String(one(v) ?? '').match(/\b(1[89]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : undefined;
}
