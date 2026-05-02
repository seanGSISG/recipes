// Cook Mode client runtime.
// Initialized once on page load; coordinates step navigation, wake lock,
// timer chips, the floating timer panel, and the keyboard/touch UI.

import { attachScaler } from './scale';
import { formatMMSS } from './timer-detect';

interface Timer {
  id: number;
  label: string;
  endTime: number;       // ms epoch
  pausedRemaining: number | null;  // ms left when paused, null if running
  fired: boolean;
  el: HTMLElement;
  chip: HTMLButtonElement | null;
}

const SS_KEY = 'cook-active-timers';

export function initCook(): void {
  const root = document.querySelector<HTMLElement>('.cook-shell');
  if (!root) return;

  attachScaler();

  const steps = Array.from(document.querySelectorAll<HTMLElement>('.cook-step'));
  const totalCells = steps.length;       // includes trailing "Done!" step
  const realSteps = totalCells - 1;
  const stepNumEl = document.getElementById('step-num');
  const progressEl = document.getElementById('progress');
  const prev = document.querySelector<HTMLButtonElement>('.cook-footer .prev');
  const next = document.querySelector<HTMLButtonElement>('.cook-footer .next');
  const timersEl = document.getElementById('timers');
  if (!prev || !next || !timersEl) return;

  let current = 0;

  function show(i: number) {
    current = Math.max(0, Math.min(totalCells - 1, i));
    steps.forEach((s, idx) => { s.hidden = idx !== current; });
    if (stepNumEl) stepNumEl.textContent = String(Math.min(current + 1, realSteps));
    if (progressEl) progressEl.style.setProperty('--progress', `${(current / realSteps) * 100}%`);
    prev.disabled = current === 0;
    if (current === totalCells - 1) {
      next.style.display = 'none';
    } else {
      next.style.display = '';
      next.textContent = current === realSteps - 1 ? 'Finish →' : 'Next →';
    }
  }

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'KeyN') {
      e.preventDefault();
      show(current + 1);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyP') {
      e.preventDefault();
      show(current - 1);
    } else if (e.code === 'Escape') {
      window.location.href = './';
    }
  });

  // Touch swipe (horizontal)
  let pointerStart: { x: number; y: number; t: number } | null = null;
  document.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button, a, .timers-panel')) return;
    pointerStart = { x: e.clientX, y: e.clientY, t: Date.now() };
  });
  document.addEventListener('pointerup', (e) => {
    if (!pointerStart) return;
    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    const dt = Date.now() - pointerStart.t;
    pointerStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 80 && dt < 600) {
      show(current + (dx < 0 ? 1 : -1));
    }
  });

  // Wake lock
  let wakeLock: WakeLockSentinel | null = null;
  async function acquireLock() {
    const nav = navigator as Navigator & { wakeLock?: WakeLock };
    if (!nav.wakeLock) return;
    try { wakeLock = await nav.wakeLock.request('screen'); } catch {}
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      acquireLock();
      handleResume();
    } else {
      persistTimers();
    }
  });
  // Acquire on first user gesture (already triggered by entering Cook Mode link click)
  acquireLock();
  window.addEventListener('beforeunload', () => {
    wakeLock?.release().catch(() => {});
    wakeLock = null;
    persistTimers();
  });

  // Restart button on Done step
  document.querySelector<HTMLButtonElement>('.cook-done .restart')?.addEventListener('click', () => {
    show(0);
  });

  // Timer system
  const timers = new Map<number, Timer>();
  let nextId = 1;
  let tickHandle: number | null = null;
  let audioCtx: AudioContext | null = null;

  function startTick() {
    if (tickHandle !== null) return;
    tickHandle = window.setInterval(tick, 250);
  }
  function stopTick() {
    if (tickHandle !== null) { clearInterval(tickHandle); tickHandle = null; }
  }

  function tick() {
    const now = Date.now();
    let anyRunning = false;
    timers.forEach((t) => {
      const timeEl = t.el.querySelector<HTMLElement>('.timer-time');
      if (!timeEl) return;
      if (t.pausedRemaining !== null) return;
      const remaining = Math.ceil((t.endTime - now) / 1000);
      timeEl.textContent = formatMMSS(remaining);
      if (remaining > 0) anyRunning = true;
      if (remaining <= 0 && !t.fired) fire(t);
    });
    if (!anyRunning) stopTick();
  }

  function fire(t: Timer) {
    t.fired = true;
    t.el.classList.add('fired');
    t.chip?.classList.remove('armed');
    chime();
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    notify(t);
  }

  function chime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtx;
      const start = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, start + offset);
        gain.gain.linearRampToValueAtTime(0.4, start + offset + 0.02);
        gain.gain.linearRampToValueAtTime(0, start + offset + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start + offset);
        osc.stop(start + offset + 0.16);
      });
    } catch {}
  }

  function notify(t: Timer) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(`${t.label} done`, { body: 'Timer finished', tag: `timer-${t.id}`, silent: false });
    }
  }

  // Permission request on first chip click (needs a user gesture)
  let permissionAsked = false;
  function maybeAskPermission() {
    if (permissionAsked) return;
    permissionAsked = true;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  function startTimer(seconds: number, label: string, chip: HTMLButtonElement | null): Timer {
    const id = nextId++;
    const endTime = Date.now() + seconds * 1000;
    const el = renderTimerCard(id, label, seconds);
    timersEl!.appendChild(el);
    const t: Timer = { id, label, endTime, pausedRemaining: null, fired: false, el, chip };
    timers.set(id, t);
    chip?.classList.add('armed');
    wireTimerActions(t);
    startTick();
    return t;
  }

  function renderTimerCard(id: number, label: string, seconds: number): HTMLElement {
    const div = document.createElement('div');
    div.className = 'timer-card';
    div.dataset.id = String(id);
    div.innerHTML = `
      <div class="timer-label">${escapeHtml(label)}</div>
      <div class="timer-time">${formatMMSS(seconds)}</div>
      <div class="timer-actions">
        <button type="button" data-act="pause">Pause</button>
        <button type="button" data-act="add">+1m</button>
        <button type="button" data-act="dismiss">✕</button>
      </div>
    `;
    return div;
  }

  function wireTimerActions(t: Timer) {
    t.el.querySelector('[data-act="pause"]')?.addEventListener('click', () => togglePause(t));
    t.el.querySelector('[data-act="add"]')?.addEventListener('click', () => addMinute(t));
    t.el.querySelector('[data-act="dismiss"]')?.addEventListener('click', () => dismiss(t));
  }

  function togglePause(t: Timer) {
    const btn = t.el.querySelector<HTMLButtonElement>('[data-act="pause"]');
    if (t.pausedRemaining !== null) {
      t.endTime = Date.now() + t.pausedRemaining;
      t.pausedRemaining = null;
      if (btn) btn.textContent = 'Pause';
      startTick();
    } else {
      t.pausedRemaining = t.endTime - Date.now();
      if (btn) btn.textContent = 'Resume';
    }
  }

  function addMinute(t: Timer) {
    if (t.fired) {
      t.el.classList.remove('fired');
      t.fired = false;
      t.chip?.classList.add('armed');
      t.endTime = Date.now() + 60_000;
    } else if (t.pausedRemaining !== null) {
      t.pausedRemaining += 60_000;
    } else {
      t.endTime += 60_000;
    }
    startTick();
  }

  function dismiss(t: Timer) {
    t.el.remove();
    t.chip?.classList.remove('armed');
    timers.delete(t.id);
    if (timers.size === 0) stopTick();
  }

  // Wire all chips on the page
  document.querySelectorAll<HTMLButtonElement>('.timer-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      maybeAskPermission();
      const seconds = parseInt(chip.dataset.seconds || '0', 10);
      const label = deriveLabel(chip);
      startTimer(seconds, label, chip);
    });
  });

  function deriveLabel(chip: HTMLButtonElement): string {
    const step = chip.closest<HTMLElement>('.cook-step');
    const text = step?.querySelector<HTMLElement>('.step-text strong')?.textContent
              ?? step?.querySelector<HTMLElement>('.step-text')?.textContent
              ?? 'Timer';
    return text.replace(/[.:].*$/, '').trim().slice(0, 24) || 'Timer';
  }

  // Restore on tab resume — fire any timers that elapsed while hidden
  function persistTimers() {
    try {
      const data = Array.from(timers.values()).map((t) => ({
        id: t.id, label: t.label, endTime: t.endTime,
        pausedRemaining: t.pausedRemaining, fired: t.fired,
      }));
      sessionStorage.setItem(SS_KEY, JSON.stringify(data));
    } catch {}
  }

  function handleResume() {
    timers.forEach((t) => {
      if (t.pausedRemaining !== null) return;
      if (Date.now() >= t.endTime && !t.fired) fire(t);
    });
    if (timers.size > 0) startTick();
  }

  // Initial render
  show(0);
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
