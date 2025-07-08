/**
 * Procedurally generates wave configurations including gates and enemy sizes.
 */
export default class WaveGenerator {
  static SKIRMISH_FACTOR = 0.8;

  /**
   * Calculate number of gates for a wave.
   * Wave 1 = 5 gates and each subsequent wave adds 1.
   * @param {number} wave
   * @returns {number}
   */
  static gateCount(wave) {
    return 4 + wave;
  }

  /**
   * Generate a wave configuration.
   * @param {number} wave
   * @returns {{gates:Array, retreatGateCount:number}}
   */
  generate(wave) {
    const count = WaveGenerator.gateCount(wave);
    const gates = [];
    for (let i = 0; i < count; i++) {
      gates.push(this._generateGateOps(wave));
    }
    return { gates, retreatGateCount: count };
  }

  _rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _opLabelAndFn(op, value) {
    switch (op) {
      case '+':
        return { label: `+${value}`, fn: x => x + value };
      case '-':
        return { label: `-${value}`, fn: x => x - value };
      case '*':
        return { label: `x${value}`, fn: x => x * value };
      case '/':
        return { label: `/${value}`, fn: x => Math.floor(x / value) };
      default:
        return { label: '', fn: x => x };
    }
  }

  _generateOneStep() {
    const ops = ['+', '-', '*', '/'];
    const op = ops[this._rand(0, ops.length - 1)];
    const val = this._rand(2, 5);
    return this._opLabelAndFn(op, val);
  }

  _generateTwoStep() {
    const first = this._generateOneStep();
    const second = this._generateOneStep();
    return {
      label: `${first.label}${second.label}`,
      fn: x => second.fn(first.fn(x))
    };
  }

  _generateGateOps(wave) {
    const tierTwo = wave >= 6 && wave <= 10;
    const tierThree = wave >= 11;
    const opA = tierTwo || tierThree ? this._generateTwoStep() : this._generateOneStep();
    const opB = tierThree ? this._generateTwoStep() : this._generateOneStep();
    return [opA, opB];
  }
}
