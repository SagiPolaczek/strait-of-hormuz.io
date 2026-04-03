/**
 * Pure calculation functions for game mechanics.
 * No Phaser dependency — takes primitives, returns primitives.
 */

/**
 * Calculate max HP for a ship with hull/armor upgrades.
 * Ship uses HULL (0.4 per level), Airfield uses ARMOR (0.35 per level).
 */
export function getMaxHP(baseHP, hullLevel = 0, armorLevel = 0) {
  return Math.floor(baseHP * (1 + 0.4 * hullLevel + 0.35 * armorLevel));
}

/**
 * Calculate effective speed with engine upgrades.
 * +25% per engine level.
 */
export function getEffectiveSpeed(baseSpeed, engineLevel = 0) {
  return baseSpeed * (1 + 0.25 * engineLevel);
}

/**
 * Calculate effective damage with damage upgrades.
 * +30% per damage level.
 */
export function getEffectiveDamage(baseDamage, damageLevel = 0) {
  return Math.floor(baseDamage * (1 + 0.3 * damageLevel));
}

/**
 * Calculate effective fire rate with fire rate upgrades.
 * -20% cooldown per level (lower = faster).
 */
export function getEffectiveFireRate(baseRate, fireRateLevel = 0) {
  return Math.max(100, Math.floor(baseRate * (1 - 0.2 * fireRateLevel)));
}

/**
 * Calculate effective range with range upgrades.
 * +20% per range level.
 */
export function getEffectiveRange(baseRange, rangeLevel = 0) {
  return baseRange * (1 + 0.2 * rangeLevel);
}

/**
 * Calculate effective sonar range with sonar upgrades.
 * +25% per sonar level.
 */
export function getEffectiveSonarRange(baseRange, sonarLevel = 0) {
  return baseRange * (1 + 0.25 * sonarLevel);
}


/**
 * Look up the current drift rate from a time-based rate table.
 * Returns the rate for the latest threshold <= current minutes.
 * @param {number} minutes - elapsed minutes
 * @param {Array<{time: number, rate: number}>} driftRates - sorted thresholds
 * @returns {number} drift rate per tick
 */
export function getDriftRate(minutes, driftRates) {
  let rate = driftRates[0].rate;
  for (const t of driftRates) {
    if (minutes >= t.time) rate = t.rate;
  }
  return rate;
}

/**
 * Look up the current escalation multiplier from a time-based threshold table.
 * @param {number} minutes - elapsed minutes
 * @param {Array<{time: number, multiplier: number}>} thresholds - sorted thresholds
 * @returns {number} escalation multiplier
 */
export function getEscalationMultiplier(minutes, thresholds) {
  let mult = 1.0;
  for (const t of thresholds) {
    if (minutes >= t.time) mult = t.multiplier;
  }
  return mult;
}
