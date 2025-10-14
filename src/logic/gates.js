import { createSeededRng } from '../utils/random.js';

const OPERATION_CONFIG = {
  add: {
    symbol: '+',
    color: '#33d6a6',
    describe: (value) => `Recruit ${value} runners`,
  },
  sub: {
    symbol: '−',
    color: '#ff5fa2',
    describe: (value) => `Patch up casualties (−${value})`,
  },
  mul: {
    symbol: '×',
    color: '#ffd166',
    describe: (value) => `Drill squads ×${value.toFixed(2)}`,
  },
  div: {
    symbol: '÷',
    color: '#00d1ff',
    describe: (value) => `Split squads ÷${value.toFixed(2)}`,
  },
};

const VALUE_RANGES = {
  add: [6, 14],
  sub: [4, 11],
  mul: [1.25, 1.6],
  div: [1.5, 2.3],
};

function computeValue(op, stage, rng) {
  const [min, max] = VALUE_RANGES[op];
  const stageBias = 0.3 + stage * 0.18;
  const mix = Math.min(1, Math.max(0, stageBias + rng() * 0.7));
  const raw = min + (max - min) * mix;
  if (op === 'add' || op === 'sub') {
    return Math.round(raw);
  }

  return Number(raw.toFixed(2));
}

function computeRisk(op, stage) {
  const base = {
    add: 0.12,
    sub: 0.24,
    mul: 0.32,
    div: 0.38,
  }[op];

  return Number((base + stage * 0.07).toFixed(2));
}

function computeReward(op, value) {
  switch (op) {
    case 'add':
      return value * 1.4;
    case 'sub':
      return -value * 1.1;
    case 'mul':
      return (value - 1) * 42;
    case 'div':
      return -(1 - 1 / value) * 36;
    default:
      return 0;
  }
}

export function createGateOption(op, stage, rng = Math.random) {
  const config = OPERATION_CONFIG[op];
  if (!config) {
    throw new Error(`Unknown gate op: ${op}`);
  }

  const value = computeValue(op, stage, rng);
  const risk = computeRisk(op, stage);
  const reward = Number(computeReward(op, value).toFixed(2));
  const quality = Number((reward - risk * 18).toFixed(2));

  return {
    id: `${stage}-${op}`,
    stage,
    op,
    value,
    color: config.color,
    symbol: config.symbol,
    description: config.describe(value),
    risk,
    reward,
    quality,
  };
}

export function generateGateDeck({ stages = 3, seed } = {}) {
  const rng = createSeededRng(seed ?? Date.now().toString());
  const deck = [];
  for (let stage = 0; stage < stages; stage += 1) {
    const stageOptions = ['add', 'sub', 'mul', 'div'].map((op) =>
      createGateOption(op, stage, rng)
    );
    deck.push({ stage, options: stageOptions });
  }

  return deck;
}

export function applyGate(count, gate) {
  if (!gate || typeof gate.op !== 'string') {
    throw new Error('Gate is required');
  }

  switch (gate.op) {
    case 'add':
      return Math.max(0, count + gate.value);
    case 'sub':
      return Math.max(0, count - gate.value);
    case 'mul':
      return Math.round(count * gate.value);
    case 'div': {
      const divided = count / gate.value;
      return Math.max(1, Math.round(divided));
    }
    default:
      throw new Error(`Unsupported op: ${gate.op}`);
  }
}

export function describeGate(gate) {
  if (!gate) {
    return '';
  }

  const config = OPERATION_CONFIG[gate.op];
  if (!config) {
    return '';
  }

  return `${config.symbol}${gate.value}`;
}

export function evaluateGateQuality(selectedGates) {
  if (!selectedGates || selectedGates.length === 0) {
    return 0;
  }

  const totalQuality = selectedGates.reduce(
    (sum, gate) => sum + gate.quality,
    0
  );
  return Number((totalQuality / selectedGates.length).toFixed(2));
}
