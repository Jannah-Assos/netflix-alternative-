import { useCallback, useState } from 'react';
import type { MediaItem } from '../../server/src/types';
import { DetailPanel } from './components/DetailPanel';
import { NavBar } from './components/NavBar';
import { Watch } from './components/Watch';
import { useRoute } from './hooks';
import { useI18n } from './i18n';
import { Explore } from './views/Explore';
import { Home } from './views/Home';
import { MyList } from './views/MyList';

export function App() {
  const route = useRoute();
  const { t } = useI18n();
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [watching, setWatching] = useState<MediaItem | null>(null);

  const closePanel = useCallback(() => setSelected(null), []);
  const closeWatch = useCallback(() => setWatching(null), []);
  const play = useCallback((item: MediaItem) => {
    setSelected(null);
    setWatching(item);
  }, []);

  return (
    <div className="app">
      <NavBar view={route.view} />

      <main>
        {route.view === 'home' && <Home onInfo={setSelected} onPlay={play} />}
        {route.view === 'explore' && <Explore key={route.key} query={route.query} onInfo={setSelected} />}
        {route.view === 'list' && <MyList onInfo={setSelected} />}
      </main>

      <footer className="foot">{t('foot.disclaimer')}</footer>

      {selected && <DetailPanel item={selected} onClose={closePanel} onPlay={play} />}
      {watching && <Watch item={watching} onClose={closeWatch} />}
    </div>
  );
}
