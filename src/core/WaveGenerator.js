import {
  BASE_FORWARD_GATE_COUNT,
  SKIRMISH_RATIO,
  BASE_PLAYER_ARMY,
  MAX_OPERATION_FACTOR,
  MAX_OPERATION_OFFSET,
} from './constants.js';
import {createRng, randomInt} from '../utils/random.js';

const TIERS = {
  BASIC: 'basic',
  COMPOUND: 'compound',
  ADVANCED: 'advanced',
};

function sanitize(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function addOperation(offset) {
  return {
    label: `+${offset}`,
    apply(value) {
      return sanitize(value + offset);
    },
  };
}

function subtractOperation(offset) {
  return {
    label: `−${offset}`,
    apply(value) {
      return sanitize(value - offset);
    },
  };
}

function multiplyOperation(factor) {
  return {
    label: `×${factor}`,
    apply(value) {
      return sanitize(value * factor);
    },
  };
}

function divideOperation(divisor) {
  return {
    label: `÷${divisor}`,
    apply(value) {
      if (divisor === 0) {
        return 0;
      }
      return sanitize(value / divisor);
    },
  };
}

function exponentOperation(offset, exponent) {
  return {
    label: `(${offset >= 0 ? `+${offset}` : offset})^${exponent}`,
    apply(value) {
      const adjusted = value + offset;
      return sanitize(Math.pow(Math.max(adjusted, 0), exponent));
    },
  };
}

function compoundOperation(first, second) {
  return {
    label: `${first.label} ${second.label}`,
    apply(value) {
      return second.apply(first.apply(value));
    },
  };
}

function getTierForWave(waveNumber) {
  if (waveNumber <= 5) {
    return TIERS.BASIC;
  }
  if (waveNumber <= 10) {
    return TIERS.COMPOUND;
  }
  return TIERS.ADVANCED;
}

function buildBasicOperation(rng) {
  const choice = randomInt(rng, 0, 3);
  switch (choice) {
    case 0:
      return addOperation(randomInt(rng, 2, MAX_OPERATION_OFFSET));
    case 1:
      return subtractOperation(randomInt(rng, 1, MAX_OPERATION_OFFSET - 2));
    case 2:
      return multiplyOperation(randomInt(rng, 2, MAX_OPERATION_FACTOR));
    default:
      return divideOperation(randomInt(rng, 2, MAX_OPERATION_FACTOR + 1));
  }
}

function buildCompoundOperation(rng) {
  const first = buildBasicOperation(rng);
  const second = buildBasicOperation(rng);
  return compoundOperation(first, second);
}

function buildAdvancedOperation(rng) {
  const mode = randomInt(rng, 0, 2);
  if (mode === 0) {
    return compoundOperation(buildBasicOperation(rng), exponentOperation(randomInt(rng, -3, 3), 2));
  }
  if (mode === 1) {
    return compoundOperation(addOperation(randomInt(rng, -3, 6)), multiplyOperation(randomInt(rng, 2, 4)));
  }
  const exponent = randomInt(rng, 2, 3);
  return exponentOperation(randomInt(rng, -2, 4), exponent);
}

function buildOperationForTier(tier, rng) {
  if (tier === TIERS.BASIC) {
    return buildBasicOperation(rng);
  }
  if (tier === TIERS.COMPOUND) {
    return buildCompoundOperation(rng);
  }
  return buildAdvancedOperation(rng);
}

function createGate({waveNumber, index, rng}) {
  const tier = getTierForWave(waveNumber);
  const left = buildOperationForTier(tier, rng);
  const right = buildOperationForTier(tier, rng);
  return {
    id: `wave-${waveNumber}-gate-${index}`,
    tier,
    options: [
      {id: 'left', ...left},
      {id: 'right', ...right},
    ],
  };
}

function simulateForward(gates, initialArmy) {
  let army = initialArmy;
  const checkpoints = [];
  gates.forEach((gate) => {
    const left = gate.options[0].apply(army);
    const right = gate.options[1].apply(army);
    const best = left >= right ? {choice: 'left', value: left} : {choice: 'right', value: right};
    const enemy = sanitize(best.value * SKIRMISH_RATIO);
    const postBattle = sanitize(best.value - enemy);
    checkpoints.push({
      gateId: gate.id,
      before: army,
      left,
      right,
      bestChoice: best.choice,
      bestValue: best.value,
      enemy,
      postBattle,
    });
    army = postBattle;
  });
  return {
    checkpoints,
    finalArmy: army,
  };
}

function simulateRetreat(gates, initialArmy) {
  let army = initialArmy;
  const checkpoints = [];
  gates.forEach((gate) => {
    const left = gate.options[0].apply(army);
    const right = gate.options[1].apply(army);
    const best = left >= right ? {choice: 'left', value: left} : {choice: 'right', value: right};
    checkpoints.push({
      gateId: gate.id,
      before: army,
      left,
      right,
      bestChoice: best.choice,
      bestValue: best.value,
    });
    army = best.value;
  });
  return {
    checkpoints,
    finalArmy: army,
  };
}

/**
 * Generates procedural wave layouts including gate operations and
 * reference optimal paths used for scoring and encounter sizing.
 */
export class WaveGenerator {
  /**
   * @param {number} seed - Base seed for deterministic generation.
   */
  constructor(seed = 1337) {
    this.seed = seed;
  }

  /**
   * Creates the forward and retreat data for a wave.
   * @param {number} waveNumber - Wave index starting at 1.
   * @param {number} [startingArmy=BASE_PLAYER_ARMY] - Army size to feed into the first gate.
   * @returns {object}
   */
  generate(waveNumber, startingArmy = BASE_PLAYER_ARMY) {
    if (waveNumber < 1) {
      throw new Error('waveNumber must be >= 1');
    }
    const gateCount = BASE_FORWARD_GATE_COUNT + (waveNumber - 1);
    const rng = createRng(waveNumber * 97 + this.seed);
    const forwardGates = Array.from({length: gateCount}, (_, index) =>
      createGate({waveNumber, index, rng})
    );
    const retreatGates = Array.from({length: gateCount}, (_, index) =>
      createGate({waveNumber, index: gateCount + index, rng})
    );

    const forward = simulateForward(forwardGates, startingArmy);
    const retreat = simulateRetreat(retreatGates, forward.finalArmy);

    return {
      waveNumber,
      gateCount,
      startingArmy,
      forwardGates,
      retreatGates,
      optimal: {
        forward,
        retreat,
      },
    };
  }
}
