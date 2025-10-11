/**
 * Manages the player's progression through math gates.
 */
export class GateSystem {
  /**
   * @param {{id: number, operations: Array<{label: string, evaluate(value: number): number}>, enemySize: number, optimalAfter: number}[]} gates
   */
  constructor(gates) {
    this.gates = gates;
    this.currentIndex = 0;
  }

  /**
   * Returns true if there are more gates to play through.
   * @returns {boolean}
   */
  hasNextGate() {
    return this.currentIndex < this.gates.length;
  }

  /**
   * Returns the current gate descriptor.
   * @returns {ReturnType<GateSystem["nextGate"]>}
   */
  peekGate() {
    return this.gates[this.currentIndex] ?? null;
  }

  /**
   * Advances to the next gate.
   * @returns {{gate: ReturnType<GateSystem['peekGate']>, index: number}}
   */
  nextGate() {
    const gate = this.peekGate();
    if (!gate) {
      return { gate: null, index: this.currentIndex };
    }
    return { gate, index: this.currentIndex };
  }

  /**
   * Resolves the player's choice for the current gate.
   * @param {number} playerCount
   * @param {number} choiceIndex
   * @returns {{playerAfterGate: number, enemySize: number, optimalAfter: number}}
   */
  resolveGate(playerCount, choiceIndex) {
    const gate = this.peekGate();
    if (!gate) {
      return {
        playerAfterGate: playerCount,
        enemySize: 0,
        optimalAfter: playerCount
      };
    }
    const operation = gate.operations[choiceIndex] ?? gate.operations[0];
    const result = Math.max(0, Math.round(operation.evaluate(playerCount)));
    this.currentIndex += 1;
    return {
      playerAfterGate: result,
      enemySize: gate.enemySize,
      optimalAfter: gate.optimalAfter
    };
  }
}
