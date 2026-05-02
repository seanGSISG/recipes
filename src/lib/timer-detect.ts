// Detects time mentions in instruction text and returns spans to wrap.
// Patterns handled:
//   - "5 minutes", "5 mins", "5 min"
//   - "10-12 minutes", "10–12 min" (en-dash)
//   - "5 to 7 minutes"
//   - "30 seconds", "1 hour", "1.5 hr"
// Range cases default to the UPPER bound (less likely to undercook); the user
// can adjust before starting the timer.

export interface TimeMatch {
  start: number;       // index in original string
  end: number;
  text: string;        // original matched text
  seconds: number;     // computed duration to use
  label: string;       // unit, lowercased ("minutes", "seconds", etc.)
}

const UNIT_TO_SEC: Record<string, number> = {
  s: 1, sec: 1, secs: 1, second: 1, seconds: 1,
  m: 60, min: 60, mins: 60, minute: 60, minutes: 60,
  h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600,
};

// Combined pattern: range OR single number
const RE = /(\d+(?:\.\d+)?)\s*(?:[-–]|to)\s*(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b|(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/gi;

export function detectTimes(text: string): TimeMatch[] {
  const matches: TimeMatch[] = [];
  for (const m of text.matchAll(RE)) {
    const isRange = m[1] !== undefined;
    const num = isRange ? parseFloat(m[2]!) : parseFloat(m[4]!);
    const unit = (isRange ? m[3]! : m[5]!).toLowerCase();
    const secPerUnit = UNIT_TO_SEC[unit] ?? UNIT_TO_SEC[unit.replace(/s$/, '')];
    if (!secPerUnit) continue;
    matches.push({
      start: m.index!,
      end: m.index! + m[0].length,
      text: m[0],
      seconds: Math.round(num * secPerUnit),
      label: unit,
    });
  }
  return matches;
}

// Wrap detected times in a clickable button. Returns HTML string.
// `inlineMd` should already have been applied to escape and bold the text.
// Since we're operating on already-HTML-escaped output, we need to detect
// matches in the HTML-decoded source and re-escape the surrounding text.
export function wrapTimes(escapedText: string, sourceText: string): string {
  const matches = detectTimes(sourceText);
  if (matches.length === 0) return escapedText;

  // Re-detect in escaped text using the same regex — works because the
  // numeric/unit characters we match aren't affected by HTML escaping.
  const out: string[] = [];
  let last = 0;
  for (const m of escapedText.matchAll(RE)) {
    const idx = m.index!;
    const isRange = m[1] !== undefined;
    const num = isRange ? parseFloat(m[2]!) : parseFloat(m[4]!);
    const unit = (isRange ? m[3]! : m[5]!).toLowerCase();
    const secPerUnit = UNIT_TO_SEC[unit] ?? UNIT_TO_SEC[unit.replace(/s$/, '')];
    if (!secPerUnit) continue;
    const seconds = Math.round(num * secPerUnit);
    out.push(escapedText.slice(last, idx));
    out.push(
      `<button type="button" class="timer-chip" data-seconds="${seconds}" data-label="${escapeAttr(m[0])}" aria-label="Start ${m[0]} timer">⏱ ${m[0]}</button>`,
    );
    last = idx + m[0].length;
  }
  out.push(escapedText.slice(last));
  return out.join('');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

export function formatMMSS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const t = Math.abs(totalSeconds);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
}
