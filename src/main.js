import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1539;

const config = {
  type: Phaser.CANVAS,  // Canvas is more stable for graphics-heavy 2D (avoids WebGL context loss)
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
