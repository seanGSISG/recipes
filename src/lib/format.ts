// Pretty-print numeric quantities using common kitchen fractions.
// Examples: 0.5 -> "½", 1.25 -> "1¼", 0.333 -> "⅓", 2 -> "2", 1.6 -> "1⅗"

const GLYPHS: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
  '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
};

const COMMON: Array<[number, string]> = [
  [1 / 8, '1/8'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'],
  [1 / 2, '1/2'], [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'],
];

export function formatQty(value: number): string {
  if (!isFinite(value) || value <= 0) return '';
  const whole = Math.floor(value);
  const frac = value - whole;

  if (frac < 0.02) return String(whole || (value < 1 ? round(value) : 0));

  let bestKey = '';
  let bestDiff = Infinity;
  for (const [v, k] of COMMON) {
    const d = Math.abs(frac - v);
    if (d < bestDiff) { bestDiff = d; bestKey = k; }
  }

  if (bestDiff < 0.04) {
    const glyph = GLYPHS[bestKey];
    return whole > 0 ? `${whole}${glyph}` : glyph;
  }

  return round(value);
}

function round(v: number): string {
  if (v >= 10) return String(Math.round(v));
  if (v >= 1) return (Math.round(v * 4) / 4).toString();
  return (Math.round(v * 100) / 100).toString();
}
