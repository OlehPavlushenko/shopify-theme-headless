// theme/sections/trust-bar.liquid: 2–4 short promises with an icon
import Icon from '../Icon.js';

export default function TrustBar({ section }) {
  const { settings, blocks } = section;
  return (
    <div className={`trust-bar color-${settings.color_scheme}`}>
      <ul className="trust-bar__list page-width" role="list" style={{ '--trust-columns': Math.min(4, Math.max(1, blocks.length)) }}>
        {blocks.map((block) => (
          <li key={block.id} className="trust-bar__item">
            <Icon name={block.settings.icon} />
            <span className="trust-bar__text">
              <span className="trust-bar__title">{block.settings.title}</span>
              {block.settings.text && <span className="trust-bar__note">{block.settings.text}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
