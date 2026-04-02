/**
 * Minimal Phaser scene mock for testing systems.
 * Only implements methods that EconomyManager and BalanceMeter actually call.
 */
export function createSceneMock(overrides = {}) {
  const timers = [];

  const mock = {
    time: {
      now: 0,
      addEvent: (config) => {
        const timer = { remove: () => {}, config };
        timers.push(timer);
        return timer;
      },
      delayedCall: (delay, cb) => {
        const timer = { remove: () => {}, delay, cb };
        timers.push(timer);
        return timer;
      },
      paused: false,
    },
    trumpShock: { getMultiplier: () => 1.0 },
    _timers: timers,
    ...overrides,
  };

  return mock;
}

/**
 * Trigger all looping timer callbacks once (simulates one tick).
 */
export function tickTimers(sceneMock) {
  for (const timer of sceneMock._timers) {
    if (timer.config?.callback && timer.config?.loop) {
      timer.config.callback.call(timer.config.callbackScope || null);
    }
  }
}
