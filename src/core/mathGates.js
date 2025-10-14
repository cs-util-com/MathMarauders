import { createRng } from './random.js';

const GATE_RANGES = {
  add: { min: 2, max: 12, step: 1 },
  subtract: { min: 2, max: 12, step: 1 },
  multiply: { min: 1.1, max: 2.2, step: 0.1 },
  divide: { min: 1.2, max: 3.5, step: 0.1 },
};

const OPERATORS = ['add', 'subtract', 'multiply', 'divide'];

export function applyGate(current, gate) {
  if (!gate) return current;
  const value = gate.value;
  switch (gate.op) {
    case 'add':
      return Math.max(0, Math.round(current + value));
    case 'subtract':
      return Math.max(0, Math.round(current - value));
    case 'multiply': {
      const result = current * value;
      return Math.max(0, Math.round(result));
    }
    case 'divide': {
      const result = current / value;
      return Math.max(1, Math.round(result));
    }
    default:
      return current;
  }
}

export function createGateOptions(seed, { wave = 1 } = {}) {
  const rng = createRng(`${seed}-${wave}`);
  const ops = [...OPERATORS];
  // Fisher-Yates shuffle for deterministic uniqueness
  for (let i = ops.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [ops[i], ops[j]] = [ops[j], ops[i]];
  }
  const count = 3;
  const selected = ops.slice(0, count);
  return selected.map((op, index) => ({
    id: `${op}-${index}`,
    op,
    value: rollValue(op, rng),
  }));
}

export function rollValue(op, rng) {
  const config = GATE_RANGES[op];
  if (!config) return 0;
  const steps = Math.round((config.max - config.min) / config.step);
  const stepIndex = Math.floor(rng() * (steps + 1));
  const value = config.min + stepIndex * config.step;
  const rounded =
    Math.round((value + Number.EPSILON) / config.step) * config.step;
  return Number(rounded.toFixed(2));
}
