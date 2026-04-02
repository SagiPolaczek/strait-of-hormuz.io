import { SettingsManager } from './SettingsManager.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    const saved = SettingsManager.load();
    this.enabled = saved.soundEnabled;
    this.volume = saved.volume;
    this._initOnInteraction();
  }

  _initOnInteraction() {
    const init = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      document.removeEventListener('pointerdown', init);
      document.removeEventListener('keydown', init);
    };
    document.addEventListener('pointerdown', init, { once: true });
    document.addEventListener('keydown', init, { once: true });
  }

  _play(freq, type, duration, vol = 1, ramp = 0.01) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _noise(duration, vol = 0.3) {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  place() {
    // Soft blip — unit placed
    this._play(880, 'sine', 0.08, 0.4);
    setTimeout(() => this._play(1100, 'sine', 0.06, 0.3), 50);
  }

  tankerScored() {
    // Success chime — ascending notes
    this._play(523, 'sine', 0.15, 0.5);
    setTimeout(() => this._play(659, 'sine', 0.15, 0.5), 100);
    setTimeout(() => this._play(784, 'sine', 0.2, 0.6), 200);
    setTimeout(() => this._play(1047, 'sine', 0.3, 0.5), 300);
  }

  explosion() {
    // Low boom
    this._play(80, 'sawtooth', 0.3, 0.5);
    this._noise(0.2, 0.4);
  }

  upgradePurchased() {
    // Level up — quick ascending
    this._play(600, 'square', 0.06, 0.3);
    setTimeout(() => this._play(800, 'square', 0.06, 0.3), 60);
    setTimeout(() => this._play(1000, 'square', 0.1, 0.3), 120);
  }

  missileFired() {
    // Whoosh
    this._play(200, 'sawtooth', 0.15, 0.2);
  }

  damage() {
    // Short impact
    this._play(150, 'square', 0.08, 0.3);
    this._noise(0.05, 0.2);
  }

  error() {
    // Error buzz
    this._play(200, 'square', 0.12, 0.4);
    setTimeout(() => this._play(150, 'square', 0.15, 0.4), 100);
  }

  collectOil() {
    // Coin clink
    this._play(1200, 'sine', 0.05, 0.3);
    setTimeout(() => this._play(1500, 'sine', 0.08, 0.3), 40);
  }

  trumpShock() {
    // Dramatic sting
    this._play(440, 'sawtooth', 0.15, 0.5);
    setTimeout(() => this._play(554, 'sawtooth', 0.15, 0.5), 100);
    setTimeout(() => this._play(659, 'sawtooth', 0.3, 0.6), 200);
  }

  victory() {
    // Fanfare
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._play(f, 'sine', 0.3, 0.5), i * 150);
    });
    setTimeout(() => {
      [1047, 1319, 1568].forEach((f, i) => {
        setTimeout(() => this._play(f, 'sine', 0.4, 0.4), i * 100);
      });
    }, 700);
  }

  defeat() {
    // Low descending drone
    this._play(220, 'sawtooth', 0.5, 0.4);
    setTimeout(() => this._play(165, 'sawtooth', 0.5, 0.4), 300);
    setTimeout(() => this._play(110, 'sawtooth', 0.8, 0.3), 600);
  }

  alarm() {
    // Balance meter critical warning
    this._play(800, 'square', 0.1, 0.3);
    setTimeout(() => this._play(600, 'square', 0.1, 0.3), 150);
  }
}
