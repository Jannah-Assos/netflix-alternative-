import type { MediaKind } from '../../../server/src/types';

const common = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export function KindIcon({ kind }: { kind: MediaKind }) {
  switch (kind) {
    case 'video':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'audio':
      return (
        <svg {...common}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      );
    case 'software':
      return (
        <svg {...common}>
          <rect x="2.5" y="8" width="19" height="9" rx="4.5" />
          <path d="M8 12.5h3M9.5 11v3M15.5 11.5h.01M17.5 13.5h.01" />
        </svg>
      );
    case 'text':
      return (
        <svg {...common}>
          <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
          <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
        </svg>
      );
  }
}

export function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
