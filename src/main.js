import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { isMobile, toggleFullscreen, isFullscreen } from './utils/mobile.js';

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1539;

const config = {
  type: Phaser.CANVAS,
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  parent: 'game-wrapper',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
};

function startGame() {
  new Phaser.Game(config);
}

function showCallsignPrompt(onComplete) {
  const modal = document.getElementById('callsign-modal');
  const input = document.getElementById('callsign-input');
  const btn = document.getElementById('callsign-submit');
  modal.style.display = 'flex';

  // Auto-size input to content
  const sizer = document.createElement('span');
  sizer.style.cssText = 'position:absolute;visibility:hidden;font:28px "Share Tech Mono",monospace;letter-spacing:4px;';
  document.body.appendChild(sizer);

  const resize = () => {
    sizer.textContent = input.value || '';
    input.style.width = Math.max(1, sizer.offsetWidth) + 'px';
  };

  const validate = () => {
    const val = input.value.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
    input.value = val;
    btn.disabled = val.length < 3;
    resize();
  };

  input.addEventListener('input', validate);

  const submit = () => {
    const callsign = input.value.trim().toUpperCase();
    if (callsign.length < 3) return;
    localStorage.setItem('hormuz_callsign', callsign);
    modal.style.display = 'none';
    sizer.remove();
    onComplete();
  };

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btn.disabled) submit();
  });

  // Auto-focus after a brief delay (allows fonts to load)
  setTimeout(() => input.focus(), 100);
}

// ── Mobile setup ──
if (isMobile) {
  document.body.classList.add('mobile');

  // Prevent long-press context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Fullscreen button
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      toggleFullscreen();
    });
    const updateFsLabel = () => {
      fsBtn.textContent = isFullscreen() ? '⤡ EXIT FS' : '⤢ FULLSCREEN';
    };
    document.addEventListener('fullscreenchange', updateFsLabel);
    document.addEventListener('webkitfullscreenchange', updateFsLabel);
  }

  // Rotate overlay — show in portrait
  const rotateOverlay = document.getElementById('rotate-overlay');
  function checkOrientation() {
    if (!rotateOverlay) return;
    const portrait = window.innerHeight > window.innerWidth * 1.1;
    rotateOverlay.style.display = portrait ? 'flex' : 'none';
  }
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 150));
  checkOrientation();
}

// Check for existing callsign
const existingCallsign = localStorage.getItem('hormuz_callsign');
if (existingCallsign) {
  startGame();
} else {
  showCallsignPrompt(startGame);
}
