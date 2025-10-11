/**
 * Lightweight persistence wrapper for storing wave star ratings.
 */
export class PersistenceManager {
  /**
   * @param {Storage} storage
   */
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.key = "math-marauders-stars";
  }

  /**
   * Loads the best star ratings map from storage.
   * @returns {Record<string, number>}
   */
  load() {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) {
        return {};
      }
      return parsed;
    } catch (error) {
      console.warn("Failed to load star ratings", error);
      return {};
    }
  }

  /**
   * Persists the best star ratings map.
   * @param {Record<string, number>} data
   */
  save(data) {
    try {
      this.storage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save star ratings", error);
    }
  }

  /**
   * Returns the best star rating for the provided wave number.
   * @param {number} waveNumber
   * @returns {number}
   */
  getBestStars(waveNumber) {
    const data = this.load();
    return data[waveNumber] ?? 0;
  }

  /**
   * Stores the best star rating for a wave, keeping the highest recorded value.
   * @param {number} waveNumber
   * @param {number} stars
   */
  recordStars(waveNumber, stars) {
    const data = this.load();
    const current = data[waveNumber] ?? 0;
    if (stars > current) {
      data[waveNumber] = stars;
      this.save(data);
    }
  }
}
