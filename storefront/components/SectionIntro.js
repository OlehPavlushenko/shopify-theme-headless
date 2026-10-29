// Intro of a content section: theme/snippets/section-intro.liquid — eyebrow, heading, text, button, each
// only when set; with className they get a wrapper <div>
import Link from 'next/link';
import Icon from './Icon.js';

export default function SectionIntro({
  eyebrow,
  heading,
  headingClass = 'h3',
  headingId,
  text,
  textClass = 'rte',
  buttonLabel,
  buttonLink,
  buttonClass = 'btn btn--outline',
  className,
}) {
  const hasButton = buttonLabel && buttonLink;
  if (!eyebrow && !heading && !text && !hasButton) return null;
  const parts = (
    <>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {heading && <h2 className={headingClass} id={headingId} dangerouslySetInnerHTML={{ __html: heading }} />}
      {text && <div className={textClass} dangerouslySetInnerHTML={{ __html: text }} />}
      {hasButton && (
        <Link href={buttonLink} className={buttonClass}>
          {buttonLabel}
          <Icon name="arrow-right" />
        </Link>
      )}
    </>
  );
  return className ? <div className={className}>{parts}</div> : parts;
}
