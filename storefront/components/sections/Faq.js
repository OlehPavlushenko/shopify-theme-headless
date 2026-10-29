// theme/sections/faq.liquid: questions as an accordion (<details>, one open at a time via `name`), an
// optional intro column, Topic headings; FAQPage data when the section has it on. (The search + topics
// tools of the FAQ page come with that page.)
import JsonLd from '../JsonLd.js';
import Icon from '../Icon.js';
import SectionIntro from '../SectionIntro.js';
import { linkUrl } from '@/lib/links.js';

export default function Faq({ section }) {
  const { id, settings, blocks } = section;
  const questions = blocks.filter((block) => block.type === 'question');
  const hasIntro = settings.eyebrow || settings.heading || settings.text || settings.button_label;
  const topicTag = settings.heading ? 'h3' : 'h2';
  let firstQuestion = true;
  return (
    <div className={`faq faq--${settings.layout} color-${settings.color_scheme} section-spacing`}>
      <div className={`page-width faq__inner${hasIntro ? '' : ' faq__inner--list-only'}`}>
        {hasIntro && (
          <div className={`faq__intro${settings.layout === 'split' ? ' sticky-column sticky-column--scroll' : ''}`}>
            <SectionIntro
              eyebrow={settings.eyebrow}
              heading={settings.heading}
              headingClass="h2"
              text={settings.text}
              textClass="rte faq__text"
            />
            <SectionIntro buttonLabel={settings.button_label} buttonLink={linkUrl(settings.button_link) || '/'} />
          </div>
        )}
        <div className="faq__list">
          {blocks.map((block) => {
            if (block.type === 'topic') {
              const Topic = topicTag;
              return (
                <Topic key={block.id} id={`faq-${id}-${block.id}`} className="h5 faq__topic" data-faq-topic="">
                  {block.settings.title}
                </Topic>
              );
            }
            const open = firstQuestion && settings.open_first;
            firstQuestion = false;
            return (
              <details
                key={block.id}
                className="accordion"
                data-faq-item=""
                name={settings.single_open ? `faq-${id}` : undefined}
                open={open}
              >
                <summary className="accordion__summary">
                  <span className="accordion__title">{block.settings.question}</span>
                  <span className="accordion__icon" aria-hidden="true">
                    <Icon name="plus" />
                  </span>
                </summary>
                <div className="accordion__content rte" dangerouslySetInnerHTML={{ __html: block.settings.answer }} />
              </details>
            );
          })}
        </div>
      </div>
      {questions.length > 0 && settings.structured_data && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: questions.map((block) => ({
              '@type': 'Question',
              name: block.settings.question,
              acceptedAnswer: { '@type': 'Answer', text: block.settings.answer },
            })),
          }}
        />
      )}
    </div>
  );
}
