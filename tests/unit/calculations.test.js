import { describe, it, expect } from 'vitest';
import {
  getMaxHP,
  getEffectiveSpeed,
  getEffectiveDamage,
  getEffectiveFireRate,
  getEffectiveRange,
  getEffectiveSonarRange,
  getDriftRate,
  getEscalationMultiplier,
} from '../../src/utils/calculations.js';

describe('getMaxHP', () => {
  it('returns base HP with no upgrades', () => {
    expect(getMaxHP(100)).toBe(100);
  });
  it('applies hull upgrade (+40% per level)', () => {
    expect(getMaxHP(100, 1, 0)).toBe(140);
    expect(getMaxHP(100, 2, 0)).toBe(180);
  });
  it('applies armor upgrade (+35% per level)', () => {
    expect(getMaxHP(100, 0, 1)).toBe(135);
    expect(getMaxHP(100, 0, 2)).toBe(170);
  });
  it('stacks hull and armor', () => {
    expect(getMaxHP(100, 1, 1)).toBe(175);
  });
  it('floors the result', () => {
    expect(getMaxHP(33, 1, 0)).toBe(46);
  });
});

describe('getEffectiveSpeed', () => {
  it('returns base speed with no upgrades', () => {
    expect(getEffectiveSpeed(60, 0)).toBe(60);
  });
  it('applies engine upgrade (+25% per level)', () => {
    expect(getEffectiveSpeed(60, 1)).toBe(75);
    expect(getEffectiveSpeed(60, 2)).toBe(90);
  });
});

describe('getEffectiveDamage', () => {
  it('returns base damage with no upgrades', () => {
    expect(getEffectiveDamage(40)).toBe(40);
  });
  it('applies damage upgrade (+30% per level)', () => {
    expect(getEffectiveDamage(40, 1)).toBe(52);
    expect(getEffectiveDamage(40, 2)).toBe(64);
    expect(getEffectiveDamage(40, 3)).toBe(76);
  });
});

describe('getEffectiveFireRate', () => {
  it('returns base rate with no upgrades', () => {
    expect(getEffectiveFireRate(1500)).toBe(1500);
  });
  it('reduces cooldown (-20% per level)', () => {
    expect(getEffectiveFireRate(1500, 1)).toBe(1200);
    expect(getEffectiveFireRate(1500, 2)).toBe(900);
  });
});

describe('getEffectiveRange', () => {
  it('returns base range with no upgrades', () => {
    expect(getEffectiveRange(400)).toBe(400);
  });
  it('increases range (+20% per level)', () => {
    expect(getEffectiveRange(400, 1)).toBe(480);
    expect(getEffectiveRange(400, 2)).toBe(560);
  });
});

describe('getEffectiveSonarRange', () => {
  it('returns base range with no upgrades', () => {
    expect(getEffectiveSonarRange(300)).toBe(300);
  });
  it('increases sonar range (+25% per level)', () => {
    expect(getEffectiveSonarRange(300, 1)).toBe(375);
    expect(getEffectiveSonarRange(300, 2)).toBe(450);
  });
});

describe('getEffectiveFireRate clamping', () => {
  it('clamps to minimum of 100ms at extreme levels', () => {
    expect(getEffectiveFireRate(1500, 5)).toBe(100);
    expect(getEffectiveFireRate(1500, 10)).toBe(100);
  });
});

describe('getDriftRate', () => {
  const driftRates = [
    { time: 0, rate: -0.15 },
    { time: 2, rate: -0.20 },
    { time: 5, rate: -0.28 },
    { time: 8, rate: -0.35 },
  ];
  it('returns initial rate at time 0', () => {
    expect(getDriftRate(0, driftRates)).toBe(-0.15);
  });
  it('returns rate for time between thresholds', () => {
    expect(getDriftRate(1.5, driftRates)).toBe(-0.15);
    expect(getDriftRate(3, driftRates)).toBe(-0.20);
    expect(getDriftRate(6, driftRates)).toBe(-0.28);
  });
  it('returns highest rate at late times', () => {
    expect(getDriftRate(10, driftRates)).toBe(-0.35);
    expect(getDriftRate(100, driftRates)).toBe(-0.35);
  });
  it('returns rate exactly at threshold boundary', () => {
    expect(getDriftRate(2, driftRates)).toBe(-0.20);
    expect(getDriftRate(5, driftRates)).toBe(-0.28);
    expect(getDriftRate(8, driftRates)).toBe(-0.35);
  });
});

describe('getEscalationMultiplier', () => {
  const thresholds = [
    { time: 0, multiplier: 1.0 },
    { time: 2, multiplier: 1.5 },
    { time: 5, multiplier: 2.5 },
    { time: 10, multiplier: 3.0 },
  ];
  it('returns 1.0 at start', () => {
    expect(getEscalationMultiplier(0, thresholds)).toBe(1.0);
  });
  it('returns correct multiplier between thresholds', () => {
    expect(getEscalationMultiplier(1, thresholds)).toBe(1.0);
    expect(getEscalationMultiplier(3, thresholds)).toBe(1.5);
    expect(getEscalationMultiplier(7, thresholds)).toBe(2.5);
  });
  it('returns max multiplier at late times', () => {
    expect(getEscalationMultiplier(15, thresholds)).toBe(3.0);
  });
});
