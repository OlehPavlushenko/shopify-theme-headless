// theme/sections/main-page.liquid: the page's rich text in a reading column (the h1 is the page header's)
export default function MainPage({ section, context = {} }) {
  const { settings } = section;
  return (
    <div className={`main-page color-${settings.color_scheme} section-spacing`}>
      <div className={`page-width${settings.width === 'narrow' ? ' page-width--narrow' : ''}`}>
        <div className="rte main-page__content" dangerouslySetInnerHTML={{ __html: context.page?.body ?? '' }} />
      </div>
    </div>
  );
}
