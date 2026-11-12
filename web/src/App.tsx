import { useCallback, useEffect, useState } from 'react';
import type { AppConfig, MediaItem } from '../../server/src/types';
import { config } from './api';
import { DetailPanel } from './components/DetailPanel';
import { Link } from './components/Link';
import { NavBar } from './components/NavBar';
import { Watch } from './components/Watch';
import { navigate, useRoute } from './hooks';
import { useI18n } from './i18n';
import { About } from './views/About';
import { Catalogue } from './views/Catalogue';
import { Explore } from './views/Explore';
import { Film } from './views/Film';
import { Home } from './views/Home';
import { MyList } from './views/MyList';

export function App() {
  const route = useRoute();
  const { t } = useI18n();
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [watching, setWatching] = useState<MediaItem | null>(null);
  // Tant que la configuration n'est pas connue, on suppose l'archive ouverte (cas par défaut).
  const [cfg, setCfg] = useState<AppConfig>({ archive: true });

  useEffect(() => {
    const ctrl = new AbortController();
    config(ctrl.signal)
      .then(setCfg)
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  // Une œuvre du catalogue a sa propre page ; un document de l'archive s'ouvre dans le panneau.
  const info = useCallback((item: MediaItem) => {
    if (item.slug) navigate(`/film/${item.slug}`);
    else setSelected(item);
  }, []);
  const closePanel = useCallback(() => setSelected(null), []);
  const closeWatch = useCallback(() => setWatching(null), []);
  const play = useCallback((item: MediaItem) => {
    setSelected(null);
    setWatching(item);
  }, []);

  // Changer de page ferme le panneau (bouton « précédent » du navigateur compris).
  useEffect(() => setSelected(null), [route.key]);

  useEffect(() => {
    const names: Record<string, string> = { catalogue: t('nav.catalogue'), archive: t('nav.archive'), list: t('nav.list'), about: t('nav.about') };
    if (route.view !== 'film') document.title = names[route.view] ? `${names[route.view]} · Openflix` : `Openflix · ${t('app.tagline')}`;
  }, [route.view, t]);

  return (
    <div className="app">
      <NavBar view={route.view} archive={cfg.archive} />

      <main>
        {route.view === 'home' && <Home onInfo={info} onPlay={play} />}
        {route.view === 'film' && route.slug && <Film key={route.slug} slug={route.slug} onInfo={info} onPlay={play} />}
        {route.view === 'catalogue' && <Catalogue key={route.key} query={route.query} archive={cfg.archive} onInfo={info} />}
        {route.view === 'archive' && cfg.archive && <Explore key={route.key} query={route.query} onInfo={info} />}
        {route.view === 'archive' && !cfg.archive && <Catalogue key="closed" query={route.query} archive={false} onInfo={info} />}
        {route.view === 'list' && <MyList onInfo={info} />}
        {route.view === 'about' && <About contact={cfg.contact} />}
      </main>

      <footer className="foot">
        <p>{t('foot.disclaimer')}</p>
        <p>
          <Link to="/a-propos">{t('foot.about')}</Link>
        </p>
      </footer>

      {selected && <DetailPanel item={selected} onClose={closePanel} onPlay={play} />}
      {watching && <Watch item={watching} onClose={closeWatch} />}
    </div>
  );
}
