import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { navigate, type View } from '../hooks';
import { useI18n } from '../i18n';
import { LANGS } from '../messages';
import { SearchIcon } from './icons';
import { Link } from './Link';
import { LogoMark, Wordmark } from './Logo';

const LINKS: { view: View; href: string; label: 'nav.home' | 'nav.catalogue' | 'nav.archive' | 'nav.list' }[] = [
  { view: 'home', href: '/', label: 'nav.home' },
  { view: 'catalogue', href: '/catalogue', label: 'nav.catalogue' },
  { view: 'archive', href: '/archive', label: 'nav.archive' },
  { view: 'list', href: '/liste', label: 'nav.list' },
];

export function NavBar({ view, archive }: { view: View; archive: boolean }) {
  const { t, lang, setLang } = useI18n();
  const [q, setQ] = useState('');
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = q.trim();
    if (text) navigate(`/catalogue?q=${encodeURIComponent(text)}`);
  };

  return (
    <header className={`nav ${solid ? 'solid' : ''}`}>
      <div className="nav-inner">
        <Link className="brand" to="/" aria-label={t('app.name')}>
          <LogoMark />
          <Wordmark />
        </Link>

        <nav className="nav-links" aria-label="Navigation">
          {LINKS.filter((l) => archive || l.view !== 'archive').map((l) => (
            <Link key={l.view} to={l.href} aria-current={view === l.view ? 'page' : undefined}>
              {t(l.label)}
            </Link>
          ))}
        </nav>

        <form className="nav-search" role="search" onSubmit={submit}>
          <SearchIcon />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('nav.search')}
            autoComplete="off"
            maxLength={200}
          />
        </form>

        <div className="lang" role="group" aria-label={t('nav.language')}>
          {LANGS.map((l) => (
            <button key={l} type="button" className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
