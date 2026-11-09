import type { MediaItem } from '../../../server/src/types';
import { useMyList } from '../hooks';
import { useI18n } from '../i18n';
import { toggleList } from '../storage';

/** Bouton « + / ✓ » : ajoute ou retire un titre de Ma liste. */
export function ListButton({ item, label = false }: { item: MediaItem; label?: boolean }) {
  const { t } = useI18n();
  const inList = useMyList().some((i) => i.uid === item.uid);
  const text = t(inList ? 'hero.inList' : 'hero.addList');
  return (
    <button
      type="button"
      className={label ? 'btn ghost' : 'icon-btn'}
      aria-pressed={inList}
      aria-label={text}
      title={text}
      onClick={() => toggleList(item)}
    >
      <span aria-hidden="true">{inList ? '✓' : '+'}</span>
      {label && <span>{text}</span>}
    </button>
  );
}
