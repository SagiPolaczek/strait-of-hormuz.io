import { COALITION_UNITS } from '../config/units.js';

export class DeploymentBar {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.selectedUnit = null;
    this.buttons = [];

    const barY = 1539 - 35;
    const barHeight = 70;

    // Bottom bar background
    this.bg = scene.add.rectangle(960, barY, 1920, barHeight, 0x000000, 0.85)
      .setDepth(100).setScrollFactor(0);

    const unitList = Object.values(COALITION_UNITS);
    const startX = 960 - (unitList.length * 130) / 2 + 65;

    unitList.forEach((unit, i) => {
      const x = startX + i * 130;
      const y = barY;

      const bg = scene.add.rectangle(x, y, 120, 56, 0x333333, 0.8)
        .setStrokeStyle(2, 0x555555).setDepth(101).setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      const icon = scene.add.text(x - 40, y - 12, unit.icon, { fontSize: '22px' })
        .setDepth(102).setScrollFactor(0);
      const name = scene.add.text(x - 10, y - 14, unit.name, {
        fontSize: '11px', color: '#ccc', fontFamily: 'Arial',
      }).setDepth(102).setScrollFactor(0);
      const cost = scene.add.text(x - 10, y + 4, `${unit.cost} oil`, {
        fontSize: '12px', color: '#FFD54F', fontFamily: 'Arial',
      }).setDepth(102).setScrollFactor(0);

      bg.on('pointerdown', () => this.selectUnit(unit, bg));

      this.buttons.push({ bg, icon, name, cost, unit });
    });
  }

  selectUnit(unit, bg) {
    this.buttons.forEach(b => b.bg.setStrokeStyle(2, 0x555555));

    if (this.selectedUnit === unit) {
      this.selectedUnit = null;
      return;
    }

    this.selectedUnit = unit;
    bg.setStrokeStyle(2, 0x42a5f5);
  }

  getSelectedUnit() {
    return this.selectedUnit;
  }

  clearSelection() {
    this.selectedUnit = null;
    this.buttons.forEach(b => b.bg.setStrokeStyle(2, 0x555555));
  }

  update() {
    this.buttons.forEach(({ bg, unit }) => {
      const canAfford = this.economy.canAfford('coalition', unit.cost);
      bg.setAlpha(canAfford ? 1 : 0.4);
    });
  }
}
