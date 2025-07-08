/**
 * Handles math gates and player choices.
 */
export default class GateSystem {
  constructor(gates = []) {
    this.gates = gates;
    this.index = 0;
  }

  currentGate() {
    return this.gates[this.index];
  }

  /**
   * Apply player's choice to the army size.
   * @param {number} choiceIndex
   * @param {number} armySize
   * @returns {number} new army size
   */
  applyChoice(choiceIndex, armySize) {
    const gate = this.currentGate();
    const op = gate[choiceIndex];
    this.index++;
    return op.fn(armySize);
  }

  /**
   * Compute optimal army size after this gate.
   * @param {number} armySize
   * @returns {number}
   */
  optimalOutcome(armySize) {
    const gate = this.currentGate();
    const resA = gate[0].fn(armySize);
    const resB = gate[1].fn(armySize);
    return Math.max(resA, resB);
  }

  hasMore() {
    return this.index < this.gates.length;
  }
}
