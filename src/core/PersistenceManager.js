import {STORAGE_KEY} from './constants.js';

/**
 * Wraps localStorage access for star persistence.
 */
export class PersistenceManager {
  /**
   * @param {Storage} storage - Storage backend (defaults to browser localStorage).
   */
  constructor(storage = window.localStorage) {
    this.storage = storage;
  }

  /**
   * Loads the best star ratings per wave.
   * @returns {Record<number, number>}
   */
  loadStars() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return {};
      }
      return parsed;
    } catch (error) {
      console.warn('Failed to load stars', error);
      return {};
    }
  }

  /**
   * Persists the provided star ratings map.
   * @param {Record<number, number>} stars - Map of wave number to best star rating.
   */
  saveStars(stars) {
    const serialized = JSON.stringify(stars);
    this.storage.setItem(STORAGE_KEY, serialized);
  }

  /**
   * Updates the stored rating for a wave, keeping the maximum.
   * @param {number} wave - Wave index.
   * @param {number} stars - Star rating.
   * @returns {Record<number, number>} Updated map.
   */
  updateStars(wave, stars) {
    const current = this.loadStars();
    const previous = current[wave] ?? 0;
    if (stars > previous) {
      current[wave] = stars;
      this.saveStars(current);
    }
    return current;
  }
}
