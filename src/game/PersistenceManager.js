/**
 * Handles saving and loading star ratings using localStorage.
 */
export default class PersistenceManager {
  constructor(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
    this.storage = storage;
    this.prefix = 'mathMarauders_wave_';
  }

  /**
   * Get stored star rating for a wave.
   * @param {number} wave
   * @returns {number}
   */
  getStarRating(wave) {
    if (!this.storage) return 0;
    const value = this.storage.getItem(this.prefix + wave);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Save star rating for a wave.
   * @param {number} wave
   * @param {number} stars
   */
  setStarRating(wave, stars) {
    if (!this.storage) return;
    this.storage.setItem(this.prefix + wave, String(stars));
  }
}
