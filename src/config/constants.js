export const MAP = {
  WIDTH: 1920,
  HEIGHT: 1539,
};

export const ECONOMY = {
  COALITION_START_OIL: 1500,
  IRGC_START_OIL: 800,
  OIL_RIG_RATE: 2,           // oil per second per rig
  TANKER_BONUS: 500,          // oil earned when a tanker passes through
};

export const TIMING = {
  AI_TICK_MS: 3000,           // AI makes a decision every 3 seconds
  OIL_TICK_MS: 1000,          // oil generated every 1 second
  MISSILE_COOLDOWN_MS: 2500,  // launcher fires every 2.5 seconds
  DESTROYER_FIRE_RATE_MS: 1500,
};

export const ESCALATION = {
  THRESHOLDS: [
    { time: 0, multiplier: 1.0 },
    { time: 2, multiplier: 1.5 },
    { time: 5, multiplier: 2.5 },
    { time: 10, multiplier: 4.0 },
  ],
};
