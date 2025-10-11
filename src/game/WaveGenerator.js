import {
  ARMORY_GROWTH_PER_WAVE,
  BASE_ARMY_SIZE,
  MAX_WAVE,
  SKIRMISH_ENEMY_FACTOR,
} from "../constants.js";
import { createRng } from "../utils/random.js";

function clampResult(value) {
  return Math.max(0, Math.round(value));
}

function ensurePositive(value) {
  return Math.max(1, Math.round(value));
}

const BASIC_OPERATIONS = ["add", "subtract", "multiply", "divide"];

function makeSingleStepOperation(type, operand) {
  switch (type) {
    case "add":
      return {
        expression: `+${operand}`,
        apply(value) {
          return clampResult(value + operand);
        },
      };
    case "subtract":
      return {
        expression: `-${operand}`,
        apply(value) {
          return clampResult(value - operand);
        },
      };
    case "multiply":
      return {
        expression: `×${operand}`,
        apply(value) {
          return clampResult(value * operand);
        },
      };
    case "divide":
      return {
        expression: `÷${operand}`,
        apply(value) {
          return clampResult(value / operand);
        },
      };
    default:
      throw new Error(`Unsupported operation: ${type}`);
  }
}

function composeOperations(parts) {
  return {
    expression: parts.map((part) => part.expression).join(" "),
    apply(value) {
      return clampResult(parts.reduce((acc, part) => part.apply(acc), value));
    },
  };
}

function makeExponentOperation(baseOperation, exponent) {
  return {
    expression: `(${baseOperation.expression})^${exponent}`,
    apply(value) {
      const base = ensurePositive(baseOperation.apply(value));
      return clampResult(Math.pow(base, exponent));
    },
  };
}

function selectOperationType(rng, biasToReduction = false) {
  const pool = biasToReduction
    ? ["subtract", "divide", "add", "multiply"]
    : BASIC_OPERATIONS;
  const index = Math.floor(rng() * pool.length);
  return pool[Math.min(index, pool.length - 1)];
}

function pickOperand(rng, base, min = 2, max = 12) {
  const spread = max - min;
  return min + Math.floor(rng() * (spread + base));
}

function generateSingleStep(rng, { gateIndex, waveNumber, biasToReduction }) {
  const type = selectOperationType(rng, biasToReduction);
  const operand = pickOperand(rng, waveNumber + gateIndex, 2, 9);
  return makeSingleStepOperation(type, operand);
}

function generateTwoStep(rng, context) {
  const first = generateSingleStep(rng, context);
  const second = generateSingleStep(rng, {
    ...context,
    biasToReduction: false,
  });
  return composeOperations([first, second]);
}

function generateAdvanced(rng, context) {
  const inner = generateTwoStep(rng, context);
  const exponent = 2 + Math.floor(rng() * 2); // 2 or 3
  return makeExponentOperation(inner, exponent);
}

const TIER_GENERATORS = [
  { limit: 5, factory: generateSingleStep },
  { limit: 10, factory: generateTwoStep },
  { limit: MAX_WAVE + 1, factory: generateAdvanced },
];

function resolveFactory(waveNumber) {
  return (
    TIER_GENERATORS.find((tier) => waveNumber <= tier.limit)?.factory ??
    generateSingleStep
  );
}

function evaluateOptimalPath(gates, initialCount) {
  let current = initialCount;
  const steps = [];
  gates.forEach((gate) => {
    const bestChoice = gate.choices.reduce(
      (best, choice, index) => {
        const result = choice.apply(current);
        if (result > best.result) {
          return { result, index };
        }
        return best;
      },
      { result: -Infinity, index: 0 },
    );
    current = bestChoice.result;
    steps.push({
      gateId: gate.id,
      result: current,
      choiceIndex: bestChoice.index,
    });
  });
  return { final: current, steps };
}

function cloneGate(gate) {
  return {
    ...gate,
    choices: gate.choices.map((choice) => ({ ...choice })),
  };
}

/**
 * Creates gate descriptors for a given wave and direction.
 */
function buildGateSet({ waveNumber, gateCount, seed, retreat = false }) {
  const rng = createRng(seed);
  const factory = resolveFactory(waveNumber);
  const gates = [];
  for (let i = 0; i < gateCount; i += 1) {
    const id = `${retreat ? "ret" : "fwd"}-${waveNumber}-${i + 1}`;
    const gate = {
      id,
      index: i,
      label: `Gate ${i + 1}`,
      phase: retreat ? "retreat" : "forward",
      choices: [0, 1].map((variant) =>
        factory(rng, {
          waveNumber,
          gateIndex: i,
          variant,
          biasToReduction: retreat && variant === 0,
        }),
      ),
    };
    gates.push(gate);
  }
  return gates;
}

/**
 * Generates the procedural layout for a wave.
 */
export class WaveGenerator {
  constructor({ seed = 1337 } = {}) {
    this.seed = seed;
  }

  baseArmySize(waveNumber) {
    return BASE_ARMY_SIZE + (waveNumber - 1) * ARMORY_GROWTH_PER_WAVE;
  }

  gateCount(waveNumber) {
    return 5 + (waveNumber - 1);
  }

  generateWave(waveNumber) {
    const cappedWave = Math.min(waveNumber, MAX_WAVE);
    const gateCount = this.gateCount(cappedWave);
    const initialArmy = this.baseArmySize(cappedWave);
    const forwardGates = buildGateSet({
      waveNumber: cappedWave,
      gateCount,
      seed: this.seed * (cappedWave + 1),
    });
    const forwardOptimal = evaluateOptimalPath(forwardGates, initialArmy);
    const skirmishes = forwardOptimal.steps.map((step) => ({
      gateId: step.gateId,
      enemySize: clampResult(step.result * SKIRMISH_ENEMY_FACTOR),
    }));
    const retreatGates = buildGateSet({
      waveNumber: cappedWave,
      gateCount,
      seed: this.seed * (cappedWave + 7),
      retreat: true,
    });
    const retreatOptimal = evaluateOptimalPath(
      retreatGates,
      forwardOptimal.final,
    );

    return {
      waveNumber: cappedWave,
      initialArmy,
      gateCount,
      forward: forwardGates.map((gate) => cloneGate(gate)),
      retreat: retreatGates.map((gate) => cloneGate(gate)),
      skirmishes,
      optimal: {
        forward: forwardOptimal,
        retreat: retreatOptimal,
      },
    };
  }
}
