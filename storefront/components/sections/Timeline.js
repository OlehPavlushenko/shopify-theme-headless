// theme/sections/timeline.liquid: the story in steps (year, title, text) on a line with a dot per step
import SectionIntro from '../SectionIntro.js';

export default function Timeline({ section }) {
  const { settings, blocks } = section;
  return (
    <div className={`timeline color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <SectionIntro className="timeline__head" eyebrow={settings.eyebrow} heading={settings.heading} />
        <ol className="timeline__list" role="list" style={{ '--timeline-steps': Math.max(1, blocks.length) }}>
          {blocks.map((block) => (
            <li key={block.id} className="timeline__step">
              <span className="timeline__dot" aria-hidden="true" />
              <p className="timeline__year">{block.settings.year}</p>
              <h3 className="h5 timeline__title">{block.settings.title}</h3>
              {block.settings.text && <p className="timeline__text">{block.settings.text}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
