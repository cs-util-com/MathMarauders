import fc from 'fast-check';
import { applyGate, generateGateSet, MAX_ARMY } from './gates.js';
import { createSeededRng } from './random.js';

// why this test matters: gate math underpins every forward decision; rounding/clamping must never break difficulty tuning.
test('generated gates respect rounding & clamp rules', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: MAX_ARMY }),
      fc.integer({ min: 1, max: 1000 }),
      (baseCount, wave) => {
        const rng = createSeededRng(wave);
        const gateSet = generateGateSet({ wave, baseCount, seed: rng });
        gateSet.options.forEach((gate) => {
          const { newCount } = applyGate(baseCount, gate);
          const multiplicative = gate.segments.some(
            (segment) =>
              segment.type === 'multiply' || segment.type === 'divide'
          );
          if (multiplicative) {
            expect(newCount).toBeGreaterThanOrEqual(1);
          } else {
            expect(newCount).toBeGreaterThanOrEqual(0);
          }
          expect(newCount).toBeLessThanOrEqual(MAX_ARMY);
        });
      }
    ),
    { numRuns: 120 }
  );
});

// why this test matters: composite templates must produce distinct strategic options to keep the forward run meaningful.
test('generated gate options produce meaningful deltas', () => {
  const baseCount = 40;
  const rng = createSeededRng('spec-delta');
  const gateSet = generateGateSet({ wave: 6, baseCount, seed: rng });
  const outcomes = gateSet.options.map(
    (gate) => applyGate(baseCount, gate).newCount
  );
  const ratio = Math.abs(outcomes[0] - outcomes[1]) / baseCount;
  expect(ratio).toBeGreaterThan(0.1);
});
