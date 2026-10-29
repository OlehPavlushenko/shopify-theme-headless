// theme/sections/marquee.liquid: phrases running in a line (CSS only). Two identical halves, each
// repeated 3×; only the first copy is read by screen readers and search engines.
import { scheduleActive } from '@/lib/links.js';

const SEPARATORS = { dot: '•', star: '✦', slash: '/' };

export default function Marquee({ section }) {
  const { settings, blocks } = section;
  if (!blocks.length || !scheduleActive(settings.show_from, settings.show_until)) return null;
  const separator = SEPARATORS[settings.separator];
  const phrases = (copy) =>
    blocks.map((block) => (
      <li key={`${copy}-${block.id}`} className="marquee__item" aria-hidden={copy > 0 ? 'true' : undefined}>
        <span dangerouslySetInnerHTML={{ __html: block.settings.text }} />
        {separator && (
          <span className="marquee__separator" aria-hidden={copy === 0 ? 'true' : undefined}>
            {separator}
          </span>
        )}
      </li>
    ));
  return (
    <div className={`marquee color-${settings.color_scheme}`} style={{ '--marquee-duration': `${settings.duration}s` }}>
      <div className="marquee__track">
        {[0, 1].map((half) => (
          <ul key={half} className="marquee__group" role="list" aria-hidden={half === 1 ? 'true' : undefined}>
            {[0, 1, 2].map((copy) => phrases(half * 3 + copy))}
          </ul>
        ))}
      </div>
    </div>
  );
}
