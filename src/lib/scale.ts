// Shared client-side serving scaler. Wires up a scaler chip + servings counter
// to a list of ingredient elements, rescaling their displayed quantities live.
//
// DOM contract:
//   <element class="scaler" data-base-servings="N">
//     <button data-act="dec">−</button>
//     <span class="value">N</span>
//     <button data-act="inc">+</button>
//   </element>
//
//   <ul id="ingredients">
//     <li data-qty="2.0" data-unit="cup">…<span class="qty-value">2</span>…</li>
//   </ul>
//
// Returns an unsubscribe function that detaches all listeners.

import { formatQty } from './format';

export interface ScalerOptions {
  scalerSelector?: string;        // default '.scaler'
  ingredientsSelector?: string;   // default '#ingredients'
  valueSelector?: string;         // default '.value'
  onChange?: (current: number, ratio: number) => void;
}

export function attachScaler(opts: ScalerOptions = {}): () => void {
  const scaler = document.querySelector<HTMLElement>(opts.scalerSelector ?? '.scaler');
  if (!scaler) return () => {};

  const base = parseInt(scaler.dataset.baseServings ?? '1', 10);
  const valueEl = scaler.querySelector<HTMLElement>(opts.valueSelector ?? '.value');
  const items = document.querySelectorAll<HTMLLIElement>(
    `${opts.ingredientsSelector ?? '#ingredients'} li`,
  );
  let current = base;

  function render() {
    if (valueEl) valueEl.textContent = String(current);
    const ratio = current / base;
    items.forEach((li) => {
      const rawQty = li.dataset.qty;
      if (!rawQty) return;
      const qtyEl = li.querySelector<HTMLElement>('.qty-value');
      if (!qtyEl) return;
      qtyEl.textContent = formatQty(parseFloat(rawQty) * ratio);
    });
    opts.onChange?.(current, ratio);
  }

  const inc = () => { if (current < 99) { current += 1; render(); } };
  const dec = () => { if (current > 1) { current -= 1; render(); } };

  scaler.querySelector('[data-act="inc"]')?.addEventListener('click', inc);
  scaler.querySelector('[data-act="dec"]')?.addEventListener('click', dec);

  return () => {
    scaler.querySelector('[data-act="inc"]')?.removeEventListener('click', inc);
    scaler.querySelector('[data-act="dec"]')?.removeEventListener('click', dec);
  };
}
