/**
 * Pomodoro timer logic, kept free of DOM access so it can be unit tested.
 * The timer is deadline based: the remaining time is derived from a real
 * timestamp, so delayed ticks (background tabs, slow frames) do not drift.
 */

export const FOCUS_SECONDS = 25 * 60;
export const BREAK_SECONDS = 5 * 60;

export const MODES = {
  focus: { label: '专注', seconds: FOCUS_SECONDS },
  break: { label: '休息', seconds: BREAK_SECONDS },
};

export function durationFor(mode) {
  return (MODES[mode] ?? MODES.focus).seconds * 1000;
}

export function nextMode(mode) {
  return mode === 'focus' ? 'break' : 'focus';
}

/** Format a number of remaining seconds as MM:SS (rounded up). */
export function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export class PomodoroTimer {
  constructor({ now = Date.now, onTick = () => {}, onComplete = () => {} } = {}) {
    this.now = now;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.mode = 'focus';
    this.remainingMs = durationFor(this.mode);
    this.deadline = null;
    this.running = false;
  }

  get totalMs() {
    return durationFor(this.mode);
  }

  get remainingSeconds() {
    return Math.ceil(this.remainingMs / 1000);
  }

  get totalSeconds() {
    return Math.round(this.totalMs / 1000);
  }

  get state() {
    if (this.running) return 'running';
    return this.remainingMs < this.totalMs ? 'paused' : 'idle';
  }

  get progress() {
    if (this.totalMs === 0) return 1;
    return Math.min(1, Math.max(0, 1 - this.remainingMs / this.totalMs));
  }

  snapshot() {
    return {
      mode: this.mode,
      state: this.state,
      running: this.running,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      progress: this.progress,
    };
  }

  start() {
    if (this.running) return false;
    this.running = true;
    this.deadline = this.now() + this.remainingMs;
    this.onTick(this.snapshot());
    return true;
  }

  pause() {
    if (!this.running) return false;
    this.remainingMs = Math.max(0, this.deadline - this.now());
    this.running = false;
    this.deadline = null;
    this.onTick(this.snapshot());
    return true;
  }

  toggle() {
    return this.running ? this.pause() : this.start();
  }

  reset() {
    this.running = false;
    this.deadline = null;
    this.remainingMs = this.totalMs;
    this.onTick(this.snapshot());
  }

  setMode(mode) {
    if (!Object.hasOwn(MODES, mode)) return false;
    this.mode = mode;
    this.running = false;
    this.deadline = null;
    this.remainingMs = this.totalMs;
    this.onTick(this.snapshot());
    return true;
  }

  tick() {
    if (!this.running) return;
    const left = this.deadline - this.now();
    if (left <= 0) {
      this.#complete();
      return;
    }
    this.remainingMs = left;
    this.onTick(this.snapshot());
  }

  #complete() {
    const completedMode = this.mode;
    this.running = false;
    this.deadline = null;
    this.mode = nextMode(completedMode);
    this.remainingMs = this.totalMs;
    const snapshot = this.snapshot();
    this.onComplete(completedMode, snapshot);
    this.onTick(snapshot);
  }
}