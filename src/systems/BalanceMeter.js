import { BALANCE } from '../config/constants.js';

export class BalanceMeter {
  constructor(scene) {
    this.scene = scene;
    this.value = BALANCE.START;
    this.startTime = Date.now();
    this.ended = false;
    this._cachedMinute = -1;
    this._cachedRate = BALANCE.DRIFT_RATES[0].rate;
    this._totalPauseMs = 0;
    this._pauseStart = 0;

    scene.time.addEvent({
      delay: 100,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  onPause() {
    this._pauseStart = Date.now();
  }

  onResume() {
    if (this._pauseStart) {
      this._totalPauseMs += Date.now() - this._pauseStart;
      this._pauseStart = 0;
    }
  }

  getElapsedMinutes() {
    return (Date.now() - this.startTime - this._totalPauseMs) / 60000;
  }

  getDriftRate() {
    const minutes = this.getElapsedMinutes();
    const minuteFloor = Math.floor(minutes);
    if (minuteFloor !== this._cachedMinute) {
      this._cachedMinute = minuteFloor;
      let rate = BALANCE.DRIFT_RATES[0].rate;
      for (const t of BALANCE.DRIFT_RATES) {
        if (minutes >= t.time) rate = t.rate;
      }
      this._cachedRate = rate;
    }
    return this._cachedRate;
  }

  tick() {
    if (this.ended) return;
    this.value += this.getDriftRate() * 0.1;
    this.value = Math.max(BALANCE.MIN, Math.min(BALANCE.MAX, this.value));
  }

  onTankerScored() {
    this.value = Math.min(BALANCE.MAX, this.value + BALANCE.TANKER_BONUS);
  }

  getNormalized() {
    return this.value / BALANCE.MAX;
  }

  isDefeat() {
    return this.value <= BALANCE.MIN;
  }

  isVictory() {
    return this.value >= BALANCE.MAX;
  }
}
