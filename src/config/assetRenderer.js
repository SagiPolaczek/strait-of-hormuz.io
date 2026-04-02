// src/config/assetRenderer.js

/**
 * Pre-renders all game entity sprites to Phaser textures at boot time.
 * Each texture is drawn on an offscreen canvas at 2x resolution,
 * then registered via scene.textures.addCanvas().
 */

function createTexture(scene, key, w, h, drawFn) {
  if (scene.textures.exists(key)) return;
  const c = scene.textures.createCanvas(key, w, h);
  const ctx = c.getContext();
  drawFn(ctx, w, h);
  c.refresh();
}

// ── DESTROYER (Plated Hull — gradient shading, plate lines, radar mast) ──
function drawDestroyerHull(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Gradient hull
  const hg = ctx.createLinearGradient(cx, cy - 9, cx, cy + 9);
  hg.addColorStop(0, '#78909c');
  hg.addColorStop(0.5, '#607d8b');
  hg.addColorStop(1, '#455a64');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy);
  ctx.lineTo(cx + 20, cy - 8);
  ctx.lineTo(cx - 15, cy - 9);
  ctx.lineTo(cx - 25, cy - 6);
  ctx.lineTo(cx - 25, cy + 6);
  ctx.lineTo(cx - 15, cy + 9);
  ctx.lineTo(cx + 20, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Hull plate lines
  ctx.strokeStyle = 'rgba(144,164,174,0.3)';
  ctx.lineWidth = 0.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + i * 4);
    ctx.lineTo(cx + 26, cy + i * 4);
    ctx.stroke();
  }
  // Waterline
  ctx.strokeStyle = '#37474f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 2);
  ctx.lineTo(cx + 28, cy + 2);
  ctx.stroke();
  // Bridge
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(cx - 8, cy - 13, 16, 8);
  ctx.fillStyle = '#90caf9';
  ctx.fillRect(cx - 6, cy - 12, 3, 3);
  ctx.fillRect(cx - 1, cy - 12, 3, 3);
  ctx.fillRect(cx + 4, cy - 12, 3, 3);
  // Radar mast
  ctx.strokeStyle = '#b0bec5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13);
  ctx.lineTo(cx, cy - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 19);
  ctx.lineTo(cx + 3, cy - 19);
  ctx.stroke();
  // Funnel
  ctx.fillStyle = '#37474f';
  ctx.fillRect(cx + 2, cy - 17, 4, 5);
  ctx.fillStyle = '#ff8a65';
  ctx.fillRect(cx + 2, cy - 17, 4, 1);
  // Blue accent stripe
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 23, cy - 8);
  ctx.lineTo(cx + 18, cy - 8);
  ctx.stroke();
  // Anchor detail at bow
  ctx.fillStyle = '#b0bec5';
  ctx.fillRect(cx - 24, cy - 2, 2, 4);
}

function drawDestroyerTurret(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = '#78909c';
  ctx.beginPath();
  ctx.arc(cx - 4, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#78909c';
  ctx.fillRect(cx - 4, cy - 1.5, 14, 3);
  ctx.fillRect(cx - 4, cy + 0.5, 14, 3);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(cx + 8, cy - 2.5, 3, 5);
}

// ── TANKER (Detailed pixel barge — hull depth, pipe gaps, rudder) ────
function drawTanker(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.imageSmoothingEnabled = false;
  const p = 3;
  const d = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, p, p); };
  // Hull with gradient depth
  for (let x = -10; x <= 10; x++) { d(x, 0, '#90a4ae'); d(x, 1, '#78909c'); d(x, 2, '#546e7a'); d(x, 3, '#455a64'); }
  for (let x = -9; x <= 9; x++) { d(x, -1, '#b0bec5'); }
  d(11, 0, '#90a4ae'); d(11, 1, '#78909c'); d(12, 0, '#b0bec5');
  // Cargo with pipe gaps
  for (let x = -6; x <= 6; x++) {
    if (x === -2 || x === 2) { d(x, -1, '#546e7a'); d(x, -2, '#78909c'); continue; }
    d(x, -1, '#e65100'); d(x, -2, '#ff8f00');
  }
  d(-6, -3, '#ffab00'); d(6, -3, '#ffab00'); // cargo top highlights
  // Bridge
  d(-9, -2, '#546e7a'); d(-8, -2, '#546e7a'); d(-9, -3, '#546e7a'); d(-8, -3, '#90caf9');
  // Rudder at stern
  d(11, 2, '#455a64'); d(11, 3, '#455a64');
  // Deck line
  for (let x = -7; x <= 7; x++) d(x, 0, '#b0bec5');
}

// ── OIL RIG — COALITION (Reinforced: thick legs, cross-braces, edge glow) ──
function drawOilRig(ctx, w, h) {
  const cx = w / 2, cy = h * 0.6;
  // Platform with edge glow
  ctx.shadowColor = '#42a5f5';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#607d8b';
  ctx.fillRect(cx - 22, cy, 44, 7);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 22, cy, 44, 1);
  // Thicker support legs
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 7); ctx.lineTo(cx - 22, cy + 22);
  ctx.moveTo(cx - 6, cy + 7); ctx.lineTo(cx - 9, cy + 22);
  ctx.moveTo(cx + 6, cy + 7); ctx.lineTo(cx + 9, cy + 22);
  ctx.moveTo(cx + 18, cy + 7); ctx.lineTo(cx + 22, cy + 22);
  ctx.stroke();
  // X cross braces between leg pairs
  ctx.strokeStyle = 'rgba(144,164,174,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 17, cy + 10); ctx.lineTo(cx - 8, cy + 18);
  ctx.moveTo(cx - 8, cy + 10); ctx.lineTo(cx - 17, cy + 18);
  ctx.moveTo(cx + 8, cy + 10); ctx.lineTo(cx + 17, cy + 18);
  ctx.moveTo(cx + 17, cy + 10); ctx.lineTo(cx + 8, cy + 18);
  ctx.stroke();
  // Derrick tower
  ctx.strokeStyle = '#b0bec5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - 26);
  ctx.moveTo(cx + 8, cy); ctx.lineTo(cx, cy - 26);
  ctx.stroke();
  // Cross braces on derrick
  for (let i = 1; i <= 3; i++) {
    const bY = cy - i * 6;
    const bW = 8 - i * 1.5;
    ctx.beginPath(); ctx.moveTo(cx - bW, bY); ctx.lineTo(cx + bW, bY); ctx.stroke();
  }
  // Top beacon
  ctx.fillStyle = '#42a5f5';
  ctx.fillRect(cx - 2, cy - 28, 4, 3);
  // Pump arm
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + 10, cy - 2); ctx.lineTo(cx + 24, cy - 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 24, cy - 8, 3, 0, Math.PI * 2); ctx.stroke();
}

// ── OIL RIG — IRGC (Fortified: barriers, flag, dark palette, heavy contrast) ──
function drawOilRigIRGC(ctx, w, h) {
  const cx = w / 2, cy = h * 0.6;
  // Heavy all-around shadow for desert/sand contrast
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  // Dark fortified platform (shadow renders around all edges)
  ctx.fillStyle = '#5c2020';
  ctx.fillRect(cx - 20, cy, 40, 6);
  // Draw legs with shadow still active so they get halos too
  ctx.strokeStyle = '#6b3030';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 6); ctx.lineTo(cx - 20, cy + 20);
  ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx - 8, cy + 20);
  ctx.moveTo(cx + 6, cy + 6); ctx.lineTo(cx + 8, cy + 20);
  ctx.moveTo(cx + 16, cy + 6); ctx.lineTo(cx + 20, cy + 20);
  ctx.stroke();
  // Derrick tower with shadow
  ctx.strokeStyle = '#a06060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - 26);
  ctx.moveTo(cx + 8, cy); ctx.lineTo(cx, cy - 26);
  ctx.stroke();
  // Pump arm with shadow
  ctx.strokeStyle = '#ff6644';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + 10, cy - 2); ctx.lineTo(cx + 22, cy - 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 22, cy - 8, 2.5, 0, Math.PI * 2); ctx.stroke();
  // Turn off shadow for detail work
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  // Dark outline on platform
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 20, cy, 40, 6);
  ctx.strokeStyle = '#ef5350';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 20, cy, 40, 1);
  // Barrier blocks on platform
  ctx.fillStyle = '#4a3030';
  ctx.fillRect(cx - 18, cy - 2, 6, 2);
  ctx.fillRect(cx + 12, cy - 2, 6, 2);
  // Flag pole
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx + 16, cy); ctx.lineTo(cx + 16, cy - 8); ctx.stroke();
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(cx + 16, cy - 8, 6, 3);
  // Re-stroke legs with color on top of shadow
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 6); ctx.lineTo(cx - 20, cy + 20);
  ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx - 8, cy + 20);
  ctx.moveTo(cx + 6, cy + 6); ctx.lineTo(cx + 8, cy + 20);
  ctx.moveTo(cx + 16, cy + 6); ctx.lineTo(cx + 20, cy + 20);
  ctx.stroke();
  ctx.strokeStyle = '#6b3030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 6); ctx.lineTo(cx - 20, cy + 20);
  ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx - 8, cy + 20);
  ctx.moveTo(cx + 6, cy + 6); ctx.lineTo(cx + 8, cy + 20);
  ctx.moveTo(cx + 16, cy + 6); ctx.lineTo(cx + 20, cy + 20);
  ctx.stroke();
  // Derrick cross braces (no shadow needed — tower shadow already drawn)
  ctx.strokeStyle = '#a06060';
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 3; i++) {
    const bY = cy - i * 6;
    const bW = 8 - i * 1.5;
    ctx.beginPath(); ctx.moveTo(cx - bW, bY); ctx.lineTo(cx + bW, bY); ctx.stroke();
  }
  // Glowing red beacon
  ctx.shadowColor = '#ef5350';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(cx - 2, cy - 28, 4, 3);
  ctx.shadowBlur = 0;
}

// ── AIR DEFENSE (Hexagonal base, dual barrel, bright sensor — 1.5× scale) ──
function drawAirDefenseBase(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Outer hexagon
  ctx.fillStyle = '#1a237e';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + i * Math.PI / 3;
    const px = cx + 24 * Math.cos(a), py = cy + 24 * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Inner hexagon
  ctx.fillStyle = '#283593';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + i * Math.PI / 3;
    const px = cx + 17 * Math.cos(a), py = cy + 17 * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Bright center sensor
  ctx.shadowColor = '#82b1ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#42a5f5';
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawAirDefenseGun(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Dual barrel gun
  ctx.fillStyle = '#78909c';
  ctx.fillRect(cx - 4, cy - 24, 3, 20);
  ctx.fillRect(cx + 1, cy - 24, 3, 20);
  ctx.fillRect(cx - 6, cy - 27, 12, 6);
  // Radar arc
  ctx.strokeStyle = '#82b1ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 3, 12, -Math.PI, 0);
  ctx.stroke();
}

// ── MISSILE LAUNCHER (Heavy TEL: wider body, dual rails, armored cab) ──
function drawMissileLauncherBody(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Heavy truck body
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(cx - 22, cy - 5, 34, 14);
  ctx.strokeStyle = '#6d4c41';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 22, cy - 5, 34, 14);
  // Armored cab
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(cx - 26, cy - 3, 6, 12);
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(cx - 25, cy - 1, 4, 3);
  // Three wheels
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(cx - 16, cy + 11, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 8, cy + 11, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy + 11, 3.5, 0, Math.PI * 2); ctx.fill();
}

function drawMissileLauncherRail(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Dual rails
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(cx - w / 2 + 2, cy - 5, w - 4, 3);
  ctx.fillRect(cx - w / 2 + 2, cy + 2, w - 4, 3);
  // Top missile
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(cx + 4, cy - 4.5, 10, 2);
  ctx.fillStyle = '#ff8a65';
  ctx.beginPath();
  ctx.moveTo(cx + 14, cy - 4.5); ctx.lineTo(cx + 18, cy - 3.5); ctx.lineTo(cx + 14, cy - 2.5);
  ctx.fill();
  // Bottom missile
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(cx + 4, cy + 2.5, 10, 2);
  ctx.fillStyle = '#ff8a65';
  ctx.beginPath();
  ctx.moveTo(cx + 14, cy + 2.5); ctx.lineTo(cx + 18, cy + 3.5); ctx.lineTo(cx + 14, cy + 4.5);
  ctx.fill();
}

// ── CRUISE MISSILE (Hot exhaust, longer body, panel line) ────
function drawCruiseMissile(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.imageSmoothingEnabled = false;
  const p = 2;
  const d = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, p, p); };
  // Longer body
  for (let x = -6; x <= 6; x++) d(x, 0, '#cc3333');
  for (let x = -5; x <= 5; x++) { d(x, -1, '#b71c1c'); d(x, 1, '#b71c1c'); }
  // Panel line
  for (let x = -4; x <= 4; x++) d(x, 0, '#a02020');
  // Nose
  d(7, 0, '#ff6600'); d(8, 0, '#ffab00');
  // Fins
  d(-7, -2, '#7f0000'); d(-7, 2, '#7f0000');
  // Hot exhaust trail: white → yellow → orange → red
  d(-7, 0, '#ff4400'); d(-8, 0, '#ff8800'); d(-9, 0, '#ffcc00');
}

// ── EXPLODING UAV (Detailed quad: rotor blades, camera lens, LEDs) ──
function drawUAV(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Central body
  ctx.fillStyle = '#607d8b';
  ctx.fillRect(cx - 5, cy - 5, 10, 10);
  ctx.strokeStyle = '#90a4ae';
  ctx.strokeRect(cx - 5, cy - 5, 10, 10);
  // Camera lens
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#82b1ff';
  ctx.beginPath(); ctx.arc(cx, cy, 1, 0, Math.PI * 2); ctx.fill();
  // Arms + rotors with blade detail and LEDs
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], i) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 5, cy + dy * 5);
    ctx.lineTo(cx + dx * 14, cy + dy * 14);
    ctx.stroke();
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.arc(cx + dx * 14, cy + dy * 14, 4, 0, Math.PI * 2);
    ctx.fill();
    // Rotor blade cross
    ctx.strokeStyle = 'rgba(176,190,197,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + dx * 14 - 4, cy + dy * 14);
    ctx.lineTo(cx + dx * 14 + 4, cy + dy * 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + dx * 14, cy + dy * 14 - 4);
    ctx.lineTo(cx + dx * 14, cy + dy * 14 + 4);
    ctx.stroke();
    // LED indicator (green front, red rear)
    ctx.fillStyle = i < 2 ? '#4CAF50' : '#ef5350';
    ctx.beginPath();
    ctx.arc(cx + dx * 12, cy + dy * 12, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
  });
  // Payload
  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.arc(cx, cy + 6, 3, 0, Math.PI * 2); ctx.fill();
}

// ── NAVAL MINE (Corroded: rust tint, uneven horns, dim danger ring) ──
function drawMine(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Corroded sphere
  const sg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 9);
  sg.addColorStop(0, '#8b4444');
  sg.addColorStop(1, '#5c2020');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8b4444';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Rust spots
  ctx.fillStyle = 'rgba(100,60,30,0.4)';
  ctx.fillRect(cx - 4, cy - 2, 3, 3);
  ctx.fillRect(cx + 2, cy + 1, 2, 2);
  // Uneven horn spikes
  ctx.shadowColor = '#aa5544';
  ctx.shadowBlur = 3;
  const hornR = [2, 1.8, 2.2, 1.5, 2, 2.3, 1.8, 2];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    ctx.strokeStyle = '#aa5544';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, hornR[i], 0, Math.PI * 2);
    ctx.stroke();
  }
  // Dim danger ring
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(170,85,68,0.25)';
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── IRGC MISSILE PROJECTILE (Bright trail, white-hot warhead) ────
function drawProjMissile(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.imageSmoothingEnabled = false;
  const p = 3;
  const d = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, p, p); };
  // White-hot warhead → long bright trail
  d(2, 0, '#ffffff'); d(1, 0, '#ffee88'); d(0, 0, '#ffab00');
  d(-1, 0, '#ff6600'); d(-2, 0, '#ff4400'); d(-3, 0, '#cc2200');
  d(-4, 0, 'rgba(200,40,0,0.4)');
}

// ── COALITION SHELL (White-hot center, blue glow, tapered trail) ─
function drawProjShell(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Tapered beam body
  ctx.shadowColor = '#42a5f5';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 0.5);
  ctx.lineTo(cx + 4, cy - 2);
  ctx.lineTo(cx + 6, cy);
  ctx.lineTo(cx + 4, cy + 2);
  ctx.lineTo(cx - 12, cy + 0.5);
  ctx.closePath();
  ctx.fillStyle = '#42a5f5';
  ctx.fill();
  // White-hot core
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#e3f2fd';
  ctx.beginPath(); ctx.arc(cx + 4, cy, 2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Fading trail
  ctx.fillStyle = 'rgba(66,165,245,0.2)';
  ctx.fillRect(cx - 15, cy - 0.3, 3, 0.6);
}

// ── COALITION SUBMARINE (Modern SSN: round hull, tall tower, tile grid) ──
function drawSubmarine(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Smooth rounded hull
  ctx.fillStyle = '#37474f';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#546e7a';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Anechoic tile grid
  ctx.strokeStyle = 'rgba(69,90,100,0.3)';
  ctx.lineWidth = 0.3;
  for (let gx = -16; gx <= 16; gx += 4) {
    ctx.beginPath(); ctx.moveTo(cx + gx, cy - 5); ctx.lineTo(cx + gx, cy + 5); ctx.stroke();
  }
  for (let gy = -4; gy <= 4; gy += 4) {
    ctx.beginPath(); ctx.moveTo(cx - 18, cy + gy); ctx.lineTo(cx + 18, cy + gy); ctx.stroke();
  }
  // Taller conning tower
  ctx.fillStyle = '#263238';
  ctx.fillRect(cx - 2, cy - 10, 7, 6);
  ctx.strokeStyle = '#455a64';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - 2, cy - 10, 7, 6);
  // Periscope
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 10);
  ctx.lineTo(cx + 2, cy - 15);
  ctx.stroke();
  // Hull number
  ctx.fillStyle = 'rgba(144,164,174,0.4)';
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('71', cx + 10, cy + 2);
}

// ── PUBLIC API ───────────────────────────────────────────────
export function generateAll(scene) {
  createTexture(scene, 'spr_destroyer_hull', 80, 40, drawDestroyerHull);
  createTexture(scene, 'spr_destroyer_turret', 30, 14, drawDestroyerTurret);
  createTexture(scene, 'spr_tanker', 80, 40, drawTanker);
  createTexture(scene, 'spr_oil_rig', 72, 80, drawOilRig);
  createTexture(scene, 'spr_oil_rig_irgc', 88, 96, drawOilRigIRGC);
  createTexture(scene, 'spr_air_defense_base', 84, 84, drawAirDefenseBase);
  createTexture(scene, 'spr_air_defense_gun', 42, 54, drawAirDefenseGun);
  createTexture(scene, 'spr_missile_launcher_body', 64, 34, drawMissileLauncherBody);
  createTexture(scene, 'spr_missile_launcher_rail', 48, 16, drawMissileLauncherRail);
  createTexture(scene, 'spr_cruise_missile', 38, 16, drawCruiseMissile);
  createTexture(scene, 'spr_uav', 40, 40, drawUAV);
  createTexture(scene, 'spr_mine', 56, 56, drawMine);
  createTexture(scene, 'spr_proj_missile', 30, 12, drawProjMissile);
  createTexture(scene, 'spr_proj_shell', 34, 14, drawProjShell);
  createTexture(scene, 'spr_submarine', 50, 32, drawSubmarine);
}
