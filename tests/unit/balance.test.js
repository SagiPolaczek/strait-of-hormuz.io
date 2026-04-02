import { describe, it, expect, beforeEach } from 'vitest';
import { createSceneMock } from '../helpers/scene-mock.js';
import { BalanceMeter } from '../../src/systems/BalanceMeter.js';
import { BALANCE } from '../../src/config/constants.js';

describe('BalanceMeter', () => {
  let scene, meter;

  beforeEach(() => {
    scene = createSceneMock();
    meter = new BalanceMeter(scene);
  });

  describe('initial state', () => {
    it('starts at BALANCE.START', () => {
      expect(meter.value).toBe(BALANCE.START);
    });
    it('is not ended', () => {
      expect(meter.ended).toBe(false);
    });
  });

  describe('tick', () => {
    it('drifts value toward negative', () => {
      meter.tick();
      expect(meter.value).toBeLessThan(BALANCE.START);
    });
    it('does not tick when ended', () => {
      meter.ended = true;
      const before = meter.value;
      meter.tick();
      expect(meter.value).toBe(before);
    });
    it('clamps to MIN', () => {
      meter.value = BALANCE.MIN + 0.001;
      meter.tick();
      expect(meter.value).toBeGreaterThanOrEqual(BALANCE.MIN);
    });
  });

  describe('onTankerScored', () => {
    it('pushes value positive', () => {
      meter.value = 0;
      meter.onTankerScored();
      expect(meter.value).toBe(BALANCE.TANKER_BONUS);
    });
    it('clamps to MAX', () => {
      meter.value = BALANCE.MAX - 1;
      meter.onTankerScored();
      expect(meter.value).toBe(BALANCE.MAX);
    });
  });

  describe('getNormalized', () => {
    it('returns 0 at start (value=0)', () => {
      expect(meter.getNormalized()).toBe(0);
    });
    it('returns 1 at MAX', () => {
      meter.value = BALANCE.MAX;
      expect(meter.getNormalized()).toBe(1);
    });
    it('returns -1 at MIN', () => {
      meter.value = BALANCE.MIN;
      expect(meter.getNormalized()).toBe(-1);
    });
  });

  describe('win/lose conditions', () => {
    it('isDefeat at MIN', () => {
      meter.value = BALANCE.MIN;
      expect(meter.isDefeat()).toBe(true);
    });
    it('isVictory at MAX', () => {
      meter.value = BALANCE.MAX;
      expect(meter.isVictory()).toBe(true);
    });
    it('neither at START', () => {
      expect(meter.isDefeat()).toBe(false);
      expect(meter.isVictory()).toBe(false);
    });
  });

  describe('pause/resume', () => {
    it('tracks pause time', () => {
      const pauseMs = meter._totalPauseMs;
      meter.onPause();
      meter.onResume();
      expect(meter._totalPauseMs).toBeGreaterThanOrEqual(pauseMs);
    });
  });
});
