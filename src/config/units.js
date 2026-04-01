export const COALITION_UNITS = {
  OIL_RIG: {
    key: 'OIL_RIG',
    name: 'Oil Rig',
    icon: '🛢️',
    cost: 500,
    hp: 200,
    oilRate: 2,
    zone: 'COALITION_OIL',
    type: 'building',
  },
  TANKER: {
    key: 'TANKER',
    name: 'Tanker',
    icon: '⛽',
    cost: 200,
    hp: 100,
    speed: 60,
    zone: 'COALITION_DEPLOY',
    type: 'ship',
    scoreValue: 1,
    oilBonus: 500,
  },
  DESTROYER: {
    key: 'DESTROYER',
    name: 'Destroyer',
    icon: '🛥️',
    cost: 350,
    hp: 180,
    speed: 90,
    zone: 'COALITION_DEPLOY',
    type: 'ship',
    damage: 40,
    range: 200,
    fireRate: 1500,
  },
};

export const IRGC_UNITS = {
  OIL_RIG: {
    key: 'OIL_RIG',
    name: 'Oil Rig',
    icon: '🛢️',
    cost: 400,
    hp: 200,
    oilRate: 2,
    zone: 'IRGC_OIL',
    type: 'building',
  },
  MISSILE_LAUNCHER: {
    key: 'MISSILE_LAUNCHER',
    name: 'Missile Launcher',
    icon: '🚀',
    cost: 300,
    hp: 150,
    damage: 50,
    range: 350,
    fireRate: 2500,
    zone: 'IRGC_BUILD',
    type: 'tower',
  },
};

export const PROJECTILES = {
  MISSILE: {
    speed: 250,
    damage: 50,
    color: 0xff4444,
    radius: 4,
  },
  DESTROYER_SHELL: {
    speed: 350,
    damage: 40,
    color: 0x42a5f5,
    radius: 3,
  },
};
