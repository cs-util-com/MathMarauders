/**
 * Manages the player's army size.
 */
export default class FlockSystem {
  constructor(initialSize = 10) {
    this.size = initialSize;
  }

  /**
   * Increase or decrease army size.
   * @param {number} delta
   */
  add(delta) {
    this.size = Math.max(0, this.size + delta);
  }

  set(value) {
    this.size = Math.max(0, value);
  }
}
