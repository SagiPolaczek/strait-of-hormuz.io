export class CombatManager {
  constructor(scene) {
    this.scene = scene;
  }

  update() {
    const towers = this.scene.irgcTowers?.getChildren() || [];
    for (const tower of towers) {
      if (tower.active && tower.update) tower.update();
    }

    const projectiles = this.scene.projectiles?.getChildren() || [];
    for (const proj of projectiles) {
      if (proj.active && proj.update) proj.update();
    }

    const ships = this.scene.coalitionShips?.getChildren() || [];
    for (const ship of ships) {
      if (ship.active && ship.update) ship.update();
    }
  }
}
