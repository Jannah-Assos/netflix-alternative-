/** Symbole Openflix : un anneau ouvert (l'« open ») traversé d'un triangle de lecture. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="57 15.3" transform="rotate(-48 16 16)" />
      <path d="M13.3 11.4v9.2l7.7-4.6z" fill="currentColor" />
    </svg>
  );
}

/** Logotype : « Open » en crème, « flix » en ambre. */
export function Wordmark() {
  return (
    <span className="wordmark">
      <span>Open</span>
      <span className="wordmark-accent">flix</span>
    </span>
  );
}
