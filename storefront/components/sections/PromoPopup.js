// theme/sections/promo-popup.liquid: a popup of blocks — text, countdown, newsletter, the "Spin to win" wheel
// (its segments are the Prize blocks), products, button — with an optional image. When it opens and how
// often: <promo-popup> (@ui/promo-popup); the wheel: <spin-wheel> (@ui/spin-wheel). Pages ("home" /
// "not on the cart page") are checked in the browser (UiScripts), as the layout is shared.
import { createHmac } from 'node:crypto';
import CloseButton from '../CloseButton.js';
import Countdown from '../Countdown.js';
import Icon from '../Icon.js';
import LazySection from '../LazySection.js';
import NewsletterForm from '../NewsletterForm.js';
import ProductCard from '../ProductCard.js';
import SectionIntro from '../SectionIntro.js';
import ThemeImage from '../ThemeImage.js';
import { linkUrl, scheduleActive } from '@/lib/links.js';
import { getProductsByHandles } from '@/lib/queries.js';
import { scriptJson } from '@/lib/text.js';
import { apiUrl, getSettings, t, themeSecret } from '@/lib/theme.js';

function Wheel({ section, block }) {
  const settings = getSettings();
  const api = apiUrl();
  const prizes = section.blocks
    .filter((item) => item.type === 'prize' && item.settings.label?.trim())
    .map((item) => ({
      label: item.settings.label.trim(),
      code: (item.settings.code ?? '').trim().toUpperCase(),
      weight: item.settings.chance || 1,
    }));
  const count = prizes.length;
  if (count < 2) return null;
  // The list exactly as Liquid prints it: the server checks its signature with the theme's API secret
  const secret = themeSecret();
  const raw = `[${prizes.map((prize) => `{"label":${JSON.stringify(prize.label)},"code":${JSON.stringify(prize.code)},"weight":${prize.weight}}`).join(',')}]`;
  const odd = count % 2 === 1;
  const stops = prizes
    .map((_, i) => {
      let color = i % 2 === 1 ? 'var(--color-accent)' : 'var(--color-surface)';
      if (odd && i === count - 1) color = 'var(--color-accent-2)';
      return `${color} ${(i * 100) / count}% ${((i + 1) * 100) / count}%`;
    })
    .join(', ');
  const messageId = `Wheel-${block.id}-message`;
  const note = block.settings.note && <p className="newsletter-form__note" dangerouslySetInnerHTML={{ __html: block.settings.note }} />;

  return (
    <spin-wheel
      class="spin-wheel"
      data-key={section.id}
      data-endpoint={api ? `${api}/spin` : undefined}
      data-signature={api && secret ? createHmac('sha256', secret).update(raw).digest('hex') : undefined}
      data-recaptcha={api && settings.recaptcha_site_key ? settings.recaptcha_site_key : undefined}
      data-message-email={api ? t('newsletter.invalid_email') : undefined}
      data-message-error={api ? t('newsletter.error') : undefined}
    >
      <div className="spin-wheel__stage" aria-hidden="true">
        <span className="spin-wheel__pointer" />
        <div className="spin-wheel__disc" data-wheel-disc="" style={{ '--segments': count, background: `conic-gradient(${stops})` }}>
          {prizes.map((prize, i) => {
            const onColor = i % 2 === 1 || (odd && i === count - 1);
            // On the left half the text turns over so it reads the right way up
            const flip = i * 2 + 1 > count;
            return (
              <span
                key={i}
                className={`spin-wheel__label${onColor ? ' spin-wheel__label--on-color' : ''}${flip ? ' spin-wheel__label--flip' : ''}`}
                style={{ '--i': i }}
              >
                <span>{prize.label}</span>
              </span>
            );
          })}
        </div>
        <span className="spin-wheel__hub">
          <Icon name="gift" />
        </span>
      </div>
      <p className="visually-hidden">
        {t('wheel.prizes')}: {prizes.map((prize) => prize.label).join(', ')}
      </p>
      <script type="application/json" data-wheel-prizes="" dangerouslySetInnerHTML={{ __html: scriptJson(raw) }} />

      <div className="spin-wheel__action">
        {api ? (
          <>
            <form className="newsletter-form__form" data-wheel-form="" noValidate>
              <div className="newsletter-form__row">
                <span className="newsletter-form__field">
                  <Icon name="mail" />
                  <input
                    className="input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder={t('newsletter.placeholder')}
                    aria-label={t('newsletter.placeholder')}
                    aria-describedby={messageId}
                  />
                </span>
                <button type="submit" className="btn">
                  {block.settings.button_label}
                </button>
              </div>
              <p className="form-error newsletter-form__message" id={messageId} data-wheel-message="" aria-live="polite" />
            </form>
            {note}
          </>
        ) : (
          <>
            <button type="button" className="btn btn--full" data-wheel-spin="">
              {block.settings.button_label}
            </button>
            {note}
          </>
        )}
      </div>

      <div className="spin-wheel__result" data-wheel-result="" role="status" tabIndex={-1} hidden>
        <p className="eyebrow">{t('wheel.won')}</p>
        <p className="h3 spin-wheel__prize" data-wheel-prize="" />
        <div className="spin-wheel__code">
          <code data-wheel-code="" />
          <button type="button" className="btn btn--outline btn--sm" data-wheel-copy="" data-copied={t('wheel.copied')}>
            {t('wheel.copy')}
          </button>
        </div>
        <p
          className="spin-wheel__note"
          data-wheel-note=""
          data-applying={t('wheel.applying')}
          data-applied={t('wheel.applied')}
          data-failed={t('wheel.failed')}
          data-saved={t('wheel.saved')}
          data-already={t('wheel.already')}
        />
      </div>
    </spin-wheel>
  );
}

// A "Products" block's slider: the full element replacing its <lazy-section> placeholder (app/(fragments)/lazy)
export async function PopupProducts({ block }) {
  const products = await getProductsByHandles(block.settings.products ?? []);
  if (!products.length) return null;
  return (
    <ui-slider class="slider promo-popup__products" data-lazy-key={block.id}>
      {block.settings.heading && <p className="eyebrow">{block.settings.heading}</p>}
      <ul className="scroll-track slider__track" data-slider-track="" role="list">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} actions={false} quickAdd secondImage={false} headingTag="p" sizes="160px" />
          </li>
        ))}
      </ul>
    </ui-slider>
  );
}

export default function PromoPopup({ section }) {
  const { id, settings, blocks } = section;
  if (!blocks.length || !scheduleActive(settings.show_from, settings.show_until)) return null;
  const titleId = `PromoPopup-title-${id}`;
  const titled = blocks.some((block) => block.type === 'text' && block.settings.heading);
  // Delay: when set, or as the only trigger when the others are off
  const useDelay = settings.delay > 0 || (settings.scroll === 0 && !settings.exit_intent);
  let hasTitle = false;

  return (
    <promo-popup
      data-id={id}
      data-delay={useDelay ? settings.delay : undefined}
      data-scroll={settings.scroll}
      data-days={settings.days}
      data-exit={settings.exit_intent ? '' : undefined}
      data-pages={settings.pages}
    >
      <dialog
        className={`popup promo-popup color-${settings.color_scheme}${settings.image ? ' promo-popup--media' : ''}`}
        aria-labelledby={titled ? titleId : undefined}
        aria-label={titled ? undefined : t('accessibility.promo')}
      >
        <div className="promo-popup__inner">
          {settings.image && (
            <div className="promo-popup__media">
              <ThemeImage image={settings.image} widths={[360, 540, 720, 900]} sizes="360px" />
            </div>
          )}
          {/* Focus lands here on open (not on the close button, which would show its focus ring) */}
          <div className="promo-popup__content" tabIndex={-1} autoFocus>
            <CloseButton className="promo-popup__close" />
            {blocks.map((block) => {
              const s = block.settings;
              switch (block.type) {
                case 'text': {
                  const headingId = hasTitle ? undefined : titleId;
                  if (s.heading) hasTitle = true;
                  return (
                    <div key={block.id} className="promo-popup__text">
                      <SectionIntro
                        eyebrow={s.eyebrow}
                        heading={s.heading}
                        headingClass="h3 promo-popup__heading"
                        headingId={headingId}
                        text={s.text}
                        textClass="promo-popup__body"
                      />
                    </div>
                  );
                }
                case 'countdown':
                  return s.end ? (
                    <p key={block.id} className="promo-popup__countdown" data-countdown-section="">
                      <Countdown end={s.end} />
                    </p>
                  ) : null;
                case 'newsletter':
                  return (
                    <div key={block.id}>
                      <NewsletterForm
                        id={block.id}
                        buttonLabel={s.button_label}
                        successText={s.success_text}
                        alreadyText={s.already_text}
                        note={s.note}
                        discountCode={s.discount_code}
                      />
                    </div>
                  );
                case 'wheel':
                  return <Wheel key={block.id} section={section} block={block} />;
                case 'products':
                  // Fetched when the popup opens (app/(fragments)/lazy)
                  return block.settings.products?.length ? (
                    <LazySection
                      key={block.id}
                      part="popup"
                      sectionId={id}
                      lazyKey={block.id}
                      className="slider promo-popup__products"
                      heading={block.settings.heading}
                    />
                  ) : null;
                case 'button':
                  return s.button_label ? (
                    <a key={block.id} href={linkUrl(s.button_link) || '/collections/all'} className="btn btn--full">
                      {s.button_label}
                    </a>
                  ) : null;
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </dialog>
    </promo-popup>
  );
}
