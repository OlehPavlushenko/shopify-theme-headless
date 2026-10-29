// A section's heading row: theme/snippets/section-head.liquid — heading, "View all" link, slider arrows
import Link from 'next/link';
import Icon from './Icon.js';
import SliderNav from './SliderNav.js';

export default function SectionHead({ heading, linkLabel, link, nav = false, headingTag: Heading = 'h2', headingClass = 'h3', id }) {
  if (!heading && !linkLabel && !nav) return null;
  const plain = heading?.replace(/<[^>]+>/g, '');
  return (
    <div className={`section-head${nav ? ' slider__head' : ''}`}>
      {heading && <Heading id={id} className={`${headingClass} section-head__title`} dangerouslySetInnerHTML={{ __html: heading }} />}
      {linkLabel && link && (
        <Link href={link} className="link-arrow section-head__link">
          {linkLabel}
          <Icon name="arrow-right" />
        </Link>
      )}
      {nav && (
        <div className="section-head__end">
          <SliderNav label={plain} />
        </div>
      )}
    </div>
  );
}
