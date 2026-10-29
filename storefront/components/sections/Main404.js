// theme/sections/main-404.liquid: a big "404", the heading, a line of text, a search field and two links
import Link from 'next/link';
import Icon from '../Icon.js';
import SearchForm from '../SearchForm.js';
import { t } from '@/lib/theme.js';

export default function Main404({ section }) {
  const { settings } = section;
  return (
    <div className={`main-404 color-${settings.color_scheme} section-spacing`}>
      <div className="page-width page-width--narrow main-404__inner">
        <p className="main-404__code" aria-hidden="true">
          404
        </p>
        <h1 className="h2">{settings.heading || t('404.title')}</h1>
        <div className="text-lead main-404__text" dangerouslySetInnerHTML={{ __html: settings.text ?? '' }} />
        <SearchForm id="NotFoundSearch" className="main-404__search" wrapClass="main-404__search-wrap" />
        <div className="main-404__actions">
          <Link href="/collections/all" className="btn btn--outline">
            {t('404.back_to_shopping')}
            <Icon name="arrow-right" />
          </Link>
          <Link href="/" className="btn btn--link">
            {t('404.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
