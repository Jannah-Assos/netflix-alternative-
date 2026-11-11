import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { navigate, type View } from '../hooks';
import { useI18n } from '../i18n';
import { LANGS } from '../messages';
import { SearchIcon } from './icons';
import { LogoMark, Wordmark } from './Logo';

const LINKS: { view: View; href: string; label: 'nav.home' | 'nav.explore' | 'nav.list' }[] = [
  { view: 'home', href: '#/', label: 'nav.home' },
  { view: 'explore', href: '#/explore', label: 'nav.explore' },
  { view: 'list', href: '#/list', label: 'nav.list' },
];

export function NavBar({ view }: { view: View }) {
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
    if (text) navigate('explore', { q: text });
  };

  return (
    <header className={`nav ${solid ? 'solid' : ''}`}>
      <div className="nav-inner">
        <a className="brand" href="#/" aria-label={t('app.name')}>
          <LogoMark />
          <Wordmark />
        </a>

        <nav className="nav-links" aria-label="Navigation">
          {LINKS.map((l) => (
            <a key={l.view} href={l.href} aria-current={view === l.view ? 'page' : undefined}>
              {t(l.label)}
            </a>
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
