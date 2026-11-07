import {
  BREAK_SECONDS,
  FOCUS_SECONDS,
  MODES,
  PomodoroTimer,
  SHORT_FOCUS_SECONDS,
  formatTime,
} from './timer.js';

const TICK_INTERVAL_MS = 250;
const IDLE_TITLE = `番茄时钟 · ${FOCUS_SECONDS / 60} / ${SHORT_FOCUS_SECONDS / 60} / ${BREAK_SECONDS / 60}`;

const els = {
  body: document.body,
  card: document.querySelector('.timer-card'),
  time: document.getElementById('timeDisplay'),
  phase: document.getElementById('phaseLabel'),
  hint: document.getElementById('stateHint'),
  startPause: document.getElementById('startPauseButton'),
  reset: document.getElementById('resetButton'),
  notice: document.getElementById('notice'),
  ring: document.querySelector('.ring-progress'),
  modeButtons: [...document.querySelectorAll('button[data-mode]')],
};

const timer = new PomodoroTimer({
  onTick: render,
  onComplete: handleComplete,
});

function phaseMinutes(mode) {
  return Math.round(MODES[mode].seconds / 60);
}

function render({ mode, state, running, remainingSeconds, progress }) {
  els.body.dataset.mode = mode;
  els.time.textContent = formatTime(remainingSeconds);
  els.phase.textContent = MODES[mode].label;

  if (running) {
    els.hint.textContent = mode === 'break' ? '休息中，放松一下' : '专注中，保持节奏';
  } else if (state === 'paused') {
    els.hint.textContent = '已暂停，点击继续';
  } else {
    els.hint.textContent = `点击开始，${MODES[mode].label} ${phaseMinutes(mode)} 分钟`;
  }

  els.startPause.textContent = running ? '暂停' : state === 'paused' ? '继续' : '开始';

  // The ring empties as the phase progresses (pathLength is normalised to 100).
  els.ring.style.strokeDashoffset = String(Math.min(1, Math.max(0, progress)) * 100);

  for (const button of els.modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }

  document.title = running
    ? `${formatTime(remainingSeconds)} · ${MODES[mode].label} · 番茄时钟`
    : IDLE_TITLE;
}

function handleComplete(completedMode, { mode }) {
  const next = MODES[mode];
  const minutes = Math.round(next.seconds / 60);

  els.notice.textContent =
    completedMode !== 'break'
      ? `专注结束。休息 ${minutes} 分钟，点击「开始」进入休息。`
      : `休息结束。下一轮 ${minutes} 分钟专注，点击「开始」继续。`;
  els.notice.hidden = false;
  els.card.classList.add('is-complete');
}

function hideNotice() {
  els.notice.hidden = true;
  els.card.classList.remove('is-complete');
}

els.startPause.addEventListener('click', () => {
  hideNotice();
  timer.toggle();
});

els.reset.addEventListener('click', () => {
  hideNotice();
  timer.reset();
});

for (const button of els.modeButtons) {
  button.addEventListener('click', () => {
    if (button.dataset.mode === timer.mode) return;
    hideNotice();
    timer.setMode(button.dataset.mode);
  });
}

// Deadline based ticks catch up after throttled background tabs.
window.setInterval(() => timer.tick(), TICK_INTERVAL_MS);
document.addEventListener('visibilitychange', () => timer.tick());

render(timer.snapshot());