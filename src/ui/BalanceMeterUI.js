export class BalanceMeterUI {
  constructor(scene, meter) {
    this.scene = scene;
    this.meter = meter;
    this._prevValue = null;

    const D = 100;

    // Bar geometry — right edge
    this.barX = 1872;
    this.barW = 24;
    this.barTop = 100;
    this.barBot = 1400;
    this.barH = this.barBot - this.barTop;
    this.midY = (this.barTop + this.barBot) / 2;

    // Panel background
    this.bg = scene.add.graphics().setDepth(D).setScrollFactor(0);
    this.bg.fillStyle(0x0a0e14, 0.88);
    this.bg.fillRoundedRect(this.barX - 22, this.barTop - 35, 68, this.barH + 70, 4);
    this.bg.lineStyle(1, 0x33ff66, 0.15);
    this.bg.strokeRoundedRect(this.barX - 22, this.barTop - 35, 68, this.barH + 70, 4);
    // Scan lines
    for (let y = this.barTop - 33; y < this.barBot + 33; y += 3) {
      this.bg.fillStyle(0x000000, 0.05);
      this.bg.fillRect(this.barX - 20, y, 64, 1);
    }

    // (labels removed for cleaner look)

    // Track background
    const track = scene.add.graphics().setDepth(D + 1).setScrollFactor(0);
    track.fillStyle(0x1a1a1a, 0.9);
    track.fillRect(this.barX, this.barTop, this.barW, this.barH);
    track.lineStyle(1, 0x333333, 0.5);
    track.strokeRect(this.barX, this.barTop, this.barW, this.barH);

    // Gradient ticks (blue at top, red at bottom)
    const ticks = scene.add.graphics().setDepth(D + 1.2).setScrollFactor(0);
    for (let i = 0; i <= 10; i++) {
      const ty = this.barTop + (this.barH / 10) * i;
      const alpha = i === 5 ? 0.4 : 0.12;
      const w = i === 5 ? this.barW + 8 : this.barW - 8;
      const xOff = i === 5 ? -4 : 4;
      ticks.lineStyle(i === 5 ? 2 : 1, 0xffffff, alpha);
      ticks.lineBetween(this.barX + xOff, ty, this.barX + xOff + w, ty);
    }

    // Dynamic elements
    this.fill = scene.add.graphics().setDepth(D + 1.5).setScrollFactor(0);
    this.pip = scene.add.graphics().setDepth(D + 3).setScrollFactor(0);

    this.valueText = scene.add.text(this.barX + this.barW / 2, this.midY, '0', {
      fontSize: '17px', fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(D + 4).setScrollFactor(0);

    this.statusText = null;

    // Screen edge vignette for urgency
    this.vignette = scene.add.graphics().setDepth(90).setScrollFactor(0);
  }

  update() {
    const val = Math.round(this.meter.value);
    if (val === this._prevValue) return;
    this._prevValue = val;

    const n = this.meter.getNormalized(); // -1 to 1
    const pipY = this.midY - n * (this.barH / 2);

    // Fill bar
    this.fill.clear();
    if (n > 0) {
      const h = n * (this.barH / 2);
      this.fill.fillStyle(0x2196f3, 0.6);
      this.fill.fillRect(this.barX + 2, this.midY - h, this.barW - 4, h);
      // Bright cap line
      this.fill.fillStyle(0x64b5f6, 0.9);
      this.fill.fillRect(this.barX + 2, this.midY - h, this.barW - 4, 2);
    } else if (n < 0) {
      const h = -n * (this.barH / 2);
      this.fill.fillStyle(0xf44336, 0.6);
      this.fill.fillRect(this.barX + 2, this.midY, this.barW - 4, h);
      // Bright cap line
      this.fill.fillStyle(0xef5350, 0.9);
      this.fill.fillRect(this.barX + 2, this.midY + h - 2, this.barW - 4, 2);
    }

    // Position pip (triangle arrow + line)
    this.pip.clear();
    const pc = n > 0.05 ? 0x42a5f5 : n < -0.05 ? 0xef5350 : 0xffffff;
    this.pip.fillStyle(pc, 1);
    this.pip.fillTriangle(
      this.barX - 7, pipY,
      this.barX - 1, pipY - 5,
      this.barX - 1, pipY + 5
    );
    this.pip.lineStyle(2, pc, 0.8);
    this.pip.lineBetween(this.barX, pipY, this.barX + this.barW, pipY);

    // Value text — follows pip but clamped
    const textColor = n > 0.05 ? '#42a5f5' : n < -0.05 ? '#ef5350' : '#ffffff';
    this.valueText.setText(String(val)).setColor(textColor);
    this.valueText.y = Math.max(this.barTop + 15, Math.min(this.barBot - 15, pipY - 20));

    // (status text removed for cleaner look)

    // Vignette urgency effects
    this.vignette.clear();
    if (n < -0.5) {
      const a = Math.min(0.2, (-n - 0.5) * 0.4);
      this.vignette.fillStyle(0xff0000, a);
      this.vignette.fillRect(0, 68, 6, 1375);
      this.vignette.fillRect(1914, 68, 6, 1375);
      this.vignette.fillRect(0, 68, 1920, 4);
      this.vignette.fillRect(0, 1439, 1920, 4);
    } else if (n > 0.7) {
      const a = Math.min(0.1, (n - 0.7) * 0.33);
      this.vignette.fillStyle(0x2196f3, a);
      this.vignette.fillRect(0, 68, 4, 1375);
      this.vignette.fillRect(1916, 68, 4, 1375);
    }
  }
}
