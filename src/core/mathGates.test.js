import { applyGate, createGateOptions, rollValue } from './mathGates.js';

// why this test matters: gate math defines player counts and difficulty pacing.
describe('applyGate', () => {
  it('applies additive gates and clamps at zero', () => {
    expect(applyGate(10, { op: 'add', value: 5 })).toBe(15);
    expect(applyGate(10, { op: 'subtract', value: 20 })).toBe(0);
  });

  it('rounds multiplicative gates to nearest whole and clamps minimum', () => {
    expect(applyGate(10, { op: 'multiply', value: 1.5 })).toBe(15);
    expect(applyGate(10, { op: 'divide', value: 3.2 })).toBe(3);
    expect(applyGate(1, { op: 'divide', value: 3.2 })).toBe(1);
  });

  it('returns current value when gate is missing or unknown', () => {
    expect(applyGate(12)).toBe(12);
    expect(applyGate(12, { op: 'boost', value: 99 })).toBe(12);
  });
});

// why this test matters: gate rolls must stay within tuned ranges for balance.
describe('createGateOptions', () => {
  it('produces deterministic gates within expected ranges per seed', () => {
    const seed = 'alpha';
    const optionsA = createGateOptions(seed, { wave: 1 });
    const optionsB = createGateOptions(seed, { wave: 1 });
    expect(optionsA).toEqual(optionsB);
    optionsA.forEach((gate) => {
      switch (gate.op) {
        case 'add':
        case 'subtract':
          expect(gate.value).toBeGreaterThanOrEqual(2);
          expect(gate.value).toBeLessThanOrEqual(12);
          break;
        case 'multiply':
          expect(gate.value).toBeGreaterThanOrEqual(1.1);
          expect(gate.value).toBeLessThanOrEqual(2.2);
          break;
        case 'divide':
          expect(gate.value).toBeGreaterThanOrEqual(1.2);
          expect(gate.value).toBeLessThanOrEqual(3.5);
          break;
        default:
          throw new Error(`Unknown op ${gate.op}`);
      }
    });
  });

  it('falls back to zero when rolling a gate with no config', () => {
    const rng = () => 0.5;
    expect(rollValue('mystery', rng)).toBe(0);
  });

  it('creates options when wave is omitted', () => {
    const options = createGateOptions('beta');
    expect(options).toHaveLength(3);
  });
});
