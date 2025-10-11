import { INITIAL_ARMY_SIZE, SKIRMISH_ENEMY_RATIO } from "../core/constants.js";
import { createSeededRandom } from "../utils/random.js";

/**
 * Represents a single math operation choice at a gate.
 */
class GateOperation {
  /**
   * @param {string} label
   * @param {(value: number) => number} apply
   */
  constructor(label, apply) {
    this.label = label;
    this.apply = apply;
  }

  /**
   * Evaluates the operation against the provided army size.
   * @param {number} value
   * @returns {number}
   */
  evaluate(value) {
    return Math.max(0, Math.round(this.apply(value)));
  }
}

/**
 * Creates a basic unary operation based on tier.
 * @param {() => number} rnd
 * @param {number} value
 * @returns {GateOperation}
 */
function createBaseOperation(rnd, value) {
  const choice = Math.floor(rnd() * 4);
  switch (choice) {
    case 0: {
      const delta = 5 + Math.floor(rnd() * 30);
      return new GateOperation(`+${delta}`, (input) => input + delta);
    }
    case 1: {
      const delta = 5 + Math.floor(rnd() * Math.min(30, value));
      return new GateOperation(`-${delta}`, (input) => Math.max(0, input - delta));
    }
    case 2: {
      const factor = 2 + Math.floor(rnd() * 3);
      return new GateOperation(`×${factor}`, (input) => input * factor);
    }
    default: {
      const divisor = 2 + Math.floor(rnd() * 3);
      return new GateOperation(`÷${divisor}`, (input) => input / divisor);
    }
  }
}

/**
 * Builds a two-step composite operation unlocked on higher waves.
 * @param {() => number} rnd
 * @param {number} value
 * @returns {GateOperation}
 */
function createCompositeOperation(rnd, value) {
  const first = createBaseOperation(rnd, value);
  const intermediateValue = first.evaluate(value);
  const second = createBaseOperation(rnd, intermediateValue);
  return new GateOperation(`${first.label} → ${second.label}`, (input) =>
    second.apply(first.apply(input))
  );
}

/**
 * Builds an exponent-based operation for very high waves.
 * @param {() => number} rnd
 * @param {number} value
 * @returns {GateOperation}
 */
function createExponentOperation(rnd, value) {
  const base = createBaseOperation(rnd, value);
  const exponent = 2 + Math.floor(rnd() * 2);
  const normaliser = 3 + Math.floor(rnd() * 4);
  return new GateOperation(`(${base.label})^${exponent}`, (input) => {
    const intermediate = base.apply(input);
    return Math.pow(Math.max(1, intermediate), exponent) / normaliser;
  });
}

/**
 * Calculates the optimal outcome for a gate.
 * @param {number} current
 * @param {GateOperation[]} operations
 * @returns {{best: number, operation: GateOperation}}
 */
function determineOptimal(current, operations) {
  let best = -Infinity;
  let bestOp = operations[0];
  for (const op of operations) {
    const result = op.evaluate(current);
    if (result > best) {
      best = result;
      bestOp = op;
    }
  }
  return { best: Math.max(0, Math.round(best)), operation: bestOp };
}

/**
 * Generates the list of gate operations for a wave.
 * @param {number} waveNumber
 * @param {number} seedOffset
 * @returns {Array<{id: number, operations: GateOperation[], enemySize: number, optimalAfter: number}>}
 */
function generateGateSequence(waveNumber, seedOffset = 0) {
  const gateCount = 5 + (waveNumber - 1);
  const rnd = createSeededRandom(waveNumber * 1000 + seedOffset);
  const gates = [];
  let optimal = INITIAL_ARMY_SIZE;
  for (let index = 0; index < gateCount; index += 1) {
    const currentValue = optimal;
    const operations = [];
    for (let lane = 0; lane < 2; lane += 1) {
      if (waveNumber >= 11) {
        operations.push(createExponentOperation(rnd, currentValue));
      } else if (waveNumber >= 6) {
        operations.push(createCompositeOperation(rnd, currentValue));
      } else {
        operations.push(createBaseOperation(rnd, currentValue));
      }
    }
    const optimalResult = determineOptimal(currentValue, operations);
    const enemySize = Math.max(0, Math.round(optimalResult.best * SKIRMISH_ENEMY_RATIO));
    const optimalAfter = Math.max(0, optimalResult.best - enemySize);
    gates.push({
      id: index + 1,
      operations,
      enemySize,
      optimalAfter
    });
    optimal = optimalAfter;
  }
  return gates;
}

/**
 * Generates a wave configuration containing forward and retreat gates.
 */
export class WaveGenerator {
  /**
   * Builds the configuration for the requested wave.
   * @param {number} waveNumber
   * @returns {{waveNumber: number, forward: ReturnType<typeof generateGateSequence>, retreat: ReturnType<typeof generateGateSequence>, initialArmy: number}}
   */
  generateWave(waveNumber) {
    return {
      waveNumber,
      forward: generateGateSequence(waveNumber, 0),
      retreat: generateGateSequence(waveNumber, 999),
      initialArmy: INITIAL_ARMY_SIZE
    };
  }
}

export { GateOperation, generateGateSequence };
