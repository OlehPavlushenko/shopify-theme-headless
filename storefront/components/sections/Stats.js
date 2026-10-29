// theme/sections/stats.liquid: a row of key figures (value, label, note) under an optional intro
import SectionIntro from '../SectionIntro.js';

export default function Stats({ section }) {
  const { settings, blocks } = section;
  return (
    <div className={`stats color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <SectionIntro
          className="stats__head"
          eyebrow={settings.eyebrow}
          heading={settings.heading}
          text={settings.text}
          textClass="rte stats__text"
        />
        <ul className="stats__list" role="list" style={{ '--stats-columns': Math.min(4, Math.max(1, blocks.length)) }}>
          {blocks.map((block) => (
            <li key={block.id} className="stats__item">
              <p className="stats__value">{block.settings.value}</p>
              <p className="stats__label">{block.settings.label}</p>
              {block.settings.text && <p className="stats__note">{block.settings.text}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
