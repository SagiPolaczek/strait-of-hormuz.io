export class DebriefRenderer {
  /**
   * @param {Object} data - { score, time, outcome, balance, callsign, rating, ratingColor, headline }
   * @param {HTMLImageElement} mapImage - the satellite map image
   * @returns {Promise<Blob>} PNG blob
   */
  static async render(data, mapImage) {
    const SCALE = 2;
    const W = 1200;
    const H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    const isVictory = data.outcome === 'victory';
    const accent = isVictory ? '#4CAF50' : '#ef5350';
    const accentRgb = isVictory ? '76,175,80' : '239,83,80';

    // ── Background: dark base ──
    ctx.fillStyle = '#050a0f';
    ctx.fillRect(0, 0, W, H);

    // ── Satellite map as faded background ──
    if (mapImage) {
      ctx.globalAlpha = 0.12;
      // Draw map to fill width, crop vertically
      const aspect = mapImage.width / mapImage.height;
      const drawW = W;
      const drawH = W / aspect;
      ctx.drawImage(mapImage, 0, (H - drawH) / 2, drawW, drawH);
      ctx.globalAlpha = 1;
    }

    // ── Dark gradient overlay from edges ──
    const edgeGrad = ctx.createLinearGradient(0, 0, 0, H);
    edgeGrad.addColorStop(0, 'rgba(5,10,15,0.9)');
    edgeGrad.addColorStop(0.3, 'rgba(5,10,15,0.4)');
    edgeGrad.addColorStop(0.7, 'rgba(5,10,15,0.4)');
    edgeGrad.addColorStop(1, 'rgba(5,10,15,0.95)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Scan lines ──
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }

    // ── Top accent line ──
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, W, 2);
    ctx.globalAlpha = 1;

    // ── Bottom accent line ──
    ctx.fillStyle = '#33ff66';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, H - 1, W, 1);
    ctx.globalAlpha = 1;

    // ── Corner brackets ──
    ctx.strokeStyle = '#33ff66';
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    const m = 20;
    const cl = 20;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(m, m + cl); ctx.lineTo(m, m); ctx.lineTo(m + cl, m);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(W - m - cl, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + cl);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(m, H - m - cl); ctx.lineTo(m, H - m); ctx.lineTo(m + cl, H - m);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(W - m - cl, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - cl);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Title area ──
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#33ff66';
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'left';
    ctx.fillText('CENTCOM TACTICAL INTERFACE  //  OPERATION DEBRIEF', 50, 42);
    ctx.globalAlpha = 1;

    // ── Classification ──
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillStyle = '#ef5350';
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'right';
    ctx.fillText('TOP SECRET // SCI // NOFORN', W - 50, 42);
    ctx.globalAlpha = 1;

    // ── Main title ──
    ctx.font = '36px "Black Ops One", cursive';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(isVictory ? 'MISSION COMPLETE' : 'MISSION TERMINATED', W / 2, 90);

    // ── HR under title ──
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 105);
    ctx.lineTo(W - 100, 105);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Callsign ──
    const callsign = data.callsign || 'UNKNOWN';
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillStyle = '#ffb300';
    ctx.textAlign = 'center';
    ctx.fillText(`ADMIRAL ${callsign}`, W / 2, 130);

    // ── Stats panel: left column ──
    const statsY = 175;
    const leftX = 160;
    const rightX = W - 160;

    // Tankers through — BIG number
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#90CAF9';
    ctx.textAlign = 'left';
    ctx.fillText('TANKERS THROUGH STRAIT', leftX, statsY);

    ctx.font = 'bold 64px "Orbitron", sans-serif';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(String(data.score).padStart(3, '0'), leftX, statsY + 65);

    // Mission duration
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#90CAF9';
    ctx.fillText('MISSION DURATION', leftX, statsY + 100);

    ctx.font = 'bold 36px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffb300';
    ctx.fillText(data.time || '0:00', leftX, statsY + 135);

    // ── Stats panel: right column ──
    // Strait control
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#90CAF9';
    ctx.textAlign = 'right';
    ctx.fillText('STRAIT CONTROL', rightX, statsY);

    const bal = data.balance || 0;
    const balColor = bal > 0 ? '#42a5f5' : bal < 0 ? '#ef5350' : '#ffffff';
    ctx.font = 'bold 48px "Orbitron", sans-serif';
    ctx.fillStyle = balColor;
    ctx.fillText(`${bal > 0 ? '+' : ''}${bal}`, rightX, statsY + 55);

    // Performance rating
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#90CAF9';
    ctx.fillText('PERFORMANCE RATING', rightX, statsY + 100);

    const ratingLabel = isVictory ? 'VICTORY' : (data.rating || 'UNKNOWN');
    ctx.font = '28px "Black Ops One", cursive';
    ctx.fillStyle = isVictory ? '#4CAF50' : (data.ratingColor || '#ffffff');
    ctx.fillText(ratingLabel, rightX, statsY + 130);

    // ── Balance meter bar (horizontal) ──
    const barY = statsY + 165;
    const barX = 160;
    const barW = W - 320;
    const barH = 16;

    // Track background
    ctx.fillStyle = 'rgba(26,26,26,0.9)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Center tick
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(barX + barW / 2 - 0.5, barY - 2, 1, barH + 4);

    // Fill
    const norm = Math.max(-1, Math.min(1, bal / 100));
    if (norm > 0) {
      ctx.fillStyle = 'rgba(33,150,243,0.7)';
      ctx.fillRect(barX + barW / 2, barY + 2, norm * barW / 2, barH - 4);
    } else if (norm < 0) {
      const fillW = -norm * barW / 2;
      ctx.fillStyle = 'rgba(244,67,54,0.7)';
      ctx.fillRect(barX + barW / 2 - fillW, barY + 2, fillW, barH - 4);
    }

    // Labels
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('COALITION', barX, barY - 5);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef5350';
    ctx.fillText('IRGC', barX + barW, barY - 5);

    // ── Outcome reason ──
    let reasonText = '';
    if (isVictory) {
      reasonText = 'COALITION SECURED FULL CONTROL OF THE STRAIT';
    } else if (bal <= -100) {
      reasonText = 'IRGC ACHIEVED TOTAL DOMINANCE — STRAIT BLOCKADED';
    } else {
      reasonText = 'COALITION RESOURCES EXHAUSTED — UNABLE TO CONTINUE';
    }
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = '#90CAF9';
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.fillText(reasonText, W / 2, barY + 40);
    ctx.globalAlpha = 1;

    // ── Stamp (rotated) ──
    ctx.save();
    ctx.translate(W - 200, 260);
    ctx.rotate(-18 * Math.PI / 180);
    ctx.font = '32px "Black Ops One", cursive';
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'center';
    ctx.fillText(isVictory ? 'MISSION SUCCESS' : 'CLASSIFIED', 0, 0);
    // Stamp border
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.strokeRect(-130, -25, 260, 40);
    ctx.restore();
    ctx.globalAlpha = 1;

    // ── Game title at bottom ──
    ctx.font = '18px "Black Ops One", cursive';
    ctx.fillStyle = '#33ff66';
    ctx.globalAlpha = 0.6;
    ctx.textAlign = 'center';
    ctx.fillText('STRAIT OF HORMUZ DEFENSE', W / 2, H - 55);
    ctx.globalAlpha = 1;

    // ── Footer coordinates ──
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillStyle = '#33ff66';
    ctx.globalAlpha = 0.3;
    ctx.fillText('26.5667N  56.2500E  //  PERSIAN GULF AO  //  CENTCOM EYES ONLY', W / 2, H - 30);
    ctx.globalAlpha = 1;

    // ── Export as PNG blob ──
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  /**
   * Download the debrief image
   */
  static async download(data, mapImage) {
    const blob = await DebriefRenderer.render(data, mapImage);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hormuz-debrief-${data.callsign || 'admiral'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Share via Web Share API (with image fallback to download)
   */
  static async share(data, mapImage) {
    const blob = await DebriefRenderer.render(data, mapImage);
    const file = new File([blob], 'hormuz-debrief.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
        });
        return 'shared';
      } catch (e) {
        if (e.name === 'AbortError') return 'cancelled';
      }
    }
    // Fallback to download
    await DebriefRenderer.download(data, mapImage);
    return 'downloaded';
  }
}
