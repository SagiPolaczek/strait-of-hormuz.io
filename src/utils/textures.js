// Shared particle texture creation — called once per scene
export function ensureTextures(scene) {
  // Starburst flare — bright center with radial rays
  if (!scene.textures.exists('flare')) {
    const c = scene.textures.createCanvas('flare', 24, 24);
    const ctx = c.getContext();
    const cx = 12, cy = 12;
    // Rays
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2);
      ctx.lineTo(cx + Math.cos(angle) * 10, cy + Math.sin(angle) * 10);
      ctx.stroke();
    }
    // Center glow
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,200,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
    c.refresh();
  }

  // Brown-tinted explosion smoke
  if (!scene.textures.exists('smoke')) {
    const c = scene.textures.createCanvas('smoke', 24, 24);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(140,110,80,0.8)');
    g.addColorStop(0.5, 'rgba(100,80,60,0.4)');
    g.addColorStop(1, 'rgba(60,50,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
    c.refresh();
  }

  // Larger fire with dramatic falloff
  if (!scene.textures.exists('fire')) {
    const c = scene.textures.createCanvas('fire', 24, 24);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(255,200,50,1)');
    g.addColorStop(0.3, 'rgba(255,130,20,0.8)');
    g.addColorStop(0.7, 'rgba(255,60,0,0.3)');
    g.addColorStop(1, 'rgba(200,20,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
    c.refresh();
  }

  // Sharp bright spark with hard falloff
  if (!scene.textures.exists('spark')) {
    const c = scene.textures.createCanvas('spark', 12, 12);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 5);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,240,150,0.8)');
    g.addColorStop(0.7, 'rgba(255,200,50,0.2)');
    g.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 12, 12);
    c.refresh();
  }

  // Wider softer wake
  if (!scene.textures.exists('wake')) {
    const c = scene.textures.createCanvas('wake', 12, 12);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.5, 'rgba(210,230,255,0.25)');
    g.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 12, 12);
    c.refresh();
  }

  // Varied debris shapes and colors
  if (!scene.textures.exists('debris')) {
    const c = scene.textures.createCanvas('debris', 10, 10);
    const ctx = c.getContext();
    ctx.fillStyle = '#665544';
    ctx.fillRect(2, 2, 4, 5);
    ctx.fillStyle = '#554433';
    ctx.fillRect(5, 4, 3, 4);
    ctx.fillStyle = '#884444';
    ctx.fillRect(3, 6, 4, 3);
    c.refresh();
  }
}
