// Page header: the same markup as theme/sections/page-header.liquid (text only) — breadcrumbs, the
// page's h1 and a lead text (HTML). Styles: packages/ui/css/sections.css.
import Breadcrumbs from './Breadcrumbs.js';

export default function PageHeader({ heading, textHtml, trail }) {
  return (
    <div className="page-header page-header--left page-header--media-none">
      <div className="page-header__inner page-width">
        <div className="page-header__text-col">
          <Breadcrumbs trail={trail} current={heading} />
          <h1 className="h1 page-header__heading">{heading}</h1>
          {textHtml && <div className="text-lead page-header__text" dangerouslySetInnerHTML={{ __html: textHtml }} />}
        </div>
      </div>
    </div>
  );
}
