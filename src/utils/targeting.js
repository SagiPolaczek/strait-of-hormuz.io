import Phaser from 'phaser';

/**
 * Find the nearest coalition target for an IRGC unit.
 * Searches coalition ships, rigs, and optionally defenses.
 * @param {Phaser.Scene} scene
 * @param {number} x - attacker x position
 * @param {number} y - attacker y position
 * @param {object} options
 * @param {number} [options.maxRange=Infinity] - maximum targeting range
 * @param {boolean} [options.includeDefenses=false] - include coalition defenses
 * @param {boolean} [options.waterDefensesOnly=false] - only target defenses in water
 * @returns {Phaser.GameObjects.GameObject|null}
 */
export function findNearestCoalitionTarget(scene, x, y, options = {}) {
  const { maxRange = Infinity, includeDefenses = false, waterDefensesOnly = false } = options;
  let nearest = null, nearDist = maxRange;

  for (const s of scene.coalitionShips?.getChildren() || []) {
    if (!s.active || !s.alive || s.isSubmerged) continue;
    const d = Phaser.Math.Distance.Between(x, y, s.x, s.y);
    if (d < nearDist) { nearDist = d; nearest = s; }
  }

  for (const r of scene.coalitionRigs?.getChildren() || []) {
    if (!r.active || r.side !== 'coalition') continue;
    const d = Phaser.Math.Distance.Between(x, y, r.x, r.y);
    if (d < nearDist) { nearDist = d; nearest = r; }
  }

  if (includeDefenses) {
    for (const d of scene.coalitionDefenses?.getChildren() || []) {
      if (!d.active) continue;
      if (waterDefensesOnly && scene.zoneManager && !scene.zoneManager.isInWater(d.x, d.y)) continue;
      const dist = Phaser.Math.Distance.Between(x, y, d.x, d.y);
      if (dist < nearDist) { nearDist = dist; nearest = d; }
    }
  }

  return nearest;
}
