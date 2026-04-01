export class CombatManager {
  constructor(scene) {
    this.scene = scene;
  }

  update() {
    try {
      this.updateGroup(this.scene.irgcTowers);
      this.updateGroup(this.scene.projectiles);
      this.updateGroup(this.scene.coalitionShips);
      this.purgeDeadEntities();
    } catch (err) {
      console.error('[CombatManager.update] CRASH:', err);
    }
  }

  /** Call update() on every active member of a Phaser group. */
  updateGroup(group) {
    if (!group) return;
    const children = group.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child.active && child.update) child.update();
    }
  }

  /**
   * Remove destroyed / inactive entities from their groups.
   * Phaser Containers call destroy() which sets active = false,
   * but they may linger in the group's child list until manually removed.
   */
  purgeDeadEntities() {
    this.purgeGroup(this.scene.coalitionShips);
    this.purgeGroup(this.scene.irgcTowers);
    this.purgeGroup(this.scene.coalitionRigs, 'coalition');
    this.purgeGroup(this.scene.irgcRigs, 'irgc');
    this.purgeGroup(this.scene.projectiles);
  }

  purgeGroup(group, rigSide) {
    if (!group) return;
    const children = group.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const isDead = !child.active || (child.hp !== undefined && child.hp <= 0);
      if (isDead) {
        // Unregister oil rigs from economy when destroyed
        if (rigSide && child.stats && child.stats.type === 'building') {
          this.scene.economy.unregisterRig(rigSide, child);
        }
        group.remove(child, true, true);
      }
    }
  }
}
