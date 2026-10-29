// A titled popup: the <dialog class="popup"> of theme/sections/main-product.liquid (info pages, "Ask a
// question") — opened by [data-dialog-open="<id>"] (@ui/dialog), labelled by its title; children: the body
import DialogHeader from './DialogHeader.js';

export default function Popup({ id, title, children }) {
  return (
    <dialog className="popup" id={id} aria-labelledby={`${id}-title`}>
      <div className="popup__inner">
        <DialogHeader title={title} titleId={`${id}-title`} />
        {children}
      </div>
    </dialog>
  );
}
