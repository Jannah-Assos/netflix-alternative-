import { Link } from '../components/Link';
import { useI18n } from '../i18n';

/** À propos : ce qu'est Openflix, comment les droits sont estimés, où sont les films, comment signaler. */
export function About({ contact }: { contact?: string | undefined }) {
  const { t } = useI18n();
  return (
    <div className="page about">
      <h1 className="page-title">{t('about.title')}</h1>
      <p className="about-lead">{t('about.lead')}</p>

      <section>
        <h2>{t('about.rights.t')}</h2>
        <p>{t('about.rights.intro')}</p>
        <ul>
          <li>{t('about.rights.cc')}</li>
          <li>{t('about.rights.seventy')}</li>
          <li>{t('about.rights.us')}</li>
        </ul>
        <p>{t('about.rights.limits')}</p>
      </section>

      <section>
        <h2>{t('about.host.t')}</h2>
        <p>{t('about.host.d')}</p>
      </section>

      <section>
        <h2>{t('about.report.t')}</h2>
        <p>{t('about.report.d')}</p>
        {contact && <p className="about-contact">{contact}</p>}
      </section>

      <p>
        <Link className="btn primary" to="/catalogue">
          {t('nav.catalogue')}
        </Link>
      </p>
    </div>
  );
}
