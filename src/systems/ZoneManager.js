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

    this.drawWater();
    this.drawChannel();
    this.drawZones();
  }

  drawWater() {
    const gfx = this.scene.add.graphics();
    gfx.lineStyle(1, 0xffffff, 0.1);
    const points = WATER_POLYGON.map(([x, y]) => new Phaser.Geom.Point(x, y));
    gfx.strokePoints(points, true);
  }

  drawChannel() {
    const gfx = this.scene.add.graphics();
    gfx.fillStyle(0xffffff, 0.03);
    gfx.lineStyle(1, 0xffeb3b, 0.15);
    const points = SHIP_CHANNEL.map(([x, y]) => new Phaser.Geom.Point(x, y));
    gfx.fillPoints(points, true);
    gfx.strokePoints(points, true);
  }

  drawZones() {
    Object.entries(ZONES).forEach(([key, zone]) => {
      const polyArrays = zone.polygons || [zone.polygon];
      const geoms = [];

      polyArrays.forEach((polyCoords) => {
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(zone.color, zone.alpha);
        gfx.lineStyle(2, zone.color, 0.4);

        const points = polyCoords.map(([x, y]) => new Phaser.Geom.Point(x, y));
        const polygon = new Phaser.Geom.Polygon(points);

        gfx.fillPoints(polygon.points, true);
        gfx.strokePoints(polygon.points, true);

        geoms.push(polygon);
      });

      this.zoneGraphics[key] = { geoms };
    });
  }

  isInWater(x, y) {
    return Phaser.Geom.Polygon.Contains(this.waterGeom, x, y);
  }

  isInChannel(x, y) {
    return Phaser.Geom.Polygon.Contains(this.channelGeom, x, y);
  }

  isInZone(zoneName, x, y) {
    const zone = this.zoneGraphics[zoneName];
    if (!zone) return false;
    return zone.geoms.some((geom) => Phaser.Geom.Polygon.Contains(geom, x, y));
  }

  getZoneAt(x, y) {
    for (const [key, zone] of Object.entries(this.zoneGraphics)) {
      if (zone.geoms.some((geom) => Phaser.Geom.Polygon.Contains(geom, x, y))) {
        return key;
      }
    }
    return null;
  }
}
