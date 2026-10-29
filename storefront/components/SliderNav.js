// Prev/next arrows for <ui-slider>: theme/snippets/slider-nav.liquid
import Icon from './Icon.js';
import { t } from '@/lib/theme.js';

export default function SliderNav({ label }) {
  const suffix = label ? `: ${label}` : '';
  return (
    <div className="slider__nav">
      <button type="button" className="btn btn--icon slider__button" data-slider-prev="" aria-label={t('general.slider.previous') + suffix}>
        <Icon name="arrow-left" />
      </button>
      <button type="button" className="btn btn--icon slider__button" data-slider-next="" aria-label={t('general.slider.next') + suffix}>
        <Icon name="arrow-right" />
      </button>
    </div>
  );
}
