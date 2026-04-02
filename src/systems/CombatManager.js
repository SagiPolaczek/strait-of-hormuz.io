export class CombatManager {
  constructor(scene) {
    this.scene = scene;
  }

  update() {
    try {
      this.updateAndPurge(this.scene.irgcTowers);
      this.updateAndPurge(this.scene.projectiles);
      this.updateAndPurge(this.scene.coalitionShips);
      this.updateAndPurge(this.scene.mines);
      this.updateAndPurge(this.scene.irgcAir);
      this.updateAndPurge(this.scene.coalitionDefenses);
      this.updateAndPurge(this.scene.irgcBoats);
      this.updateAndPurge(this.scene.coalitionAir);
      this.purgeRigs(this.scene.coalitionRigs, 'coalition');
      this.purgeRigs(this.scene.irgcRigs, 'irgc');
    } catch (err) {
      console.error('[CombatManager.update] CRASH:', err);
    }
  }

  updateAndPurge(group) {
    if (!group) return;
    const children = group.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const isDead = !child.active || (child.hp !== undefined && child.hp <= 0);
      if (isDead) {
        group.remove(child, true, true);
      } else if (child.update) {
        child.update();
      }
    }
  }

  purgeRigs(group, side) {
    if (!group) return;
    const children = group.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const isDead = !child.active || (child.hp !== undefined && child.hp <= 0);
      if (isDead) {
        if (child.stats?.type === 'building') {
          this.scene.economy.unregisterRig(side, child);
        }
        group.remove(child, true, true);
      }
    }
  }
}
