export class HUD {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.startTime = Date.now();

    const DEPTH_BG = 100;
    const DEPTH_PANEL = 101;
    const DEPTH_TEXT = 102;
    const DEPTH_GLOW = 103;

    const panelH = 82;
    const panelY = panelH / 2;

    // ── Main bar background (dark translucent) ──
    this.bg = scene.add.graphics().setDepth(DEPTH_BG).setScrollFactor(0);
    this.bg.fillStyle(0x0a0e14, 0.88);
    this.bg.fillRect(0, 0, 1920, panelH);
    // Top accent line (amber glow)
    this.bg.fillStyle(0xffb300, 0.6);
    this.bg.fillRect(0, 0, 1920, 1);
    // Bottom border line
    this.bg.fillStyle(0x33ff66, 0.25);
    this.bg.fillRect(0, panelH - 1, 1920, 1);
    // Scan-line overlay
    for (let y = 2; y < panelH; y += 3) {
      this.bg.fillStyle(0x000000, 0.08);
      this.bg.fillRect(0, y, 1920, 1);
    }

    // ── Corner decoration marks ──
    const cornerGfx = scene.add.graphics().setDepth(DEPTH_PANEL).setScrollFactor(0);
    cornerGfx.lineStyle(1, 0x33ff66, 0.5);
    // Top-left corner bracket
    cornerGfx.moveTo(0, 16); cornerGfx.lineTo(0, 0); cornerGfx.lineTo(16, 0); cornerGfx.strokePath();
    cornerGfx.beginPath();
    // Top-right corner bracket
    cornerGfx.moveTo(1904, 0); cornerGfx.lineTo(1920, 0); cornerGfx.lineTo(1920, 16); cornerGfx.strokePath();

    // ── Divider lines between sections ──
    const dividers = scene.add.graphics().setDepth(DEPTH_PANEL).setScrollFactor(0);
    dividers.lineStyle(1, 0x33ff66, 0.15);
    [490, 810, 1180, 1540].forEach(dx => {
      dividers.moveTo(dx, 6);
      dividers.lineTo(dx, panelH - 6);
    });
    dividers.strokePath();

    // ── CLASSIFICATION LABEL ──
    this.classLabel = scene.add.text(16, panelY, 'CENTCOM // LIVE', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
      letterSpacing: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTH_TEXT).setScrollFactor(0).setAlpha(0.5);

    // ── CALLSIGN ──
    const callsign = localStorage.getItem('hormuz_callsign') || 'UNKNOWN';
    this.callsignText = scene.add.text(16, panelY + 22, `ADM. ${callsign}`, {
      fontSize: '11px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffb300',
      letterSpacing: 1,
    }).setOrigin(0, 0.5).setDepth(DEPTH_TEXT).setScrollFactor(0).setAlpha(0.7);

    // ── OIL SECTION (x: 180–420) ──
    this.oilLabel = scene.add.text(185, 10, 'FUEL RESERVES', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffb300',
      letterSpacing: 1,
    }).setDepth(DEPTH_TEXT).setScrollFactor(0).setAlpha(1);

    // Oil bar background
    this.oilBarBg = scene.add.graphics().setDepth(DEPTH_PANEL).setScrollFactor(0);
    this.oilBarBg.fillStyle(0x1a1a1a, 0.9);
    this.oilBarBg.fillRoundedRect(185, 30, 180, 14, 2);
    this.oilBarBg.lineStyle(1, 0xffb300, 0.3);
    this.oilBarBg.strokeRoundedRect(185, 30, 180, 14, 2);

    // Oil bar fill (will be updated)
    this.oilBarFill = scene.add.graphics().setDepth(DEPTH_PANEL + 0.5).setScrollFactor(0);

    this.oilText = scene.add.text(374, 8, '0', {
      fontSize: '36px',
      fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold',
      color: '#ffb300',
    }).setDepth(DEPTH_TEXT).setScrollFactor(0);


    // ── MISSION CLOCK (x: 820–1160) ──
    this.timerLabel = scene.add.text(830, 10, 'MISSION CLOCK', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#90CAF9',
      letterSpacing: 1,
    }).setDepth(DEPTH_TEXT).setScrollFactor(0).setAlpha(1);

    this.timerText = scene.add.text(830, 28, '00:00', {
      fontSize: '40px',
      fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold',
      color: '#90CAF9',
    }).setDepth(DEPTH_TEXT).setScrollFactor(0);

    // ── THREAT LEVEL (x: 1200–1530) ──
    this.threatLabel = scene.add.text(1200, 10, 'THREAT LEVEL', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ef5350',
      letterSpacing: 1,
    }).setDepth(DEPTH_TEXT).setScrollFactor(0).setAlpha(1);

    this.threatText = scene.add.text(1200, 28, 'LOW', {
      fontSize: '36px',
      fontFamily: '"Black Ops One", cursive',
      color: '#4CAF50',
    }).setDepth(DEPTH_TEXT).setScrollFactor(0);

    // Threat pulsing indicator dot
    this.threatDot = scene.add.graphics().setDepth(DEPTH_GLOW).setScrollFactor(0);
    this.threatDotGlow = scene.add.graphics().setDepth(DEPTH_PANEL).setScrollFactor(0);

    // ── LIVE INDICATOR (top-right area) ──
    this.liveText = scene.add.text(1860, panelY, 'LIVE', {
      fontSize: '18px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ef5350',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(DEPTH_TEXT).setScrollFactor(0);

    this.liveDot = scene.add.circle(1874, panelY, 5, 0xef5350)
      .setDepth(DEPTH_GLOW).setScrollFactor(0);

    // Pulsing animation for LIVE dot
    scene.tweens.add({
      targets: this.liveDot,
      alpha: { from: 1, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Pulsing animation for LIVE text
    scene.tweens.add({
      targets: this.liveText,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // ── Coordinates display (bottom-right corner vibe) ──
    this.coordText = scene.add.text(1550, panelY, '26.5667N  56.2500E', {
      fontSize: '15px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
    }).setOrigin(0, 0.5).setDepth(DEPTH_TEXT).setScrollFactor(0).setAlpha(1);

    // ── Settings gear button ──
    this.gearBtn = scene.add.text(1740, panelY, '⚙', {
      fontSize: '40px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
    }).setOrigin(0.5).setDepth(DEPTH_GLOW).setScrollFactor(0)
      .setInteractive({ useHandCursor: true }).setAlpha(0.75);

    this.gearBtn.on('pointerover', () => this.gearBtn.setAlpha(1));
    this.gearBtn.on('pointerout', () => this.gearBtn.setAlpha(0.75));
    this.gearBtn.on('pointerdown', () => {
      if (this._onSettingsClick) this._onSettingsClick();
    });

    // Pause time tracking
    this._pauseStart = 0;
    this._totalPauseMs = 0;

    // Track previous threat for pulse animation
    this._prevThreat = null;
  }

  /** Call when game pauses — records the pause start time. */
  onPause() {
    this._pauseStart = Date.now();
  }

  /** Call when game resumes — accumulates pause duration so clock stays accurate. */
  onResume() {
    if (this._pauseStart > 0) {
      this._totalPauseMs += Date.now() - this._pauseStart;
      this._pauseStart = 0;
    }
  }

  update(score) {
    const elapsed = Math.floor((Date.now() - this.startTime - this._totalPauseMs) / 1000);
    const oil = Math.floor(this.economy.coalitionOil);
    const rigs = this.economy.coalitionRigs.length;

    // Only update text when values change (avoid per-frame setText calls)
    if (oil !== this._prevOil) {
      // Arrival dots near counter when oil increases (from rig auto-collect)
      if (this._prevOil !== undefined && oil > this._prevOil && rigs > 0) {
        this._spawnArrivalDot();
      }
      this._prevOil = oil;
      this.oilText.setText(String(oil).padStart(4, ' '));

      // Oil bar fill — only redraw when oil changes
      const maxOil = 5000;
      const fillPct = Math.min(oil / maxOil, 1);
      this.oilBarFill.clear();
      if (fillPct > 0) {
        const barW = 176 * fillPct;
        const fillColor = fillPct > 0.3 ? 0xffb300 : fillPct > 0.15 ? 0xff8f00 : 0xef5350;
        this.oilBarFill.fillStyle(fillColor, 0.85);
        this.oilBarFill.fillRoundedRect(187, 32, barW, 10, 1);
        this.oilBarFill.fillStyle(0xffffff, 0.15);
        this.oilBarFill.fillRect(187, 32, barW, 2);
      }
    }

    if (rigs !== this._prevRigs) {
      this._prevRigs = rigs;
    }

    if (score !== this._prevScore) {
      this._prevScore = score;
    }

    // Timer — only update when second changes
    if (elapsed !== this._prevElapsed) {
      this._prevElapsed = elapsed;
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      this.timerText.setText(`${minutes}:${seconds}`);
      this.timerText.setAlpha(elapsed % 2 === 0 ? 1 : 0.85);

      // Threat level — only changes based on elapsed time
      const threat = elapsed < 120 ? 'LOW' : elapsed < 300 ? 'MEDIUM' : elapsed < 600 ? 'HIGH' : 'EXTREME';
      if (threat !== this._prevThreat) {
        const threatColors = {
          LOW: { text: '#4CAF50', dot: 0x4CAF50 },
          MEDIUM: { text: '#FFD54F', dot: 0xFFD54F },
          HIGH: { text: '#ef5350', dot: 0xef5350 },
          EXTREME: { text: '#ff1744', dot: 0xff1744 },
        };
        const tc = threatColors[threat];
        this.threatText.setText(threat).setColor(tc.text);

        // Redraw threat dots (only on threat change)
        this.threatDot.clear();
        this.threatDot.fillStyle(tc.dot, 0.9);
        this.threatDot.fillCircle(1190, 32, 4);
        this.threatDotGlow.clear();
        this.threatDotGlow.fillStyle(tc.dot, 0.2);
        this.threatDotGlow.fillCircle(1190, 32, 8);

        if (this._prevThreat !== null) {
          this.scene.tweens.add({
            targets: this.threatText,
            scaleX: { from: 1.3, to: 1 },
            scaleY: { from: 1.3, to: 1 },
            duration: 400,
            ease: 'Back.easeOut',
          });
        }
        this._prevThreat = threat;
      }
    }

    // Threat dot glow pulse — lightweight alpha change only (no graphics redraw)
    const threat = this._prevThreat || 'LOW';
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / (threat === 'EXTREME' ? 150 : threat === 'HIGH' ? 300 : 600));
    this.threatDotGlow.setAlpha(pulse);
  }

  _spawnArrivalDot() {
    if (!this.scene || Math.random() > 0.4) return; // throttle: ~60% of ticks
    const dot = this.scene.add.circle(
      374 + Math.random() * 30,
      42 + Math.random() * 10,
      2.5,
      0xFFD54F,
      0
    ).setDepth(104).setScrollFactor(0);

    // Fade in from below, drift up into the counter, fade out
    this.scene.tweens.add({
      targets: dot,
      alpha: { from: 0, to: 0.8 },
      y: dot.y - 12 - Math.random() * 8,
      scale: { from: 1.2, to: 0.3 },
      duration: 400 + Math.random() * 200,
      ease: 'Quad.easeIn',
      onComplete: () => dot.destroy(),
    });
  }

  getTimeString() {
    const elapsed = Math.floor((Date.now() - this.startTime - this._totalPauseMs) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = String(elapsed % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
