// theme/sections/faq.liquid: questions as an accordion (<details>, one open at a time via `name`), an
// optional intro column, Topic headings; FAQPage data when the section has it on. "Topics and search"
// (show_nav): the intro gets a search field and the topics as links (<faq-search>, @ui/faq-search).
import JsonLd from '../JsonLd.js';
import Icon from '../Icon.js';
import SectionIntro from '../SectionIntro.js';
import { linkUrl } from '@/lib/links.js';
import { t } from '@/lib/theme.js';

export default function Faq({ section }) {
  const { id, settings, blocks } = section;
  const questions = blocks.filter((block) => block.type === 'question');
  const topics = blocks.filter((block) => block.type === 'topic');
  const showNav = settings.show_nav;
  const hasIntro = settings.eyebrow || settings.heading || settings.text || settings.button_label || showNav;
  const Wrapper = showNav ? 'faq-search' : 'div';
  const topicTag = settings.heading ? 'h3' : 'h2';
  const topicId = (block) => `faq-${id}-${block.id}`;
  const contactUrl = linkUrl(settings.button_link) || '/';
  let firstQuestion = true;
  let topic;
  return (
    <div className={`faq faq--${settings.layout}${showNav ? ' faq--nav' : ''} color-${settings.color_scheme} section-spacing`}>
      <Wrapper className={`page-width faq__inner${hasIntro ? '' : ' faq__inner--list-only'}`}>
        {hasIntro && (
          <div className={`faq__intro${settings.layout === 'split' ? ' sticky-column sticky-column--scroll' : ''}`}>
            <SectionIntro
              eyebrow={settings.eyebrow}
              heading={settings.heading}
              headingClass="h2"
              text={settings.text}
              textClass="rte faq__text"
            />
            {showNav && (
              // Search + topics: sticky — in the intro column from 990px, a bar under the header on phones
              <div className="faq__tools" data-faq-tools="">
                <label className="faq__search search-field">
                  <span className="visually-hidden">{t('faq.search')}</span>
                  <Icon name="search" />
                  <input type="search" className="input" placeholder={t('faq.search')} autoComplete="off" data-faq-input="" />
                </label>
                {topics.length > 0 && (
                  <nav className="faq__nav" aria-label={t('faq.topics')}>
                    <ul className="faq__nav-list scrollbar-hidden" role="list">
                      {topics.map((block) => (
                        <li key={block.id}>
                          <a href={`#${topicId(block)}`} className="chip faq__nav-link" data-faq-topic-link="">
                            {block.settings.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            )}
            <SectionIntro buttonLabel={settings.button_label} buttonLink={contactUrl} />
          </div>
        )}
        <div className="faq__list">
          {blocks.map((block) => {
            if (block.type === 'topic') {
              const Topic = topicTag;
              topic = topicId(block);
              return (
                <Topic key={block.id} id={topic} className="h5 faq__topic" data-faq-topic="">
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
                data-topic={topic}
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
          {showNav && (
            <>
              <div className="faq__empty" data-faq-empty="" hidden>
                <p
                  className="h5"
                  dangerouslySetInnerHTML={{ __html: t('faq.no_results_html', { terms: '<span data-faq-terms></span>' }) }}
                />
                <p>{t('faq.no_results_text')}</p>
                {settings.button_label && (
                  <a href={contactUrl} className="btn">
                    {settings.button_label}
                  </a>
                )}
              </div>
              <p className="visually-hidden" role="status" data-faq-status="" data-label={t('faq.results')} />
            </>
          )}
        </div>
      </Wrapper>
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
