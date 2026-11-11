import { ResultCard } from '../components/ResultCard';
import { useMyList } from '../hooks';
import { useI18n } from '../i18n';
import type { Actions } from './Home';

export function MyList({ onInfo }: Pick<Actions, 'onInfo'>) {
  const { t } = useI18n();
  const list = useMyList();

  return (
    <div className="page">
      <h1 className="page-title">{t('list.title')}</h1>
      {list.length === 0 ? (
        <div className="empty">
          <p>{t('list.empty')}</p>
          <p className="meta">{t('list.emptyHint')}</p>
          <div className="empty-actions">
            <a className="btn primary" href="#/">
              {t('nav.home')}
            </a>
          </div>
        </div>
      ) : (
        <div className="grid">
          {list.map((item) => (
            <ResultCard key={item.uid} item={item} onOpen={onInfo} />
          ))}
        </div>
      )}
    </div>
  );
}
