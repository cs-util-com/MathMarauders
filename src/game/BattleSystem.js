import WaveGenerator from './WaveGenerator.js';

/**
 * Resolves skirmishes and the final showdown.
 */
export default class BattleSystem {
  /**
   * Resolve a skirmish after a gate.
   * @param {number} playerSize - current player army size
   * @param {number} optimalSize - optimal army size at this point
   * @returns {{enemy:number, result:number}}
   */
  resolveSkirmish(playerSize, optimalSize) {
    const enemy = Math.floor(optimalSize * WaveGenerator.SKIRMISH_FACTOR);
    const result = Math.max(0, playerSize - enemy);
    return { enemy, result };
  }
}
