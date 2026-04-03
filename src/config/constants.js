export const MAP = {
  WIDTH: 1920,
  HEIGHT: 1539,
};

export const ECONOMY = {
  COALITION_START_OIL: 2000,
  IRGC_START_OIL: 800,
  OIL_RIG_RATE: 5,           // oil per second per rig
  IRGC_OIL_RIG_COST_MULT: 0.85, // IRGC oil rigs cost 85% of normal
  TANKER_BONUS: 500,          // oil earned when a tanker passes through
};

export const TIMING = {
  AI_TICK_MS: 3000,           // AI makes a decision every 3 seconds
  OIL_TICK_MS: 1000,          // oil generated every 1 second
  MISSILE_COOLDOWN_MS: 2500,  // launcher fires every 2.5 seconds
  DESTROYER_FIRE_RATE_MS: 1500,
  GAME_OVER_GRACE_MS: 10000,  // don't check game over for the first 10 seconds
};

export const BALANCE = {
  MIN: -100,
  MAX: 100,
  START: 0,
  TANKER_BONUS: 15,
  DRIFT_RATES: [
    { time: 0, rate: -0.15 },
    { time: 2, rate: -0.20 },
    { time: 5, rate: -0.28 },
    { time: 8, rate: -0.35 },
  ],
};

export const ADVANCED = {
  UNLOCK_TIME_MS: 180000,     // 3 minutes — air defense unlock + cruise missiles
  MINE_START_MS: 120000,      // 2 minutes — mines start earlier
  MINE_INTERVAL_MS: 40000,    // new mine batch every 40s
  MINES_PER_BATCH: 2,
  CRUISE_MISSILE_START_MS: 180000, // 3:00 — first wave
  CRUISE_MISSILE_INTERVAL_MS: 25000,
  UAV_START_MS: 210000,       // 3:30 — staggered after missiles
  UAV_SWARM_INTERVAL_MS: 15000,
  UAV_PER_SWARM: 2,
  FAST_BOAT_START_MS: 240000, // 4:00 — staggered after drones
  FAST_BOAT_INTERVAL_MS: 50000,
  FAST_BOAT_BASE_COUNT: 5,
  SUBMARINE_START_MS: 300000,
  SUBMARINE_INTERVAL_MS: 75000,
  F22_REFUEL_MS: 15000,
  F22_SPEED: 250,
  F22_BOMB_DAMAGE: 100,
};

export const SOCIAL = {
  GITHUB_URL: 'https://github.com/SagiPolaczek/strait-of-hormuz.io',
  X_URL: 'https://x.com/PolaczekSagi',
};

export const ESCALATION = {
  THRESHOLDS: [
    { time: 0, multiplier: 1.0 },
    { time: 2, multiplier: 1.5 },
    { time: 5, multiplier: 2.5 },
    { time: 10, multiplier: 3.0 },
  ],
};
