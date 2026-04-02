// Shared particle texture creation — called once per scene
export function ensureTextures(scene) {
  if (!scene.textures.exists('flare')) {
    const c = scene.textures.createCanvas('flare', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('smoke')) {
    const c = scene.textures.createCanvas('smoke', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(120,120,120,0.8)');
    g.addColorStop(0.5, 'rgba(80,80,80,0.4)');
    g.addColorStop(1, 'rgba(40,40,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('fire')) {
    const c = scene.textures.createCanvas('fire', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,200,50,1)');
    g.addColorStop(0.4, 'rgba(255,100,20,0.8)');
    g.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('spark')) {
    const c = scene.textures.createCanvas('spark', 8, 8);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,200,1)');
    g.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    c.refresh();
  }
  if (!scene.textures.exists('wake')) {
    const c = scene.textures.createCanvas('wake', 8, 8);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.5, 'rgba(200,220,255,0.3)');
    g.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    c.refresh();
  }
  if (!scene.textures.exists('debris')) {
    const c = scene.textures.createCanvas('debris', 6, 6);
    const ctx = c.getContext();
    ctx.fillStyle = '#555555';
    ctx.fillRect(1, 1, 4, 4);
    c.refresh();
  }
}
