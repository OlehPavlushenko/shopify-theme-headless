// Icon button that closes a drawer, popup or popover: theme/snippets/close-button.liquid
// (a <dialog> through [data-dialog-close], a [popover] through popoverTarget + hide)
import Icon from './Icon.js';
import { t } from '@/lib/theme.js';

export default function CloseButton({ className, popover, label }) {
  return (
    <button
      type="button"
      className={`btn btn--icon${className ? ` ${className}` : ''}`}
      data-dialog-close={popover ? undefined : ''}
      popoverTarget={popover}
      popoverTargetAction={popover ? 'hide' : undefined}
      aria-label={label || t('accessibility.close')}
    >
      <Icon name="close" />
    </button>
  );
}
