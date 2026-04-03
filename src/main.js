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

const RANDOM_CALLSIGNS = [
  'OIL-DADDY', 'BARNACLE', 'SGT-SPLASH', 'TORPEDO-TIM',
  'ADM-CHONK', 'OILY-BOI', 'WHALE-FAIL', 'CAPT-NEMO',
  'SALTY-DOG', 'LT-CHUNGUS', 'MAJ-SNOOZE', 'GEN-PANIC',
  'THE-KRAKEN', 'BIG-ANCHOR', 'CPL-WAVES', 'DEEP-FRYER',
  'PVT-BEACH', 'SGT-BILGE', 'COL-PANIC', 'FOGHORN',
  'SHARKBAIT', 'BOAT-FACE', 'SEA-BISCUIT', 'FISH-STICK',
  'BUOY-BOY', 'CPT-CRUNCH', 'FLOTSAM', 'IRON-LUNG',
  'NARWHAL', 'TOP-PRAWN', 'REEF-CHIEF', 'HULL-SMASH',
];

function showCallsignPrompt(onComplete) {
  const modal = document.getElementById('callsign-modal');
  const input = document.getElementById('callsign-input');
  const btn = document.getElementById('callsign-submit');
  const randomBtn = document.getElementById('callsign-random');
  const inputWrap = input.closest('.cs-input-wrap');
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
    const val = input.value.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase().slice(0, 16);
    input.value = val;
    btn.disabled = val.length < 3;
    resize();
  };

  const cleanup = () => {
    input.removeEventListener('input', validate);
    input.removeEventListener('keydown', onKeydown);
    btn.removeEventListener('click', submit);
    randomBtn.removeEventListener('click', onRandom);
    if (inputWrap) inputWrap.removeEventListener('click', onWrapClick);
    sizer.remove();
  };

  const submit = () => {
    const callsign = input.value.trim().toUpperCase();
    if (callsign.length < 3) return;
    localStorage.setItem('hormuz_callsign', callsign);
    modal.style.display = 'none';
    cleanup();
    onComplete();
  };

  const onKeydown = (e) => {
    if (e.key === 'Enter' && !btn.disabled) submit();
  };

  // Typewriter effect for random callsign
  let typeTimer = null;
  const onRandom = () => {
    if (typeTimer) clearInterval(typeTimer);
    const name = RANDOM_CALLSIGNS[Math.floor(Math.random() * RANDOM_CALLSIGNS.length)];
    input.value = '';
    let i = 0;
    typeTimer = setInterval(() => {
      if (i < name.length) {
        input.value += name[i];
        validate();
        i++;
      } else {
        clearInterval(typeTimer);
        typeTimer = null;
      }
    }, 45);
    input.focus();
  };

  // Tap the input area to focus (fixes mobile 1px hit zone)
  const onWrapClick = () => input.focus();

  input.addEventListener('input', validate);
  input.addEventListener('keydown', onKeydown);
  btn.addEventListener('click', submit);
  randomBtn.addEventListener('click', onRandom);
  if (inputWrap) inputWrap.addEventListener('click', onWrapClick);

  // Auto-focus (brief delay for fonts)
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
