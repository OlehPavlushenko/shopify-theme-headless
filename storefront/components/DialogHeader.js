// Title row of a drawer or popup: theme/snippets/dialog-header.liquid — the title (labels the dialog
// through titleId), actions, the close button, then children (a row under the title)
import CloseButton from './CloseButton.js';

export default function DialogHeader({
  title,
  titleId,
  tag: Tag = 'h2',
  titleClass = 'h5',
  className = 'popup__header',
  closeClass,
  popover,
  actions,
  children,
}) {
  return (
    <div className={className}>
      <Tag id={titleId} className={titleClass}>
        {title}
      </Tag>
      {actions}
      <CloseButton className={closeClass} popover={popover} />
      {children}
    </div>
  );
}
