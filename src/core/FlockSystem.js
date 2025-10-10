/**
 * Maintains the abstract state of the player and enemy flocks.
 */
export class FlockSystem {
  constructor() {
    this.player = 0;
    this.enemy = 0;
    this.observers = new Set();
  }

  /**
   * Subscribes to updates.
   * @param {(state: {player: number, enemy: number}) => void} observer
   */
  subscribe(observer) {
    this.observers.add(observer);
    observer({player: this.player, enemy: this.enemy});
  }

  /**
   * Removes a subscription.
   * @param {(state: {player: number, enemy: number}) => void} observer
   */
  unsubscribe(observer) {
    this.observers.delete(observer);
  }

  notify() {
    const snapshot = {player: this.player, enemy: this.enemy};
    this.observers.forEach((observer) => observer(snapshot));
  }

  /**
   * Sets the player army size.
   * @param {number} count
   */
  setPlayer(count) {
    this.player = Math.max(0, Math.floor(count));
    this.notify();
  }

  /**
   * Sets the enemy army size.
   * @param {number} count
   */
  setEnemy(count) {
    this.enemy = Math.max(0, Math.floor(count));
    this.notify();
  }

  /**
   * Adjusts the enemy by subtracting defeated units.
   * @param {number} defeated
   */
  removeEnemy(defeated) {
    this.enemy = Math.max(0, this.enemy - Math.floor(defeated));
    this.notify();
  }
}
