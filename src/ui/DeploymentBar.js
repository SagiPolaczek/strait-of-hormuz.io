import { COALITION_UNITS } from '../config/units.js';

export class DeploymentBar {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.selectedUnit = null;
    this.buttons = [];

    const DEPTH_BG = 100;
    const DEPTH_CARD = 101;
    const DEPTH_CONTENT = 102;
    const DEPTH_OVERLAY = 103;

    const barH = 110;
    const barY = 1539 - barH / 2;
    const barTop = 1539 - barH;

    // ── Bar background panel ──
    const bg = scene.add.graphics().setDepth(DEPTH_BG).setScrollFactor(0);
    bg.fillStyle(0x0a0e14, 0.92);
    bg.fillRect(0, barTop, 1920, barH);
    // Top border accent
    bg.fillStyle(0x33ff66, 0.25);
    bg.fillRect(0, barTop, 1920, 1);
    // Scan-line overlay
    for (let y = barTop + 2; y < 1539; y += 3) {
      bg.fillStyle(0x000000, 0.06);
      bg.fillRect(0, y, 1920, 1);
    }
    this.bg = bg;

    // ── Section label ──
    scene.add.text(40, barTop + 8, 'TACTICAL DEPLOYMENT', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
      letterSpacing: 2,
    }).setDepth(DEPTH_CONTENT).setScrollFactor(0).setAlpha(0.5);

    // ── Unit cards ──
    const unitList = Object.values(COALITION_UNITS);
    const cardW = 220;
    const cardH = 70;
    const gap = 16;
    const totalW = unitList.length * cardW + (unitList.length - 1) * gap;
    const startX = 960 - totalW / 2 + cardW / 2;

    unitList.forEach((unit, i) => {
      const cx = startX + i * (cardW + gap);
      const cy = barY;
      const keyNum = i + 1;

      // Card background graphics
      const cardBg = scene.add.graphics().setDepth(DEPTH_CARD).setScrollFactor(0);
      this._drawCard(cardBg, cx, cy, cardW, cardH, false, false);

      // Invisible hit area for interaction
      const hitArea = scene.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0)
        .setDepth(DEPTH_OVERLAY + 1).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      // Keyboard shortcut badge (top-left of card)
      const keyBadge = scene.add.text(cx - cardW / 2 + 6, cy - cardH / 2 + 4, String(keyNum), {
        fontSize: '16px',
        fontFamily: '"Orbitron", sans-serif',
        fontStyle: 'bold',
        color: '#33ff66',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 5, y: 2 },
      }).setDepth(DEPTH_CONTENT).setScrollFactor(0).setAlpha(0.8);

      // Icon
      const icon = scene.add.text(cx - cardW / 2 + 32, cy - 2, unit.icon, {
        fontSize: '36px',
      }).setOrigin(0.5).setDepth(DEPTH_CONTENT).setScrollFactor(0);

      // Icon glow ring (visible when selected)
      const iconGlow = scene.add.graphics().setDepth(DEPTH_CARD + 0.5).setScrollFactor(0);
      iconGlow.setAlpha(0);

      // Unit name
      const name = scene.add.text(cx - cardW / 2 + 58, cy - 18, unit.name.toUpperCase(), {
        fontSize: '18px',
        fontFamily: '"Black Ops One", cursive',
        color: '#e0e0e0',
      }).setDepth(DEPTH_CONTENT).setScrollFactor(0);

      // Cost display (fuel gauge style)
      const costBarBg = scene.add.graphics().setDepth(DEPTH_CARD + 0.5).setScrollFactor(0);
      const costBarX = cx - cardW / 2 + 58;
      const costBarY = cy + 4;
      const costBarW = 90;
      const costBarH = 10;
      costBarBg.fillStyle(0x1a1a1a, 0.9);
      costBarBg.fillRoundedRect(costBarX, costBarY, costBarW, costBarH, 2);
      costBarBg.lineStyle(1, 0xffb300, 0.25);
      costBarBg.strokeRoundedRect(costBarX, costBarY, costBarW, costBarH, 2);

      const costBarFill = scene.add.graphics().setDepth(DEPTH_CARD + 0.6).setScrollFactor(0);

      const costText = scene.add.text(costBarX + costBarW + 8, costBarY - 1, `${unit.cost}`, {
        fontSize: '16px',
        fontFamily: '"Orbitron", sans-serif',
        color: '#ffb300',
      }).setDepth(DEPTH_CONTENT).setScrollFactor(0);

      // "DEPLOYING" label (only shown when selected)
      const deployLabel = scene.add.text(cx + cardW / 2 - 6, cy - cardH / 2 + 4, 'DEPLOYING', {
        fontSize: '14px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#00e676',
        fontStyle: 'bold',
      }).setOrigin(1, 0).setDepth(DEPTH_CONTENT).setScrollFactor(0).setAlpha(0);

      // "LOCKED" overlay (shown when can't afford)
      const lockedOverlay = scene.add.graphics().setDepth(DEPTH_OVERLAY).setScrollFactor(0);
      lockedOverlay.setAlpha(0);

      const lockedText = scene.add.text(cx, cy, 'INSUFFICIENT FUEL', {
        fontSize: '18px',
        fontFamily: '"Black Ops One", cursive',
        color: '#ef5350',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(DEPTH_OVERLAY + 0.5).setScrollFactor(0).setAlpha(0);

      // ── Interactions ──
      hitArea.on('pointerover', () => {
        if (this.economy.canAfford('coalition', unit.cost)) {
          scene.tweens.add({
            targets: [icon],
            scaleX: 1.15, scaleY: 1.15,
            duration: 120,
            ease: 'Back.easeOut',
          });
        }
      });
      hitArea.on('pointerout', () => {
        scene.tweens.add({
          targets: [icon],
          scaleX: 1, scaleY: 1,
          duration: 120,
        });
      });
      hitArea.on('pointerdown', () => this.selectUnit(unit, i));

      // Keyboard shortcut
      scene.input.keyboard.on(`keydown-${keyNum}`, () => {
        this.selectUnit(unit, i);
      });

      this.buttons.push({
        cardBg, hitArea, icon, iconGlow, name, costBarBg, costBarFill,
        costText, keyBadge, deployLabel, lockedOverlay, lockedText, unit,
        cx, cy, cardW, cardH,
        costBarX, costBarY, costBarW, costBarH,
      });
    });

    // ── Status text (right side) ──
    this.statusText = scene.add.text(1880, barY, 'SELECT UNIT TO DEPLOY', {
      fontSize: '16px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666',
    }).setOrigin(1, 0.5).setDepth(DEPTH_CONTENT).setScrollFactor(0);
  }

  _drawCard(gfx, cx, cy, w, h, selected, locked) {
    gfx.clear();
    const x = cx - w / 2;
    const y = cy - h / 2;

    if (locked) {
      // Dark locked card
      gfx.fillStyle(0x0a0a0a, 0.7);
      gfx.fillRoundedRect(x, y, w, h, 4);
      gfx.lineStyle(1, 0x333333, 0.4);
      gfx.strokeRoundedRect(x, y, w, h, 4);
    } else if (selected) {
      // Selected state: bright border + subtle inner glow
      gfx.fillStyle(0x0d2818, 0.9);
      gfx.fillRoundedRect(x, y, w, h, 4);
      gfx.lineStyle(2, 0x00e676, 0.9);
      gfx.strokeRoundedRect(x, y, w, h, 4);
      // Inner glow line top
      gfx.fillStyle(0x00e676, 0.1);
      gfx.fillRoundedRect(x + 1, y + 1, w - 2, h - 2, 3);
    } else {
      // Normal state
      gfx.fillStyle(0x141c24, 0.85);
      gfx.fillRoundedRect(x, y, w, h, 4);
      gfx.lineStyle(1, 0x33ff66, 0.2);
      gfx.strokeRoundedRect(x, y, w, h, 4);
    }
  }

  selectUnit(unit, index) {
    // Deselect all first
    this.buttons.forEach((b, bi) => {
      this._drawCard(b.cardBg, b.cx, b.cy, b.cardW, b.cardH, false, false);
      b.deployLabel.setAlpha(0);
      b.iconGlow.setAlpha(0);
    });

    if (this.selectedUnit === unit) {
      this.selectedUnit = null;
      this.statusText.setText('SELECT UNIT TO DEPLOY').setColor('#666666');
      if (this.scene.upgradePanel) this.scene.upgradePanel.deselect();
      return;
    }

    if (unit.unlockTime && !this.scene.advancedUnlocked) {
      return; // Still locked
    }

    if (!this.economy.canAfford('coalition', unit.cost)) {
      return;
    }

    this.selectedUnit = unit;
    const btn = this.buttons[index];

    // Draw selected card
    this._drawCard(btn.cardBg, btn.cx, btn.cy, btn.cardW, btn.cardH, true, false);

    // Show DEPLOYING label with animation
    btn.deployLabel.setAlpha(1);
    this.scene.tweens.add({
      targets: btn.deployLabel,
      alpha: { from: 0, to: 1 },
      duration: 200,
    });

    // Icon glow ring
    btn.iconGlow.clear();
    btn.iconGlow.fillStyle(0x00e676, 0.15);
    btn.iconGlow.fillCircle(btn.cx - btn.cardW / 2 + 32, btn.cy - 2, 20);
    btn.iconGlow.setAlpha(1);

    // Pulse the icon glow (kill any existing tween first)
    this.scene.tweens.killTweensOf(btn.iconGlow);
    this.scene.tweens.add({
      targets: btn.iconGlow,
      alpha: { from: 0.8, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.statusText.setText(`DEPLOYING: ${unit.name.toUpperCase()}`).setColor('#00e676');

    // Show upgrade preview for this unit type
    if (this.scene.upgradePanel) this.scene.upgradePanel.showPreview(unit);
  }

  getSelectedUnit() {
    return this.selectedUnit;
  }

  clearSelection() {
    this.selectedUnit = null;
    this.buttons.forEach(b => {
      this._drawCard(b.cardBg, b.cx, b.cy, b.cardW, b.cardH, false, false);
      b.deployLabel.setAlpha(0);
      b.iconGlow.setAlpha(0);
      this.scene.tweens.killTweensOf(b.iconGlow);
    });
    this.statusText.setText('SELECT UNIT TO DEPLOY').setColor('#666666');
    if (this.scene.upgradePanel) this.scene.upgradePanel.deselect();
  }

  update() {
    const oil = Math.floor(this.economy.coalitionOil);

    this.buttons.forEach((b) => {
      const isLocked = b.unit.unlockTime && !this.scene.advancedUnlocked;
      const canAfford = !isLocked && this.economy.canAfford('coalition', b.unit.cost);
      const isSelected = this.selectedUnit === b.unit;

      // Only redraw card/overlay when state changes (not every frame)
      const stateKey = `${canAfford}|${isSelected}|${isLocked}`;
      if (stateKey !== b._prevState) {
        b._prevState = stateKey;

        if (isLocked) {
          this._drawCard(b.cardBg, b.cx, b.cy, b.cardW, b.cardH, false, true);
          b.icon.setAlpha(0.2);
          b.name.setAlpha(0.2);
          b.costText.setColor('#666666');
          b.keyBadge.setAlpha(0.1);
          b.lockedOverlay.clear();
          b.lockedOverlay.fillStyle(0x000000, 0.5);
          b.lockedOverlay.fillRoundedRect(
            b.cx - b.cardW / 2, b.cy - b.cardH / 2, b.cardW, b.cardH, 4
          );
          b.lockedOverlay.setAlpha(1);
          const unlockSec = Math.floor((b.unit.unlockTime || 180000) / 1000);
          const unlockMin = Math.floor(unlockSec / 60);
          const unlockS = String(unlockSec % 60).padStart(2, '0');
          b.lockedText.setText(`🔒 UNLOCKS ${unlockMin}:${unlockS}`);
          b.lockedText.setAlpha(1);
        } else if (!canAfford && !isSelected) {
          this._drawCard(b.cardBg, b.cx, b.cy, b.cardW, b.cardH, false, true);
          b.icon.setAlpha(0.3);
          b.name.setAlpha(0.3);
          b.costText.setColor('#ef5350');
          b.keyBadge.setAlpha(0.4);
          b.lockedOverlay.clear();
          b.lockedOverlay.fillStyle(0x000000, 0.4);
          b.lockedOverlay.fillRoundedRect(
            b.cx - b.cardW / 2, b.cy - b.cardH / 2, b.cardW, b.cardH, 4
          );
          b.lockedOverlay.setAlpha(1);
          b.lockedText.setText('INSUFFICIENT FUEL');
          b.lockedText.setAlpha(1);
        } else {
          if (!isSelected) {
            this._drawCard(b.cardBg, b.cx, b.cy, b.cardW, b.cardH, false, false);
          }
          b.icon.setAlpha(1);
          b.name.setAlpha(1);
          b.costText.setColor('#ffb300');
          b.keyBadge.setAlpha(0.8);
          b.lockedOverlay.clear();
          b.lockedOverlay.setAlpha(0);
          b.lockedText.setAlpha(0);
        }
      }

      // Cost bar fill — only update when oil changes
      if (oil !== b._prevOil) {
        b._prevOil = oil;
        b.costBarFill.clear();
        const fillPct = Math.min(oil / b.unit.cost, 1);
        if (fillPct > 0) {
          const fw = (b.costBarW - 4) * fillPct;
          const fillColor = canAfford ? 0xffb300 : 0xef5350;
          b.costBarFill.fillStyle(fillColor, 0.7);
          b.costBarFill.fillRoundedRect(b.costBarX + 2, b.costBarY + 2, fw, b.costBarH - 4, 1);
        }
      }
    });
  }
}
