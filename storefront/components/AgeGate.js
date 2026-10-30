// Age verification: theme/snippets/age-gate.liquid (Theme settings > Age verification) — a modal window
// until the visitor confirms their age (<age-gate>, @ui/age-gate)
import { getSettings } from '@/lib/theme.js';

export default function AgeGate() {
  const s = getSettings();
  if (!s.age_gate_enabled) return null;
  return (
    <age-gate data-days={s.age_gate_days} data-exit={s.age_gate_exit || ''}>
      <dialog
        className={`popup age-gate color-${s.age_gate_color_scheme}`}
        aria-labelledby="AgeGate-title"
        aria-describedby="AgeGate-text"
        data-dialog-locked=""
      >
        <div className="age-gate__inner">
          {s.age_gate_eyebrow && <p className="eyebrow age-gate__eyebrow">{s.age_gate_eyebrow}</p>}
          <h2 id="AgeGate-title" className="h3 age-gate__heading">
            {s.age_gate_heading}
          </h2>
          {s.age_gate_text && (
            <p id="AgeGate-text" className="age-gate__text" style={{ whiteSpace: 'pre-line' }}>
              {s.age_gate_text}
            </p>
          )}
          <div className="age-gate__actions">
            <button type="button" className="btn age-gate__yes" data-age-yes="">
              {s.age_gate_yes}
            </button>
            <button type="button" className="btn btn--outline age-gate__no" data-age-no="">
              {s.age_gate_no}
            </button>
          </div>
        </div>
      </dialog>
    </age-gate>
  );
}
