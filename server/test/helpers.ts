import type { Http } from '../src/http.js';
import type { LinkCheck } from '../src/types.js';

/** Http factice : répond avec des JSON prédéfinis selon un motif d'URL. */
export function fakeHttp(routes: Record<string, unknown>, head: LinkCheck = { alive: true, status: 200 }): Http & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async json<T>(url: string): Promise<T> {
      calls.push(url);
      const key = Object.keys(routes).find((k) => url.includes(k));
      if (key === undefined) throw new Error(`URL non prévue dans le test : ${url}`);
      const value = routes[key];
      if (value instanceof Error) throw value;
      return value as T;
    },
    async head(url: string): Promise<LinkCheck> {
      calls.push(`HEAD ${url}`);
      return head;
    },
  };
}
