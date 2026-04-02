import Phaser from 'phaser';
import { ZONES, WATER_POLYGON, SHIP_CHANNEL } from '../config/zones.js';

export class ZoneManager {
  constructor(scene) {
    this.scene = scene;
    this.zoneGraphics = {};

    // Water boundary (full water body)
    const waterPoints = WATER_POLYGON.map(([x, y]) => new Phaser.Geom.Point(x, y));
    this.waterGeom = new Phaser.Geom.Polygon(waterPoints);

    // Ship channel (navigable shipping lane)
    const channelPoints = SHIP_CHANNEL.map(([x, y]) => new Phaser.Geom.Point(x, y));
    this.channelGeom = new Phaser.Geom.Polygon(channelPoints);

    // Don't draw water/channel outlines — keep map clean
    this.buildZoneGeometry();
  }

  buildZoneGeometry() {
    // Build zone polygons for hit-testing but DON'T draw them
    // They only appear briefly on misclick via flashZone()
    Object.entries(ZONES).forEach(([key, zone]) => {
      const polyArrays = zone.polygons || [zone.polygon];
      const geoms = [];
      const graphics = [];

      polyArrays.forEach((polyCoords) => {
        const points = polyCoords.map(([x, y]) => new Phaser.Geom.Point(x, y));
        const polygon = new Phaser.Geom.Polygon(points);

        // Pre-create graphics objects (hidden) for flash effect
        const gfx = this.scene.add.graphics();
        gfx.setAlpha(0); // HIDDEN by default
        gfx.setDepth(5);

        geoms.push(polygon);
        graphics.push(gfx);
      });

      this.zoneGraphics[key] = { geoms, graphics, zone };
    });
  }

  // Flash a specific zone briefly — called on misclick to guide the player
  flashZone(zoneName) {
    const entry = this.zoneGraphics[zoneName];
    if (!entry) return;

    const { geoms, graphics, zone } = entry;

    geoms.forEach((polygon, i) => {
      const gfx = graphics[i];
      gfx.clear();

      // Draw filled zone with pulsing border
      gfx.fillStyle(zone.color, 0.15);
      gfx.lineStyle(2, zone.color, 0.7);
      gfx.fillPoints(polygon.points, true);
      gfx.strokePoints(polygon.points, true);

      // Fade in
      gfx.setAlpha(0);
      this.scene.tweens.add({
        targets: gfx,
        alpha: 1,
        duration: 200,
        yoyo: true,
        hold: 1500,        // visible for 1.5s
        ease: 'Sine.easeInOut',
        repeat: 0,
        onComplete: () => {
          gfx.clear();
          gfx.setAlpha(0);
        },
      });
    });

    // Also add a text hint at the zone center
    const allPoints = geoms.flatMap(g => g.points);
    const cx = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length;
    const cy = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length;

    const label = zoneName.replace(/_/g, ' ');
    const hint = this.scene.add.text(cx, cy, `▶ PLACE HERE: ${label}`, {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: zone.color === 0x2196f3 ? '#42a5f5' : zone.color === 0xf44336 ? '#ef5350' : '#66bb6a',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.scene.tweens.add({
      targets: hint,
      alpha: 1,
      y: cy - 10,
      duration: 300,
      hold: 1200,
      yoyo: true,
      onComplete: () => hint.destroy(),
    });
  }

  // Flash ALL coalition zones (used when player clicks with unit selected but in wrong spot)
  flashCoalitionZones(unitKey) {
    if (unitKey === 'OIL_RIG') {
      this.flashZone('COALITION_OIL');
    } else if (unitKey === 'AIR_DEFENSE' || unitKey === 'AIRFIELD') {
      this.flashZone('COALITION_LAND');
    } else {
      this.flashZone('COALITION_DEPLOY');
    }
  }

  isInWater(x, y) {
    return Phaser.Geom.Polygon.Contains(this.waterGeom, x, y);
  }

  isInChannel(x, y) {
    return Phaser.Geom.Polygon.Contains(this.channelGeom, x, y);
  }

  isInZone(zoneName, x, y) {
    const entry = this.zoneGraphics[zoneName];
    if (!entry) return false;
    return entry.geoms.some((geom) => Phaser.Geom.Polygon.Contains(geom, x, y));
  }

  getZoneAt(x, y) {
    for (const [key, entry] of Object.entries(this.zoneGraphics)) {
      if (entry.geoms.some((geom) => Phaser.Geom.Polygon.Contains(geom, x, y))) {
        return key;
      }
    }
    return null;
  }

  /** Create persistent semi-transparent zone outlines. Returns array of graphics objects. */
  createZoneOutlines(zoneName) {
    const entry = this.zoneGraphics[zoneName];
    if (!entry) return [];

    const { geoms, zone } = entry;
    const outlines = [];

    geoms.forEach((polygon) => {
      const gfx = this.scene.add.graphics();
      gfx.setDepth(3);

      // Semi-transparent fill
      gfx.fillStyle(zone.color, 0.08);
      gfx.fillPoints(polygon.points, true);

      // Border
      gfx.lineStyle(2, zone.color, 0.35);
      gfx.strokePoints(polygon.points, true);

      // Pulse animation
      this.scene.tweens.add({
        targets: gfx,
        alpha: { from: 0.5, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      outlines.push(gfx);
    });

    return outlines;
  }
}
