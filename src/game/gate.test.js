import { applyGate, generateGateOptions, formatGateLabel } from './gate.js';
import { mulberry32 } from '../utils/random.js';

const OPERATORS_REGEX = /[+−×÷]/gu;

function countOperators(label) {
  if (!label) {
    return 0;
  }
  const matches = label.match(OPERATORS_REGEX);
  return matches ? matches.length : 0;
}

describe('applyGate', () => {
  // why this test matters: single-step math must obey spec rounding/clamping so unit counts stay predictable.
  test('enforces single-step rules from the spec', () => {
    expect(applyGate(10, { type: 'add', value: 5 })).toBe(15);
    expect(applyGate(10, { type: 'subtract', value: 15 })).toBe(0);
    expect(applyGate(9980, { type: 'add', value: 50 })).toBe(9999);
    expect(applyGate(10, { type: 'multiply', value: 1.6 })).toBe(16);
    expect(applyGate(10, { type: 'divide', value: 3.2 })).toBe(3);
    expect(applyGate(1, { type: 'divide', value: 99 })).toBe(1);
  });

  // why this test matters: composite gates unlock on later waves and must defer rounding/clamping until the full expression resolves.
  test('evaluates composite expressions without premature rounding', () => {
    const compositeGate = {
      type: 'composite',
      steps: [
        { type: 'divide', value: 3 },
        { type: 'multiply', value: 3 },
      ],
    };

    expect(applyGate(10, compositeGate)).toBe(10);
  });
});

describe('generateGateOptions', () => {
  // why this test matters: minus and divide gates must never be lethal or invalid per balance rules.
  test('never emits lethal subtract or invalid divide gates', () => {
    const seeds = Array.from({ length: 20 }, (_, index) => 100 + index);

    for (const seed of seeds) {
      const rng = mulberry32(seed);
      const [left, right] = generateGateOptions({
        rng,
        wave: 4,
        currentCount: 18,
      });
      const gates = [left, right];

      for (const gate of gates) {
        const result = applyGate(18, gate);
        if (gate.type === 'subtract') {
          expect(result).toBeGreaterThanOrEqual(1);
        }
        if (gate.type === 'divide') {
          expect(gate.value).toBeGreaterThanOrEqual(1);
          expect(result).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  // why this test matters: the delta between gates must hit spec targets so every choice feels meaningful.
  test.each([
    { wave: 1, minDelta: 0.15 },
    { wave: 7, minDelta: 0.25 },
    { wave: 12, minDelta: 0.35 },
  ])(
    'wave $wave gate pairs exceed the spec delta threshold',
    ({ wave, minDelta }) => {
      const rng = mulberry32(321 + wave);
      const currentCount = 40;
      const [left, right] = generateGateOptions({ rng, wave, currentCount });
      const projectedLeft = applyGate(currentCount, left);
      const projectedRight = applyGate(currentCount, right);
      const delta = Math.abs(projectedLeft - projectedRight) / currentCount;
      expect(delta).toBeGreaterThanOrEqual(minDelta);
    }
  );

  // why this test matters: early waves should offer simple arithmetic while later waves introduce composite expressions.
  test('wave 1 gates stay single-step while wave 7 unlocks composites', () => {
    const singleStepSeeds = Array.from({ length: 10 }, (_, index) => index);
    for (const seed of singleStepSeeds) {
      const rng = mulberry32(seed);
      const gates = generateGateOptions({ rng, wave: 1, currentCount: 12 });
      for (const gate of gates) {
        expect(countOperators(formatGateLabel(gate))).toBe(1);
      }
    }

    const compositeSeeds = Array.from(
      { length: 15 },
      (_, index) => 500 + index
    );
    const compositeFound = compositeSeeds.some((seed) => {
      const rng = mulberry32(seed);
      const gates = generateGateOptions({ rng, wave: 7, currentCount: 18 });
      return gates.some((gate) => countOperators(formatGateLabel(gate)) > 1);
    });

    expect(compositeFound).toBe(true);
  });
});
