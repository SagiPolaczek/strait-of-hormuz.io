export const ENEMY_INTEL = {
  MISSILE_LAUNCHER: {
    name: 'IRGC Missile Launcher',
    icon: '🚀',
    type: 'COASTAL DEFENSE',
    color: '#ef5350',
    maxHP: 150,
    stats: [
      { label: 'DAMAGE', value: '50 per missile' },
      { label: 'RANGE', value: '350' },
      { label: 'FIRE RATE', value: 'Every 2.5s' },
    ],
    desc: 'Shore-based anti-ship missile battery. Fires homing missiles at coalition ships that enter its range. Primary threat to tanker convoys.',
    counter: 'Send Destroyers to engage within range. Upgrade Armament for faster kills.',
  },

  MINE: {
    name: 'Naval Mine',
    icon: '💣',
    type: 'AREA DENIAL',
    color: '#ff9800',
    maxHP: 20,
    stats: [
      { label: 'DAMAGE', value: '90 on contact' },
      { label: 'DETECT RANGE', value: '80' },
      { label: 'VISIBILITY', value: 'Hidden until detected' },
    ],
    desc: 'Contact mine deployed on shipping lanes. Completely invisible until a ship gets dangerously close. One hit can destroy a tanker.',
    counter: 'Escort tankers with Destroyers — they auto-target detected mines.',
  },

  CRUISE_MISSILE: {
    name: 'Cruise Missile',
    icon: '🚀',
    type: 'AIR THREAT',
    color: '#f44336',
    maxHP: 60,
    stats: [
      { label: 'DAMAGE', value: '120' },
      { label: 'SPEED', value: 'Slow (100)' },
      { label: 'TARGET', value: 'Ships & rigs' },
    ],
    desc: 'Long-range anti-ship cruise missile launched from Iranian territory. Slow but devastating — a single hit can cripple any unit.',
    counter: 'Deploy Air Defense systems to intercept before impact.',
  },

  EXPLODING_UAV: {
    name: 'Shahed Attack Drone',
    icon: '🛩',
    type: 'AIR THREAT',
    color: '#ff5722',
    maxHP: 30,
    stats: [
      { label: 'DAMAGE', value: '70 on impact' },
      { label: 'SPEED', value: 'Fast (180)' },
      { label: 'BEHAVIOR', value: 'Suicide attack' },
    ],
    desc: 'One-way attack drone launched in swarms. Fast and hard to track, but fragile. Detonates on contact with any coalition asset.',
    counter: 'Air Defense is essential. Multiple systems needed vs swarms.',
  },

  OIL_RIG_IRGC: {
    name: 'IRGC Oil Rig',
    icon: '🛢️',
    type: 'ECONOMY',
    color: '#ff7043',
    maxHP: 200,
    stats: [
      { label: 'OIL OUTPUT', value: '3/sec (auto-collected)' },
      { label: 'FACTION', value: 'IRGC' },
    ],
    desc: 'Iranian oil platform funding IRGC operations. Generates oil automatically — no collection needed. Fuels enemy weapon production.',
    counter: 'F-22 strikes (coming soon) can disrupt enemy economy.',
  },

  FAST_BOAT_GUN: {
    name: 'IRGC Gun Boat',
    icon: '🚤',
    type: 'SURFACE THREAT',
    color: '#78909c',
    maxHP: 50,
    stats: [
      { label: 'DAMAGE', value: '8 per shot' },
      { label: 'FIRE RATE', value: 'Every 0.8s' },
      { label: 'SPEED', value: 'Fast (150)' },
      { label: 'BEHAVIOR', value: 'Orbits and strafes' },
    ],
    desc: 'Fast attack craft armed with a mounted gun. Circles coalition ships at close range, delivering sustained fire. Arrives in swarms of 5-15.',
    counter: 'Destroyers are the primary counter — their shells outrange gun boats. Upgrade Armament for faster kills.',
  },

  FAST_BOAT_SUICIDE: {
    name: 'IRGC Suicide Boat',
    icon: '💥',
    type: 'SURFACE THREAT',
    color: '#8b1a1a',
    maxHP: 30,
    stats: [
      { label: 'DAMAGE', value: '100 on impact' },
      { label: 'SPEED', value: 'Very fast (200)' },
      { label: 'BEHAVIOR', value: 'Rams target' },
    ],
    desc: 'Explosive-laden speedboat that charges straight at the nearest coalition asset. Fragile but devastating on impact — one hit cripples most ships.',
    counter: 'Destroyers can shoot them down before impact. Prioritize Engine upgrades on tankers to outrun them.',
  },

  MINI_SUBMARINE: {
    name: 'IRGC Mini-Sub',
    icon: '🔻',
    type: 'SUBSURFACE THREAT',
    color: '#f44336',
    maxHP: 80,
    stats: [
      { label: 'TORPEDO DMG', value: '100' },
      { label: 'SPEED', value: '70 (submerged)' },
      { label: 'SURFACE TIME', value: '4s to fire' },
      { label: 'DIVE COOLDOWN', value: '12s' },
    ],
    desc: 'Midget submarine that stalks coalition ships while submerged. Surfaces briefly to fire a torpedo, then dives again. Invisible unless detected by sonar.',
    counter: 'Deploy Coalition Submarines — their sonar reveals mini-subs, making them targetable by Destroyers.',
  },
};

/**
 * Determine the intel key for a given enemy unit.
 */
export function getIntelKey(unit) {
  if (unit.isMine) return 'MINE';
  if (unit.isAirTarget) {
    return unit.speed >= 150 ? 'EXPLODING_UAV' : 'CRUISE_MISSILE';
  }
  if (unit.isSub) return 'MINI_SUBMARINE';
  if (unit.isBoat) {
    return unit.variant === 'suicide' ? 'FAST_BOAT_SUICIDE' : 'FAST_BOAT_GUN';
  }
  if (unit.stats?.key === 'MISSILE_LAUNCHER') return 'MISSILE_LAUNCHER';
  if (unit.stats?.key === 'OIL_RIG' && unit.side === 'irgc') return 'OIL_RIG_IRGC';
  return null;
}
