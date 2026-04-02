const STORAGE_KEY = 'hormuz_defense_settings';

const DEFAULTS = {
  soundEnabled: true,
  volume: 0.3,
};

export class SettingsManager {
  static getDefaults() {
    return { ...DEFAULTS };
  }

  static load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return SettingsManager.getDefaults();
      return { ...DEFAULTS, ...JSON.parse(data) };
    } catch {
      return SettingsManager.getDefaults();
    }
  }

  static save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage unavailable
    }
  }
}
