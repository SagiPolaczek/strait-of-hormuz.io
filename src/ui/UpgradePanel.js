import { UPGRADES } from '../config/upgrades.js';
import { COALITION_UNITS } from '../config/units.js';
import { ENEMY_INTEL, getIntelKey } from '../config/enemyIntel.js';
import { isMobile } from '../utils/mobile.js';

/** Escape HTML special characters to prevent DOM injection via innerHTML. */
function esc(str) {
  const el = document.createElement('span');
  el.textContent = String(str);
  return el.innerHTML;
}

export class UpgradePanel {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.selectedUnit = null;
    this.selectedUnitType = null;
    this.visible = false;

    this.panelEl = document.getElementById('upgrade-panel');
    this.innerEl = this.panelEl.querySelector('.panel-inner');

    // Mobile drawer: close button + backdrop
    if (isMobile) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'drawer-close-btn';
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', () => this.deselect());
      this.panelEl.appendChild(closeBtn);

      this.backdrop = document.getElementById('panel-backdrop');
      if (this.backdrop) {
        this.backdrop.addEventListener('click', () => this.deselect());
      }
    }

    this._showEmpty();
  }

  /** Show upgrade panel for a deployed unit on the map */
  show(unit) {
    if (this.selectedUnit === unit && this.visible) {
      this.deselect();
      return;
    }
    this.selectedUnit = unit;
    this.selectedUnitType = unit.stats?.key || null;
    this.visible = true;
    this._build();
    this._openDrawer();
  }

  /** Show upgrade panel from deployment bar (unit type, no specific instance) */
  showForType(unitConfig) {
    this.selectedUnit = null;
    this.selectedUnitType = unitConfig.key;
    this.visible = true;
    this._buildForType(unitConfig);
    this._openDrawer();
  }

  /** Deployment bar preview — now functional */
  showPreview(unitConfig) {
    this.showForType(unitConfig);
  }

  deselect() {
    this.selectedUnit = null;
    this.selectedUnitType = null;
    this.visible = false;
    this._showEmpty();
    this._closeDrawer();
  }

  hide() { this.deselect(); }

  isClickInPanel() { return false; }

  _openDrawer() {
    if (!isMobile) return;
    this.panelEl.classList.add('drawer-open');
    if (this.backdrop) this.backdrop.classList.add('visible');
  }

  _closeDrawer() {
    if (!isMobile) return;
    this.panelEl.classList.remove('drawer-open');
    if (this.backdrop) this.backdrop.classList.remove('visible');
  }

  showEnemyIntel(unit) {
    this.selectedUnit = null;
    this.selectedUnitType = null;
    this.visible = false;

    const key = getIntelKey(unit);
    if (!key) { this._showEmpty(); return; }

    const intel = ENEMY_INTEL[key];
    if (!intel) { this._showEmpty(); return; }

    const hp = Math.max(0, Math.floor(unit.hp || 0));
    const hpPct = Math.max(0, Math.min(100, Math.round((hp / intel.maxHP) * 100)));
    const hpColor = hpPct > 50 ? '#4CAF50' : hpPct > 25 ? '#ffeb3b' : '#ef5350';

    let statsHtml = intel.stats.map(s =>
      `<div class="intel-stat">
        <span class="intel-stat-label">${esc(s.label)}</span>
        <span class="intel-stat-value">${esc(s.value)}</span>
      </div>`
    ).join('');

    this._openDrawer();
    this.innerEl.innerHTML = `
      <div class="panel-header" style="color: #ef5350;">ENEMY INTEL</div>
      <div class="panel-unit-name" style="color: ${esc(intel.color)};">${esc(intel.icon)} ${esc(intel.name)}</div>
      <div style="font-size: 11px; color: ${esc(intel.color)}; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.7;">${esc(intel.type)}</div>
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
          <span style="color: #999;">HP</span>
          <span style="color: ${hpColor};">${esc(hp)}/${esc(intel.maxHP)}</span>
        </div>
        <div style="background: #1a1a1a; border-radius: 3px; height: 8px; overflow: hidden;">
          <div style="background: ${hpColor}; width: ${hpPct}%; height: 100%; border-radius: 3px;"></div>
        </div>
      </div>
      <hr class="panel-divider">
      <div style="margin-bottom: 12px;">${statsHtml}</div>
      <hr class="panel-divider">
      <div style="font-size: 13px; color: #b0bec5; line-height: 1.5; margin-bottom: 12px;">${esc(intel.desc)}</div>
      <div style="background: rgba(27, 58, 27, 0.4); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 4px; padding: 10px; font-size: 12px;">
        <div style="color: #4CAF50; font-weight: bold; margin-bottom: 4px; font-size: 11px; letter-spacing: 1px;">⚔ COUNTER</div>
        <div style="color: #81c784; line-height: 1.4;">${esc(intel.counter)}</div>
      </div>
    `;
  }

  _showEmpty() {
    this.innerEl.innerHTML = `
      <div class="panel-header">UPGRADE</div>
      <div style="color: #444; font-size: 14px; margin-top: 30px; text-align: center; line-height: 1.6;">
        TAP A UNIT<br>TO UPGRADE
      </div>
      <div style="color: #333; font-size: 11px; margin-top: 16px; text-align: center;">
        Select any coalition unit<br>on the map or deployment bar
      </div>
    `;
  }

  _getLevel(unitTypeKey, upgradeKey) {
    return this.scene.globalUpgrades?.[unitTypeKey]?.[upgradeKey] || 0;
  }

  /** Build panel for a deployed unit (shows HP + upgrades) */
  _build() {
    const unit = this.selectedUnit;
    if (!unit || !unit.stats) return;

    const unitTypeKey = unit.stats.key;
    const upgradeList = UPGRADES[unitTypeKey];
    if (!upgradeList) { this._showEmpty(); return; }

    const maxHP = unit.getMaxHP ? unit.getMaxHP() : unit.stats.hp;
    const hp = Math.max(0, Math.floor(unit.hp));
    const icon = unit.stats.icon || '';

    let html = `
      <div class="panel-header">UPGRADE</div>
      <div class="panel-unit-name">${esc(icon)} ${esc(unit.stats.name.toUpperCase())}</div>
      <div class="panel-hp" id="panel-hp">HP: ${esc(hp)}/${esc(maxHP)}</div>
      <div style="color: #33ff66; font-size: 10px; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.5;">APPLIES TO ALL ${esc(unit.stats.name.toUpperCase())}S</div>
      <hr class="panel-divider">
    `;

    html += this._buildUpgradeRows(upgradeList, unitTypeKey);
    this.innerEl.innerHTML = html;
    this._attachClickHandlers(upgradeList, unitTypeKey);
    this._cacheElements(unitTypeKey);
  }

  /** Build panel for a unit type from deployment bar */
  _buildForType(unitConfig) {
    const unitTypeKey = unitConfig.key;
    const upgradeList = UPGRADES[unitTypeKey];
    if (!upgradeList) { this._showEmpty(); return; }

    const icon = unitConfig.icon || '';

    let html = `
      <div class="panel-header">UPGRADE</div>
      <div class="panel-unit-name">${esc(icon)} ${esc(unitConfig.name.toUpperCase())}</div>
      <div style="color: #33ff66; font-size: 10px; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.5;">APPLIES TO ALL ${esc(unitConfig.name.toUpperCase())}S</div>
      <hr class="panel-divider">
    `;

    html += this._buildUpgradeRows(upgradeList, unitTypeKey);
    this.innerEl.innerHTML = html;
    this._attachClickHandlers(upgradeList, unitTypeKey);
    this._cacheElements(unitTypeKey);
  }

  _buildUpgradeRows(upgradeList, unitTypeKey) {
    let html = '';
    upgradeList.forEach((upg, i) => {
      const level = this._getLevel(unitTypeKey, upg.key);
      const maxed = level >= upg.maxLevel;
      const cost = maxed ? null : upg.costs[level];
      const canAfford = cost !== null && this.economy.canAfford('coalition', cost);

      let pips = '';
      for (let p = 0; p < upg.maxLevel; p++) pips += p < level ? '●' : '○';

      const rowClass = maxed ? 'upgrade-row maxed' : (canAfford ? 'upgrade-row' : 'upgrade-row cant-afford');
      const costClass = maxed ? 'upgrade-cost max-label' : (canAfford ? 'upgrade-cost' : 'upgrade-cost cant-afford');
      const pipsClass = maxed ? 'upgrade-pips maxed' : 'upgrade-pips';
      const costText = maxed ? 'MAX' : `${esc(cost)} OIL`;

      html += `
        <div class="${rowClass}" data-upgrade-index="${i}">
          <div class="upgrade-top">
            <span class="upgrade-name">${esc(upg.icon)} ${esc(upg.name)}</span>
            <span class="${pipsClass}">${pips}</span>
          </div>
          <div class="upgrade-bottom">
            <span class="${costClass}" data-cost-index="${i}">${costText}</span>
            <span class="upgrade-desc">${esc(upg.desc)}</span>
          </div>
        </div>
      `;
    });
    return html;
  }

  _attachClickHandlers(upgradeList, unitTypeKey) {
    this.innerEl.querySelectorAll('.upgrade-row').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.upgradeIndex);
        this._buyGlobalUpgrade(upgradeList[idx], unitTypeKey);
      });
    });
  }

  _cacheElements(unitTypeKey) {
    this._upgradeRows = Array.from(this.innerEl.querySelectorAll('.upgrade-row'));
    this._costElements = Array.from(this.innerEl.querySelectorAll('[data-cost-index]'));
    this._hpEl = document.getElementById('panel-hp');
    this._cachedUnitTypeKey = unitTypeKey;
  }

  _buyGlobalUpgrade(upg, unitTypeKey) {
    const level = this._getLevel(unitTypeKey, upg.key);
    if (level >= upg.maxLevel) return;

    const cost = upg.costs[level];
    if (!this.economy.canAfford('coalition', cost)) return;

    this.economy.spend('coalition', cost);

    // Update global state
    if (!this.scene.globalUpgrades[unitTypeKey]) this.scene.globalUpgrades[unitTypeKey] = {};
    this.scene.globalUpgrades[unitTypeKey][upg.key] = level + 1;

    // Apply to ALL existing units of this type
    const groups = this._getGroupsForType(unitTypeKey);
    for (const group of groups) {
      for (const unit of group.getChildren()) {
        if (!unit.active || unit.stats?.key !== unitTypeKey) continue;
        if (unit.applyUpgrade) unit.applyUpgrade(upg.key);
      }
    }

    if (this.scene.showMessage) {
      const label = unitTypeKey.replace(/_/g, ' ');
      this.scene.showMessage(960, 400, `⬆ ALL ${label}S: ${upg.name} Lv${level + 1}`, '#FFD54F');
    }

    // Flash row green
    const rows = this.innerEl.querySelectorAll('.upgrade-row');
    const upgradeList = UPGRADES[unitTypeKey];
    const rowIdx = upgradeList ? upgradeList.indexOf(upg) : -1;
    if (rowIdx >= 0 && rows[rowIdx]) {
      rows[rowIdx].style.transition = 'background 0.15s';
      rows[rowIdx].style.background = 'rgba(76, 175, 80, 0.3)';
      setTimeout(() => { rows[rowIdx].style.background = ''; }, 300);
    }

    // Rebuild panel
    if (this.selectedUnit) {
      this._build();
    } else {
      const config = Object.values(COALITION_UNITS).find(c => c.key === unitTypeKey);
      if (config) this._buildForType(config);
    }
  }

  _getGroupsForType(unitTypeKey) {
    const s = this.scene;
    switch (unitTypeKey) {
      case 'OIL_RIG': return [s.coalitionRigs].filter(Boolean);
      case 'TANKER':
      case 'DESTROYER':
      case 'COALITION_SUB': return [s.coalitionShips].filter(Boolean);
      case 'AIR_DEFENSE':
      case 'AIRFIELD': return [s.coalitionDefenses].filter(Boolean);
      default: return [];
    }
  }

  update() {
    if (!this.visible) return;

    // If viewing a deployed unit, check if destroyed
    if (this.selectedUnit) {
      if (!this.selectedUnit.active) {
        this.deselect();
        return;
      }
      if (this._hpEl) {
        const unit = this.selectedUnit;
        if (!unit.stats) return;
        const maxHP = unit.getMaxHP ? unit.getMaxHP() : unit.stats.hp;
        const hp = Math.max(0, Math.floor(unit.hp));
        const hpStr = `HP: ${hp}/${maxHP}`;
        if (this._hpEl.textContent !== hpStr) this._hpEl.textContent = hpStr;
      }
    }

    // Update affordability when oil changes
    const oil = Math.floor(this.economy.coalitionOil);
    if (oil === this._prevOil) return;
    this._prevOil = oil;

    const unitTypeKey = this._cachedUnitTypeKey || this.selectedUnitType;
    const upgradeList = UPGRADES[unitTypeKey];
    if (!upgradeList || !this._upgradeRows) return;

    this._upgradeRows.forEach((row, i) => {
      const upg = upgradeList[i];
      if (!upg) return;
      const level = this._getLevel(unitTypeKey, upg.key);
      if (level >= upg.maxLevel) return;

      const cost = upg.costs[level];
      const canAfford = this.economy.canAfford('coalition', cost);
      const costEl = this._costElements[i];

      if (canAfford) {
        row.classList.remove('cant-afford');
        if (costEl) costEl.classList.remove('cant-afford');
      } else {
        row.classList.add('cant-afford');
        if (costEl) costEl.classList.add('cant-afford');
      }
    });
  }
}
