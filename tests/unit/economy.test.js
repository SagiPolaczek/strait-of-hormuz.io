import { describe, it, expect, beforeEach } from 'vitest';
import { createSceneMock, tickTimers } from '../helpers/scene-mock.js';
import { EconomyManager } from '../../src/systems/EconomyManager.js';
import { ECONOMY } from '../../src/config/constants.js';

describe('EconomyManager', () => {
  let scene, economy;

  beforeEach(() => {
    scene = createSceneMock();
    economy = new EconomyManager(scene);
  });

  describe('initial state', () => {
    it('starts with configured oil amounts', () => {
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL);
      expect(economy.irgcOil).toBe(ECONOMY.IRGC_START_OIL);
    });
    it('starts with empty rig arrays', () => {
      expect(economy.coalitionRigs).toEqual([]);
      expect(economy.irgcRigs).toEqual([]);
    });
  });

  describe('canAfford', () => {
    it('returns true when oil is sufficient', () => {
      expect(economy.canAfford('coalition', 500)).toBe(true);
    });
    it('returns false when oil is insufficient', () => {
      expect(economy.canAfford('coalition', 99999)).toBe(false);
    });
    it('returns true at exact oil amount', () => {
      expect(economy.canAfford('coalition', ECONOMY.COALITION_START_OIL)).toBe(true);
    });
    it('works for IRGC side', () => {
      expect(economy.canAfford('irgc', ECONOMY.IRGC_START_OIL)).toBe(true);
      expect(economy.canAfford('irgc', ECONOMY.IRGC_START_OIL + 1)).toBe(false);
    });
  });

  describe('spend', () => {
    it('deducts oil on successful spend', () => {
      economy.spend('coalition', 200);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL - 200);
    });
    it('returns true on successful spend', () => {
      expect(economy.spend('coalition', 200)).toBe(true);
    });
    it('returns false when insufficient oil', () => {
      expect(economy.spend('coalition', 99999)).toBe(false);
    });
    it('does not deduct when insufficient', () => {
      economy.spend('coalition', 99999);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL);
    });
    it('works for IRGC side', () => {
      economy.spend('irgc', 100);
      expect(economy.irgcOil).toBe(ECONOMY.IRGC_START_OIL - 100);
    });
  });

  describe('earn', () => {
    it('adds oil to coalition', () => {
      economy.earn('coalition', 500);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL + 500);
    });
    it('adds oil to IRGC', () => {
      economy.earn('irgc', 300);
      expect(economy.irgcOil).toBe(ECONOMY.IRGC_START_OIL + 300);
    });
  });

  describe('registerRig / unregisterRig', () => {
    it('registers coalition rigs', () => {
      const rig = { id: 'rig1' };
      economy.registerRig('coalition', rig);
      expect(economy.coalitionRigs).toContain(rig);
    });
    it('registers IRGC rigs', () => {
      const rig = { id: 'rig2' };
      economy.registerRig('irgc', rig);
      expect(economy.irgcRigs).toContain(rig);
    });
    it('unregisters rigs', () => {
      const rig = { id: 'rig1' };
      economy.registerRig('coalition', rig);
      economy.unregisterRig('coalition', rig);
      expect(economy.coalitionRigs).not.toContain(rig);
    });
    it('handles unregister of non-existent rig gracefully', () => {
      economy.unregisterRig('coalition', { id: 'fake' });
      expect(economy.coalitionRigs).toEqual([]);
    });
  });

  describe('getEffectiveCost', () => {
    it('returns the base cost without scaling', () => {
      expect(economy.getEffectiveCost(500)).toBe(500);
      expect(economy.getEffectiveCost(100)).toBe(100);
    });
  });

  describe('tick', () => {
    it('adds oil to IRGC based on rig count', () => {
      economy.registerRig('irgc', { active: true });
      economy.registerRig('irgc', { active: true });
      const before = economy.irgcOil;
      tickTimers(scene);
      expect(economy.irgcOil).toBe(before + 2 * ECONOMY.OIL_RIG_RATE);
    });
    it('adds oil to coalition based on active rigs', () => {
      const rig = {
        active: true,
        upgrades: {},
      };
      economy.registerRig('coalition', rig);
      const before = economy.coalitionOil;
      tickTimers(scene);
      expect(economy.coalitionOil).toBe(before + ECONOMY.OIL_RIG_RATE);
    });
  });
});
