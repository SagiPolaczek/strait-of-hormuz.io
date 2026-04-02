const STORAGE_KEY = 'hormuz_defense_leaderboard';
const MAX_ENTRIES = 10;

export class LeaderboardManager {
  static save(entry) {
    const board = LeaderboardManager.load();
    entry.date = new Date().toISOString().split('T')[0];
    entry.callsign = localStorage.getItem('hormuz_callsign') || 'UNKNOWN';
    board.push(entry);
    board.sort((a, b) => {
      // Victories first
      if (a.outcome === 'victory' && b.outcome !== 'victory') return -1;
      if (b.outcome === 'victory' && a.outcome !== 'victory') return 1;
      // Then by score (tankers through)
      if (b.score !== a.score) return b.score - a.score;
      // Then by time (shorter is better)
      return (a.timeSeconds || 0) - (b.timeSeconds || 0);
    });
    if (board.length > MAX_ENTRIES) board.length = MAX_ENTRIES;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    } catch (e) {
      // localStorage unavailable
    }
    return board;
  }

  static load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  static generateShareText(entry) {
    const icon = entry.outcome === 'victory' ? '🏆' : '💀';
    const result = entry.outcome === 'victory' ? 'COALITION VICTORY' : 'MISSION FAILED';
    const callsign = entry.callsign || localStorage.getItem('hormuz_callsign') || 'UNKNOWN';
    return `${icon} STRAIT OF HORMUZ DEFENSE | ADM. ${callsign} | ${entry.score} tanker${entry.score !== 1 ? 's' : ''} through | ${entry.time} | ${result}`;
  }
}
