import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BREAK_SECONDS,
  FOCUS_SECONDS,
  MODES,
  PomodoroTimer,
  durationFor,
  formatTime,
  nextMode,
} from './timer.js';

function createTimer() {
  let now = 0;
  const events = { ticks: 0, completes: [], last: null };
  const timer = new PomodoroTimer({
    now: () => now,
    onTick: (snapshot) => {
      events.ticks += 1;
      events.last = snapshot;
    },
    onComplete: (completedMode, snapshot) => {
      events.completes.push(completedMode);
      events.afterComplete = snapshot;
    },
  });

  return {
    timer,
    events,
    advance(ms) {
      now += ms;
    },
  };
}

test('formatTime always renders MM:SS and never goes negative', () => {
  assert.equal(formatTime(25 * 60), '25:00');
  assert.equal(formatTime(5 * 60), '05:00');
  assert.equal(formatTime(59.2), '01:00');
  assert.equal(formatTime(59), '00:59');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(-12), '00:00');
});

test('modes expose the requested 25 and 5 minute durations', () => {
  assert.equal(FOCUS_SECONDS, 1500);
  assert.equal(BREAK_SECONDS, 300);
  assert.equal(MODES.focus.label, '专注');
  assert.equal(MODES.break.label, '休息');
  assert.equal(durationFor('focus'), 1_500_000);
  assert.equal(durationFor('break'), 300_000);
  assert.equal(nextMode('focus'), 'break');
  assert.equal(nextMode('break'), 'focus');
});

test('a fresh timer starts idle on a full focus phase', () => {
  const { timer } = createTimer();
  const snapshot = timer.snapshot();

  assert.equal(snapshot.mode, 'focus');
  assert.equal(snapshot.state, 'idle');
  assert.equal(snapshot.running, false);
  assert.equal(snapshot.remainingSeconds, 1500);
  assert.equal(snapshot.totalSeconds, 1500);
  assert.equal(snapshot.progress, 0);
});

test('ticking counts down from the deadline instead of accumulating drift', () => {
  const { timer, advance } = createTimer();
  timer.start();

  advance(1_000);
  timer.tick();
  assert.equal(timer.remainingSeconds, 1499);

  // A late tick still reports the true remaining time.
  advance(89_000);
  timer.tick();
  assert.equal(timer.remainingSeconds, 1410);
  assert.equal(timer.state, 'running');
});

test('pause freezes the remaining time and start resumes it', () => {
  const { timer, advance } = createTimer();
  timer.start();
  advance(40_000);
  timer.tick();

  timer.pause();
  const pausedRemaining = timer.remainingSeconds;
  advance(120_000);
  timer.tick();

  assert.equal(timer.running, false);
  assert.equal(timer.state, 'paused');
  assert.equal(timer.remainingSeconds, pausedRemaining);

  timer.start();
  advance(10_000);
  timer.tick();
  assert.equal(timer.remainingSeconds, pausedRemaining - 10);
});

test('finishing a focus phase switches to a fresh, stopped break phase', () => {
  const { timer, events, advance } = createTimer();
  timer.start();
  advance(1_500_000);
  timer.tick();

  assert.deepEqual(events.completes, ['focus']);
  assert.equal(events.afterComplete.mode, 'break');
  assert.equal(timer.mode, 'break');
  assert.equal(timer.state, 'idle');
  assert.equal(timer.remainingSeconds, 300);
  assert.equal(timer.running, false);
  assert.equal(events.last.mode, 'break');
});

test('finishing a break phase switches back to a fresh focus phase', () => {
  const { timer, events, advance } = createTimer();
  timer.setMode('break');
  timer.start();
  advance(300_000);
  timer.tick();

  assert.deepEqual(events.completes, ['break']);
  assert.equal(timer.mode, 'focus');
  assert.equal(timer.remainingSeconds, 1500);
});

test('stale ticks after completion do not emit a second completion', () => {
  const { timer, events, advance } = createTimer();
  timer.start();
  advance(1_500_000);
  timer.tick();
  advance(1_000);
  timer.tick();

  assert.deepEqual(events.completes, ['focus']);
  assert.equal(timer.remainingSeconds, 300);
});

test('reset restores the full current phase and stops the timer', () => {
  const { timer, advance } = createTimer();
  timer.start();
  advance(100_000);
  timer.tick();

  timer.reset();
  assert.equal(timer.state, 'idle');
  assert.equal(timer.remainingSeconds, 1500);
  assert.equal(timer.running, false);
});

test('setMode switches phases and rejects unknown modes', () => {
  const { timer } = createTimer();
  timer.start();
  assert.equal(timer.setMode('break'), true);
  assert.equal(timer.mode, 'break');
  assert.equal(timer.state, 'idle');
  assert.equal(timer.remainingSeconds, 300);

  assert.equal(timer.setMode('nap'), false);
  assert.equal(timer.mode, 'break');
});

test('progress grows from 0 to 1 over a phase', () => {
  const { timer, advance } = createTimer();
  timer.start();
  advance(750_000);
  timer.tick();
  assert.ok(Math.abs(timer.progress - 0.5) < 0.01);

  advance(749_999);
  timer.tick();
  assert.ok(timer.progress > 0.99);
});