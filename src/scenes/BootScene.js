import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Loading bar
    const bar = this.add.rectangle(960, 770, 400, 20, 0x333333);
    const fill = this.add.rectangle(760, 770, 0, 16, 0x42a5f5);
    this.load.on('progress', (val) => {
      fill.width = 396 * val;
      fill.x = 760 + fill.width / 2;
    });

    this.load.image('map', 'assets/strait.jpg');
  }

  create() {
    this.scene.start('Game');
  }
}
